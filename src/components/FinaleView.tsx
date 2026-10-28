import React, { useState } from 'react';
import { MemberProfile } from '../types';
import { CardFront } from './CardFront';

interface FinaleViewProps {
  members: MemberProfile[];
  onSelectMember: (index: number) => void;
  onReplay: () => void;
}

export const FinaleView: React.FC<FinaleViewProps> = ({
  members,
  onSelectMember,
  onReplay,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Subtle rotations for collectible physical feel
  const rotations = [-1.0, 0.8, -0.6, 1.2, -0.8, 0.7, -1.0];

  return (
    <div className="absolute inset-0 z-30 w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 max-w-7xl mx-auto select-none">
      {/* 7-Card Showcase: 4 Top Row, 3 Bottom Row Centered */}
      <div className="w-full flex flex-col justify-center items-center gap-4 sm:gap-6 my-auto">
        {/* Row 1: 4 Cards */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 md:gap-5 w-full max-w-5xl">
          {members.slice(0, 4).map((member, idx) => (
            <div
              key={member.id}
              onClick={() => onSelectMember(idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="w-[150px] sm:w-[180px] md:w-[210px] aspect-[2/3] transition-all duration-300 transform cursor-pointer rounded-[12px]"
              style={{
                transform: `rotate(${hoveredIdx === idx ? 0 : rotations[idx]}deg) scale(${hoveredIdx === idx ? 1.05 : 1}) translateY(${hoveredIdx === idx ? -6 : 0}px)`,
                zIndex: hoveredIdx === idx ? 40 : 10,
                boxShadow: hoveredIdx === idx
                  ? '0 25px 45px rgba(0, 0, 0, 0.8)'
                  : '0 12px 25px rgba(0, 0, 0, 0.6)',
                animation: `finaleEntrance 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${idx * 0.08}s both`,
              }}
            >
              <CardFront
                imageSrc={member.frontArtwork}
                altText={member.name || `Member ${member.order}`}
              />
            </div>
          ))}
        </div>

        {/* Row 2: 3 Cards Centered */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 md:gap-5 w-full max-w-4xl">
          {members.slice(4, 7).map((member, idx) => {
            const actualIdx = idx + 4;
            return (
              <div
                key={member.id}
                onClick={() => onSelectMember(actualIdx)}
                onMouseEnter={() => setHoveredIdx(actualIdx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="w-[150px] sm:w-[180px] md:w-[210px] aspect-[2/3] transition-all duration-300 transform cursor-pointer rounded-[12px]"
                style={{
                  transform: `rotate(${hoveredIdx === actualIdx ? 0 : rotations[actualIdx]}deg) scale(${hoveredIdx === actualIdx ? 1.05 : 1}) translateY(${hoveredIdx === actualIdx ? -6 : 0}px)`,
                  zIndex: hoveredIdx === actualIdx ? 40 : 10,
                  boxShadow: hoveredIdx === actualIdx
                    ? '0 25px 45px rgba(0, 0, 0, 0.8)'
                    : '0 12px 25px rgba(0, 0, 0, 0.6)',
                  animation: `finaleEntrance 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${actualIdx * 0.08}s both`,
                }}
              >
                <CardFront
                  imageSrc={member.frontArtwork}
                  altText={member.name || `Member ${member.order}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Unobtrusive Replay Control at Bottom */}
      <div className="flex flex-col items-center gap-1.5 pt-4 z-40">
        <button
          onClick={onReplay}
          className="px-5 py-2 rounded-full border border-[#F5EFC6]/60 text-xs font-mono tracking-[0.25em] text-[#F5EFC6] hover:bg-[#F5EFC6] hover:text-[#4D0E12] transition-colors duration-200 font-bold uppercase backdrop-blur-sm"
        >
          REPLAY EXPERIENCE
        </button>
        <span className="font-mono text-[9px] text-[#F5EFC6]/50 tracking-widest uppercase">
          CLICK ANY CARD TO INSPECT • PRESS 'R' TO RESTART
        </span>
      </div>

      <style>{`
        @keyframes finaleEntrance {
          0% {
            opacity: 0;
            transform: translateY(25px) scale(0.92);
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
