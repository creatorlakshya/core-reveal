import React, { useEffect, useRef } from 'react';
import { CardBack } from './CardBack';
import { CardFront } from './CardFront';

export type CardStatus = 'pack' | 'left' | 'center';

interface StageCardProps {
  frontSrc: string;
  backSrc: string;
  altText: string;
  status: CardStatus;
  rank: number;        // depth within its pile (0 = top of the pile)
  popping: boolean;    // pack is bursting: fly out to the left pile with a stagger
  popDelay: number;
  instant: boolean;    // skip every transition/animation (used by the back button)
}

export const MOVE_MS = 650;
// Pack burst: each card flies out POP_MS after its stagger delay (back of the deck first)
export const POP_MS = 900;
export const POP_STAGGER = 55;

// The CSS transition moves a card in a straight line; this lifts it out along `peak` and back
// so the net path is a curve.
const arc = (el: HTMLElement, peak: string, offset: number, duration: number, delay = 0) =>
  el.animate(
    [
      { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
      { transform: peak, offset },
      { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
    ],
    { duration, delay, easing: 'ease-in-out' }
  );

const transformFor = (status: CardStatus, rank: number) => {
  const y = rank * 2.5;
  const z = -rank * 5;
  switch (status) {
    case 'pack':
      return `translate3d(0px, ${y + 10}px, ${z - 30}px) scale(0.94)`;
    case 'left':
      return `translate3d(calc(-1 * var(--pile-x)), ${y}px, ${z}px) rotateY(9deg) scale(0.8)`;
    case 'center':
      return 'translate3d(0px, 0px, 40px) scale(1.12)';
  }
};

export const StageCard: React.FC<StageCardProps> = React.memo(({
  frontSrc,
  backSrc,
  altText,
  status,
  rank,
  popping,
  popDelay,
  instant,
}) => {
  const hopRef = useRef<HTMLDivElement>(null);
  const prevStatus = useRef<CardStatus>(status);

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    if (prev === status || !hopRef.current || instant) return;

    if (prev === 'pack') {
      arc(hopRef.current, `translate3d(0, -150px, 120px) rotate(${rank % 2 ? 6 : -6}deg)`, 0.4, POP_MS, popDelay);
    } else if (status === 'left') {
      // Leaving the middle: sweeps down and behind in a curve to the back of the left pile
      arc(hopRef.current, 'translate3d(0, 120px, -90px)', 0.5, MOVE_MS);
    } else {
      // Coming into the middle: rises up and forward on the opposite side of the curve
      arc(hopRef.current, 'translate3d(0, -50px, 160px)', 0.5, MOVE_MS);
    }
  }, [status]);

  const faceUp = status === 'center';

  return (
    <div
      className="absolute inset-0 preserve-3d"
      style={{
        transform: transformFor(status, rank),
        opacity: status === 'pack' ? 0 : 1, // cards stay invisible inside the sealed pack
        transition: instant
          ? 'none'
          : popping
          ? `transform ${POP_MS}ms cubic-bezier(0.2, 0.9, 0.3, 1) ${popDelay}ms, opacity 0.2s`
          : `transform ${MOVE_MS}ms cubic-bezier(0.55, 0, 0.2, 1), opacity 0.2s`,
      }}
    >
      <div ref={hopRef} className="absolute inset-0 preserve-3d">
        <div
          className="absolute inset-0 preserve-3d rounded-[14px]"
          style={{
            transform: `rotateY(${faceUp ? 180 : 0}deg)`,
            transition: instant ? 'none' : `transform ${MOVE_MS}ms cubic-bezier(0.45, 0, 0.25, 1), box-shadow 0.5s`,
            boxShadow:
              status === 'center'
                ? '0 35px 75px -15px rgba(0, 0, 0, 0.85), 0 0 30px rgba(245, 239, 198, 0.2)'
                : '0 12px 24px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div className="absolute inset-0 backface-hidden">
            <CardBack imageSrc={backSrc} />
          </div>
          <div className="absolute inset-0 backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
            <CardFront imageSrc={frontSrc} altText={altText} />
          </div>
        </div>
      </div>
    </div>
  );
});
