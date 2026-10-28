import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MemberProfile, RevealPhase } from '../types';
import { PRESENTATION_CONFIG } from '../data/members';
import { CardBack } from './CardBack';
import { CardFront } from './CardFront';
import { MemberProfileView } from './MemberProfileView';
import { FinaleView } from './FinaleView';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

interface PresentationStageProps {
  members: MemberProfile[];
}

export const PresentationStage: React.FC<PresentationStageProps> = ({ members }) => {
  const [phase, setPhase] = useState<RevealPhase>('DECK_READY');
  const [memberIndex, setMemberIndex] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(sound.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [animatingLock, setAnimatingLock] = useState<boolean>(false);

  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMember = members[memberIndex] || members[0];

  // Interaction lock during active card animations to prevent rapid skipping
  const triggerTransitionLock = (ms: number) => {
    setAnimatingLock(true);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      setAnimatingLock(false);
    }, ms);
  };

  // Advance state machine
  const handleAdvance = useCallback(() => {
    if (animatingLock) return;

    if (phase === 'DECK_READY') {
      sound.playCardDraw();
      setPhase('CARD_DRAWING');
      triggerTransitionLock(700);

      setTimeout(() => {
        sound.playCardFlip();
        setPhase('CARD_FLIPPING');
        triggerTransitionLock(850);

        setTimeout(() => {
          sound.playRevealStinger();
          setPhase('PORTRAIT_REVEALED');
          setAnimatingLock(false);
        }, 800);
      }, 650);
    } else if (phase === 'PORTRAIT_REVEALED') {
      setPhase('PROFILE_EXPANDING');
      triggerTransitionLock(550);

      setTimeout(() => {
        setPhase('PROFILE_VISIBLE');
        setAnimatingLock(false);
      }, 500);
    } else if (phase === 'PROFILE_VISIBLE') {
      setPhase('PROFILE_CONTRACTING');
      triggerTransitionLock(500);

      setTimeout(() => {
        sound.playCardTuck();
        setPhase('CARD_RETURNING');
        triggerTransitionLock(750);

        setTimeout(() => {
          if (memberIndex >= members.length - 1) {
            // All seven members revealed -> enter Grand Collective Finale
            sound.playFinaleChime();
            setPhase('FINALE');
            setAnimatingLock(false);
          } else {
            // Advance to next member
            setMemberIndex((prev) => prev + 1);
            setPhase('DECK_READY');
            setAnimatingLock(false);
          }
        }, 700);
      }, 450);
    }
  }, [phase, memberIndex, members.length, animatingLock]);

  // Backward navigation
  const handleBack = useCallback(() => {
    if (animatingLock) return;

    if (phase === 'PROFILE_VISIBLE') {
      setPhase('PORTRAIT_REVEALED');
    } else if (phase === 'PORTRAIT_REVEALED') {
      setPhase('DECK_READY');
    } else if (phase === 'DECK_READY') {
      if (memberIndex > 0) {
        setMemberIndex((prev) => prev - 1);
        setPhase('PROFILE_VISIBLE');
      }
    } else if (phase === 'FINALE') {
      setMemberIndex(members.length - 1);
      setPhase('PROFILE_VISIBLE');
    }
  }, [phase, memberIndex, members.length, animatingLock]);

  const handleReset = useCallback(() => {
    setMemberIndex(0);
    setPhase('DECK_READY');
    setAnimatingLock(false);
  }, []);

  const handleJumpToMember = useCallback((idx: number) => {
    if (animatingLock) return;
    setMemberIndex(idx);
    sound.playCardDraw();
    setPhase('PORTRAIT_REVEALED');
  }, [animatingLock]);

  const handleJumpToFinale = useCallback(() => {
    if (animatingLock) return;
    sound.playFinaleChime();
    setPhase('FINALE');
  }, [animatingLock]);

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

  // Physical cards remaining in the deck behind the active card
  const cardsRemainingInDeck = Math.max(0, members.length - memberIndex - 1);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#4D0E12]">
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
                    i === memberIndex && phase !== 'FINALE'
                      ? 'w-4 bg-[#F5EFC6]'
                      : i < memberIndex || phase === 'FINALE'
                      ? 'w-1.5 bg-[#A5BCD6]'
                      : 'w-1.5 bg-white/25'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[11px] tracking-wider text-[#F5EFC6] font-semibold pl-1">
              {phase === 'FINALE' ? 'FINALE' : `0${memberIndex + 1}/07`}
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

      {/* 4. MAIN VIEWPORT / BALANCED CENTRED STAGE */}
      <main className="relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-6 perspective-container overflow-hidden">
        {/* SCENE A: GRAND COLLECTIVE FINALE */}
        {phase === 'FINALE' && (
          <FinaleView
            members={members}
            onSelectMember={(idx) => {
              setMemberIndex(idx);
              setPhase('PROFILE_VISIBLE');
            }}
            onReplay={handleReset}
          />
        )}

        {/* SCENE B: FULL-SCREEN EDITORIAL MEMBER PROFILE */}
        {(phase === 'PROFILE_EXPANDING' ||
          phase === 'PROFILE_VISIBLE' ||
          phase === 'PROFILE_CONTRACTING') && (
          <MemberProfileView
            member={currentMember}
            isExpanding={phase === 'PROFILE_EXPANDING'}
            isContracting={phase === 'PROFILE_CONTRACTING'}
            onAdvance={handleAdvance}
          />
        )}

        {/* SCENE C: CENTRED STATIONARY DECK & 3D ACTIVE CARD */}
        {phase !== 'FINALE' && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center z-20 transition-opacity duration-500 ${
              phase === 'PROFILE_VISIBLE' ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* Stationary Deck Base — Perfectly centered, no lateral drift */}
            <div
              className="relative preserve-3d"
              style={{
                width: 'clamp(280px, 24vw, 360px)',
                aspectRatio: '2 / 3',
                transform: 'rotateX(10deg)', // Centered pitch without sideways rotateY!
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Offset Card Layers Behind Active Card (stationary stack depth) */}
              {Array.from({ length: Math.min(cardsRemainingInDeck, 4) }).map((_, i) => {
                const depth = (i + 1) * -6;
                const yOffset = (i + 1) * 3;

                return (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-[14px] pointer-events-none transition-all duration-500 overflow-hidden"
                    style={{
                      transform: `translate3d(0px, ${yOffset}px, ${depth}px)`,
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.65)',
                    }}
                  >
                    <img
                      src={currentMember.backArtwork || PRESENTATION_CONFIG.defaultCardBack}
                      alt="Deck stack card"
                      className="w-full h-full object-contain rounded-[14px] pointer-events-none opacity-90"
                      draggable={false}
                    />
                  </div>
                );
              })}

              {/* THE ACTIVE CARD — Perfectly centered lift, 3D flip, and return */}
              <div
                className="absolute inset-0 rounded-[14px] preserve-3d cursor-pointer"
                onClick={handleAdvance}
                style={{
                  transition:
                    phase === 'CARD_DRAWING'
                      ? 'all 0.75s cubic-bezier(0.2, 0.9, 0.3, 1)'
                      : phase === 'CARD_FLIPPING'
                      ? 'transform 0.85s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.85s ease'
                      : phase === 'CARD_RETURNING'
                      ? 'all 0.75s cubic-bezier(0.6, 0.05, 0.2, 1)'
                      : 'transform 0.4s ease-out, box-shadow 0.4s ease-out',
                  transform:
                    phase === 'DECK_READY'
                      ? 'translate3d(0, 0, 4px) rotateY(0deg)'
                      : phase === 'CARD_DRAWING'
                      ? 'translate3d(0, -65px, 90px) rotateY(0deg) scale(1.04)'
                      : phase === 'CARD_FLIPPING'
                      ? 'translate3d(0, -35px, 130px) rotateY(180deg) scale(1.08)'
                      : phase === 'PORTRAIT_REVEALED'
                      ? 'translate3d(0, -25px, 120px) rotateY(180deg) scale(1.08)'
                      : phase === 'CARD_RETURNING'
                      ? 'translate3d(0, 60px, -30px) rotateY(0deg) scale(0.95)'
                      : 'translate3d(0, 0, 0)',
                  boxShadow:
                    phase === 'CARD_FLIPPING' || phase === 'PORTRAIT_REVEALED'
                      ? '0 35px 75px -15px rgba(0, 0, 0, 0.85), 0 0 25px rgba(245, 239, 198, 0.15)'
                      : '0 14px 32px rgba(0, 0, 0, 0.65)',
                }}
              >
                {/* Card Back Face (0 deg) */}
                <div className="absolute inset-0 backface-hidden">
                  <CardBack
                    imageSrc={currentMember.backArtwork || PRESENTATION_CONFIG.defaultCardBack}
                  />
                </div>

                {/* Card Front Face (180 deg) */}
                <div
                  className="absolute inset-0 backface-hidden"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <CardFront
                    imageSrc={currentMember.frontArtwork}
                    altText={currentMember.name || `Member ${currentMember.order}`}
                  />
                </div>
              </div>
            </div>

            {/* Advance affordance prompt below centered deck */}
            <div
              onClick={handleAdvance}
              className="mt-8 flex flex-col items-center gap-1 cursor-pointer text-center group"
            >
              <span className="font-mono text-xs sm:text-sm tracking-[0.3em] uppercase font-bold text-[#F5EFC6] group-hover:text-white transition-colors">
                {phase === 'DECK_READY'
                  ? 'PRESS TO REVEAL'
                  : phase === 'PORTRAIT_REVEALED'
                  ? 'EXPAND PROFILE'
                  : 'ADVANCE'}
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] text-[#A5BCD6]/75 tracking-[0.2em] uppercase">
                SPACEBAR / CLICK TO ADVANCE
              </span>
              <div className="w-12 h-[1px] bg-[#F5EFC6]/40 group-hover:w-20 transition-all duration-300 mt-0.5" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
