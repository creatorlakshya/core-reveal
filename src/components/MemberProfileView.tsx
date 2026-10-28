import React from 'react';
import { MemberProfile } from '../types';
import { CardFront } from './CardFront';

interface MemberProfileViewProps {
  member: MemberProfile;
  isExpanding: boolean;
  isContracting: boolean;
  onAdvance?: () => void;
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  member,
  isExpanding,
  isContracting,
  onAdvance,
}) => {
  return (
    <div
      onClick={onAdvance}
      className={`absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-8 cursor-pointer select-none transition-all duration-500 ease-out ${
        isExpanding
          ? 'opacity-0 scale-95'
          : isContracting
          ? 'opacity-0 scale-95'
          : 'opacity-100 scale-100'
      }`}
    >
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14">
        {/* Left Column: Reusable Card with Front Artwork */}
        <div
          className="w-[260px] sm:w-[300px] md:w-[340px] aspect-[2/3] flex-shrink-0 rounded-[14px] overflow-hidden"
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <CardFront imageSrc={member.frontArtwork} altText={member.name || `Member ${member.order}`} />
        </div>

        {/* Right Column: Optional Editorial Member Information */}
        <div className="flex-1 max-w-lg text-left flex flex-col justify-center space-y-4 bg-black/35 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/10 shadow-xl">
          {/* Member Name */}
          {member.name && (
            <div className="space-y-1">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F5EFC6] leading-tight"
                style={{
                  fontFamily: 'var(--font-serif)',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
                }}
              >
                {member.name}
              </h1>
              {member.designation && (
                <h2
                  className="text-base sm:text-lg font-serif italic text-[#A5BCD6] font-medium"
                  style={{ fontFamily: 'var(--font-serif-sub)' }}
                >
                  {member.designation}
                </h2>
              )}
            </div>
          )}

          {/* Description */}
          {member.description && (
            <p
              className="text-sm sm:text-base text-[#F5EFC6]/90 leading-relaxed font-light"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {member.description}
            </p>
          )}

          {/* Optional Achievement / Milestone */}
          {member.achievement && (
            <div
              className="p-3.5 sm:p-4 rounded-xl border backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(35, 24, 21, 0.45)',
                borderColor: 'rgba(245, 239, 198, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A5BCD6]" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-[#A5BCD6] uppercase font-bold">
                  HIGHLIGHT
                </span>
              </div>
              <p
                className="text-xs sm:text-sm italic text-[#F5EFC6]/95 leading-relaxed"
                style={{ fontFamily: 'var(--font-serif-sub)' }}
              >
                "{member.achievement}"
              </p>
            </div>
          )}

          {/* Subtle Advance Prompt */}
          <div className="pt-2 flex items-center gap-2 text-[#F5EFC6]/50">
            <span className="font-mono text-[10px] tracking-widest uppercase">
              SPACEBAR / CLICK TO ADVANCE
            </span>
            <span className="text-xs">→</span>
          </div>
        </div>
      </div>
    </div>
  );
};
