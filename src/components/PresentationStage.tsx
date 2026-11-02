import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MemberProfile, RevealPhase } from '../types';
import { PRESENTATION_CONFIG } from '../data/members';
import { StageCard, CardStatus, MOVE_MS, POP_MS, POP_STAGGER } from './StageCard';
import { PackOpening } from './PackOpening';
import { SliceDef } from '../utils/packSlices';
import { sound } from '../utils/audio';

interface PresentationStageProps {
  members: MemberProfile[];
}

export const PresentationStage: React.FC<PresentationStageProps> = ({ members }) => {
  const [phase, setPhase] = useState<RevealPhase>('PACK_SEALED');
  const [cuts, setCuts] = useState<SliceDef[]>([]);
  // Card layout is derived from one cursor: cards before it have been shown and are back in the left pile,
  // the card at it is in the middle, cards after it are in the left pile.
  // -1 = nothing drawn yet.
  const [cursor, setCursor] = useState<number>(-1);
  // True while the back button rewinds: every card/description change is applied with no animation
  const [instant, setInstant] = useState<boolean>(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const total = members.length;

  const schedule = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // Input is ignored while cards are mid-flight (derived, so it can't drift from the phase)
  const locked = phase === 'PACK_POPPING' || phase === 'CARD_MOVING';
  const canGoBack = phase === 'CARD_MOVING' || phase === 'CARD_SHOWN' || phase === 'FINALE';

  // Burst the pack and pop the deck out to the left pile
  const openPack = () => {
    sound.playPackBurst();
    setPhase('PACK_POPPING');
    // DECK_READY once the last (front) card has landed
    schedule(() => setPhase('DECK_READY'), POP_MS + (total - 1) * POP_STAGGER + 20);
  };

  useEffect(() => clearTimers, []);

  // Slide the cursor to a new card, then settle into `then`
  const moveCursor = (next: number, then: () => void) => {
    setCursor(next);
    setPhase('CARD_MOVING');
    sound.playCardDraw();
    schedule(() => sound.playCardFlip(), Math.round(MOVE_MS * 0.32));
    schedule(then, MOVE_MS);
  };

  const showCard = () => {
    sound.playRevealStinger();
    setPhase('CARD_SHOWN');
  };

  const enterFinale = () => {
    clearTimers();
    sound.playFinaleChime();
    setCursor(total);
    setPhase('FINALE');
  };

  const handleAdvance = useCallback(() => {
    if (phase === 'DECK_READY' || phase === 'CARD_SHOWN') {
      if (cursor < total - 1) {
        moveCursor(cursor + 1, showCard);
      } else {
        // Every card has been shown: spread them across the screen
        enterFinale();
      }
    }
  }, [phase, cursor, total]);

  // A swipe crossed the pack (PackOpening opens it itself once the swiping stops)
  const handleCut = useCallback((cut: SliceDef) => setCuts((list) => [...list, cut]), []);

  // Instant rewind to the previous card: cancels any move in progress and skips all animation
  const handleBack = useCallback(() => {
    if (!canGoBack) return;

    clearTimers();
    setInstant(true);
    if (phase === 'FINALE') {
      setCursor(total - 1);
      setPhase('CARD_SHOWN');
    } else if (cursor > 0) {
      setCursor(cursor - 1);
      setPhase('CARD_SHOWN');
    } else {
      setCursor(-1);
      setPhase('DECK_READY');
    }
    // Re-enable transitions only after the un-animated layout has been painted
    requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
  }, [canGoBack, phase, cursor, total]);

  const handleReset = useCallback(() => {
    clearTimers();
    setCursor(-1);
    setCuts([]);
    setPhase('PACK_SEALED');
  }, []);

  // Number keys (and clicking a card in the finale): jump straight to a card. Works mid-move
  // too (the move in flight is cancelled); only the sealed pack has nothing to jump to yet.
  const handleJumpToMember = useCallback((idx: number) => {
    if (phase === 'PACK_SEALED' || phase === 'PACK_POPPING' || idx < 0 || idx >= total) return;
    if (idx === cursor && phase === 'CARD_SHOWN') return;
    clearTimers();
    moveCursor(idx, showCard);
  }, [phase, cursor, total]);

  const handleJumpToFinale = useCallback(() => {
    if (locked) return;
    enterFinale();
  }, [locked, total]);

  const toggleAudio = () => sound.toggle();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard controls with repeat guard and preventDefault
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Prevent repeated action on key hold

      if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleAdvance();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      } else if (e.key === 'r' || e.key === 'R' || e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'f' || e.key === 'F' || e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M' || e.code === 'KeyM') {
        e.preventDefault();
        toggleAudio();
      } else if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
        e.preventDefault();
        handleJumpToFinale();
      } else if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        handleJumpToMember(parseInt(e.key, 10) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvance, handleBack, handleReset, handleJumpToMember, handleJumpToFinale]);

  const packSealed = phase === 'PACK_SEALED';
  const packPopping = phase === 'PACK_POPPING';
  const finale = phase === 'FINALE';
  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-[#4D0E12]"
      style={{ '--ch': 'min(46vh, 60vw)', '--cw': 'calc(var(--ch) * 2 / 3)', '--pile-x': '38vw', '--spread-x': 'min(15vw, calc(var(--cw) * 0.95))', '--spread-y': 'calc(var(--ch) * 0.86)' } as React.CSSProperties}
    >
      {/* 1. Replaceable Presentation Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
        style={{
          backgroundImage: `url(${PRESENTATION_CONFIG.backgroundImage})`,
        }}
      />

      {/* 2. Configurable subtle dark overlay for contrast */}
      {PRESENTATION_CONFIG.backgroundOverlayOpacity > 0 && (
        <div
          className="absolute inset-0 z-[1] pointer-events-none bg-black transition-opacity duration-500"
          style={{ opacity: PRESENTATION_CONFIG.backgroundOverlayOpacity }}
        />
      )}

      {/* Title */}
      <h1
        className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none font-pixel text-[#F5EFC6] whitespace-nowrap"
        style={{
          fontSize: 'clamp(16px, 2.4vw, 36px)',
          letterSpacing: '0.14em',
          textShadow: '3px 3px 0 #231815, 0 0 18px rgba(245, 239, 198, 0.25)',
        }}
      >
        CORE TEAM
      </h1>

      {/* 4. MAIN VIEWPORT — any click advances */}
      <main
        onClick={handleAdvance}
        className={`relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-6 perspective-container overflow-hidden touch-none ${
          packSealed ? 'cursor-crosshair' : 'cursor-pointer'
        }`}
      >
        {(
          <>
            {/* Card anchor: left pile -> middle -> back of the left pile, all laid out around this box */}
            <div
              className="absolute left-1/2 top-1/2 preserve-3d"
              style={{
                width: 'var(--cw)',
                height: 'var(--ch)',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {members.map((member, i) => {
                const status: CardStatus = packSealed
                  ? 'pack'
                  : finale ? 'spread' : i === cursor ? 'center' : 'left';
                // Left pile: undrawn cards on top, already-shown cards returned beneath them
                // (the most recently shown one at the very back)
                // Finale layout: the first four cards on the top row, the rest centred below
                const topRow = Math.ceil(total / 2);
                const row = i < topRow ? 0 : 1;
                const slot = row === 0 ? i - (topRow - 1) / 2 : i - topRow - (total - topRow - 1) / 2;
                const rank =
                  status === 'pack' ? i
                  : status === 'left' ? (i > cursor ? i - (cursor + 1) : total - 1 - cursor + i)
                  : 0;

                return (
                  <StageCard
                    key={member.id}
                    frontSrc={member.frontArtwork}
                    backSrc={member.backArtwork || PRESENTATION_CONFIG.defaultCardBack}
                    altText={member.name || `Member ${member.order}`}
                    status={status}
                    rank={rank}
                    popping={packPopping || finale}
                    popDelay={finale ? i * 70 : (total - 1 - i) * POP_STAGGER}
                    slot={slot}
                    row={row}
                    onSelect={finale ? () => handleJumpToMember(i) : undefined}
                    instant={instant}
                  />
                );
              })}

              {(packSealed || packPopping) && <PackOpening cuts={cuts} exiting={packPopping} onCut={handleCut} onOpen={openPack} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
