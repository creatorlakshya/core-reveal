import React, { useState } from 'react';
import { MemberProfile } from '../types';

interface MemberInfoProps {
  member: MemberProfile;
  instant?: boolean; // appear with no fade-in
}

export const MemberInfo: React.FC<MemberInfoProps> = ({ member, instant = false }) => {
  // Decided once per mount so toggling `instant` later can't replay the fade
  const [animate] = useState(!instant);
  const shadow = '0 1px 8px rgba(0, 0, 0, 0.8)';

  return (
    <div
      className="w-full text-left flex flex-col items-start gap-3"
      style={{ animation: animate ? 'info-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.05s both' : undefined }}
    >
      {member.name && (
        <h1
          className="text-3xl lg:text-4xl font-bold text-[#F5EFC6] leading-tight"
          style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.01em', textShadow: '0 2px 14px rgba(0, 0, 0, 0.8)' }}
        >
          {member.name}
        </h1>
      )}
      {member.designation && (
        <h2 className="text-lg italic text-[#A5BCD6] font-medium" style={{ fontFamily: 'var(--font-serif-sub)' }}>
          {member.designation}
        </h2>
      )}
      {member.description && (
        <p
          className="text-sm lg:text-base text-[#F5EFC6]/90 leading-relaxed font-light"
          style={{ fontFamily: 'var(--font-sans)', textShadow: shadow }}
        >
          {member.description}
        </p>
      )}
      {member.achievement && (
        <p
          className="text-sm lg:text-base italic text-[#F5EFC6]/95 leading-relaxed"
          style={{ fontFamily: 'var(--font-serif-sub)', textShadow: shadow }}
        >
          <span className="font-mono not-italic text-[9px] tracking-[0.2em] text-[#A5BCD6] uppercase font-bold mr-2">
            Highlight
          </span>
          "{member.achievement}"
        </p>
      )}
    </div>
  );
};
