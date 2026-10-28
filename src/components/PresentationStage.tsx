import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MemberProfile, RevealPhase } from '../types';
import { PRESENTATION_CONFIG } from '../data/members';
import { StageCard, CardStatus, MOVE_MS, POP_MS, POP_STAGGER } from './StageCard';
import { MemberInfo } from './MemberInfo';
import { FinaleView } from './FinaleView';
import { PackOpening } from './PackOpening';
import { SliceDef } from '../utils/packSlices';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Maximize2, Minimize2, Undo2 } from 'lucide-react';

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
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(sound.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
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

  const handleAdvance = useCallback(() => {
    if (phase === 'DECK_READY' || phase === 'CARD_SHOWN') {
      if (cursor < total - 1) {
        moveCursor(cursor + 1, showCard);
      } else {
        // Last card goes to the back of the pile, then the finale
        moveCursor(total, () => {
          sound.playFinaleChime();
          setPhase('FINALE');
        });
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

  const handleJumpToMember = useCallback((idx: number) => {
    if (locked) return;
    clearTimers();
    moveCursor(idx, showCard);
  }, [locked]);

  const handleJumpToFinale = useCallback(() => {
    if (locked) return;
    clearTimers();
    sound.playFinaleChime();
    setCursor(total);
    setPhase('FINALE');
  }, [locked, total]);

  const toggleAudio = () => {
    const val = sound.toggle();
    setIsAudioEnabled(val);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
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
      } else if (e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        handleJumpToMember(parseInt(e.key, 10) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvance, handleBack, handleReset, handleJumpToMember, handleJumpToFinale]);

  const packSealed = phase === 'PACK_SEALED';
  const packPopping = phase === 'PACK_POPPING';
  const hint =
    packSealed
      ? 'SWIPE ACROSS THE PACK TO SLICE'
      : phase === 'DECK_READY'
      ? 'CLICK TO DRAW A CARD'
      : phase === 'CARD_SHOWN'
      ? cursor < total - 1 ? 'CLICK FOR NEXT CARD' : 'CLICK TO FINISH'
      : '';
  const drawn = Math.min(Math.max(cursor + 1, 0), total);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-[#4D0E12]"
      style={{ '--ch': 'min(42vh, 56vw)', '--cw': 'calc(var(--ch) * 2 / 3)', '--pile-x': '38vw' } as React.CSSProperties}
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

      {/* 3. Minimal floating controls: Unobtrusive 7-Member Progress & Audio/Fullscreen */}
      <div className="absolute top-5 right-6 z-40 flex items-center gap-4 pointer-events-auto">
        {/* Optional 7-Position Progress Indicator (toggleable via config) */}
        {PRESENTATION_CONFIG.showProgressIndicator && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/10 shadow-sm">
            <div className="flex items-center gap-1.5">
              {members.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 transition-all duration-300 rounded-full ${
                    i === cursor && phase !== 'FINALE'
                      ? 'w-4 bg-[#F5EFC6]'
                      : i < cursor || phase === 'FINALE'
                      ? 'w-1.5 bg-[#A5BCD6]'
                      : 'w-1.5 bg-white/25'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[11px] tracking-wider text-[#F5EFC6] font-semibold pl-1">
              {phase === 'FINALE' ? 'FINALE' : `0${drawn}/07`}
            </span>
          </div>
        )}

        {/* Minimal Audio & Fullscreen Actions */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-black/35 backdrop-blur-md border border-white/10">
          <button
            onClick={toggleAudio}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={isAudioEnabled ? "Sound Enabled (M)" : "Sound Muted (M)"}
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#A5BCD6]" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Back button: bottom-right, deliberately has no transitions or click animation */}
      {canGoBack && (
        <button
          onClick={handleBack}
          onMouseDown={(e) => e.preventDefault()}
          tabIndex={-1}
          className="absolute bottom-6 right-7 z-40 flex items-center gap-2.5 px-6 py-3.5 rounded-md bg-black/55 border-2 border-[#F5EFC6]/70 text-[#F5EFC6] font-mono text-sm tracking-[0.22em] uppercase font-bold hover:bg-black/75"
          title="Back to previous card (←)"
        >
          <Undo2 className="w-5 h-5" />
          Back
        </button>
      )}

      {/* 4. MAIN VIEWPORT — any click advances */}
      <main
        onClick={handleAdvance}
        className={`relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-6 perspective-container overflow-hidden touch-none ${
          packSealed ? 'cursor-crosshair' : 'cursor-pointer'
        }`}
      >
        {phase === 'FINALE' && (
          <FinaleView
            members={members}
            onSelectMember={(idx) => {
              setCursor(idx);
              setPhase('CARD_SHOWN');
            }}
            onReplay={handleReset}
          />
        )}

        {phase !== 'FINALE' && (
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
                  : i === cursor ? 'center' : 'left';
                // Left pile: undrawn cards on top, already-shown cards returned beneath them
                // (the most recently shown one at the very back)
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
                    popping={packPopping}
                    popDelay={(total - 1 - i) * POP_STAGGER}
                    instant={instant}
                  />
                );
              })}

              {(packSealed || packPopping) && <PackOpening cuts={cuts} exiting={packPopping} onCut={handleCut} onOpen={openPack} />}
            </div>

            {/* Description sits to the right of the middle card, clear of the left pile */}
            {phase === 'CARD_SHOWN' && cursor >= 0 && cursor < total && (
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  left: 'calc(50% + var(--cw) * 0.56 + 28px)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 'calc(var(--pile-x) - var(--cw) * 0.96 - 52px)',
                }}
              >
                <MemberInfo key={cursor} member={members[cursor]} instant={instant} />
              </div>
            )}

            {/* Advance hint */}
            <div
              className={`absolute top-5 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none transition-opacity duration-300 ${
                hint ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="font-mono text-xs tracking-[0.3em] uppercase font-bold text-[#F5EFC6]">{hint}</span>
              <div className="font-mono text-[9px] text-[#A5BCD6]/75 tracking-[0.2em] uppercase mt-0.5">
                {packSealed ? 'HOLD AND DRAG BACK AND FORTH' : 'SPACEBAR / CLICK TO ADVANCE'}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
