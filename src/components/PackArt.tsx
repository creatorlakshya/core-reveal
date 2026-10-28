import React from 'react';

// Heat-sealed foil edges: a zig-zag silhouette across the top and bottom
const TEETH = 28;
const TOOTH_DEPTH = 1.1; // % of pack height
const FOIL_OUTLINE = (() => {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= TEETH; i++) {
    const x = (i * 100) / TEETH;
    const odd = i % 2 === 1;
    top.push(`${x}% ${odd ? TOOTH_DEPTH : 0}%`);
    bottom.push(`${100 - x}% ${100 - (odd ? TOOTH_DEPTH : 0)}%`);
  }
  return `polygon(${[...top, ...bottom].join(',')})`;
})();

const SEAL_RIDGES =
  'repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0 calc(var(--u) * 0.6), rgba(165,188,214,0.3) calc(var(--u) * 0.6) calc(var(--u) * 1.2))';

const seal = (edge: 'top' | 'bottom'): React.CSSProperties => ({
  position: 'absolute',
  left: 0,
  right: 0,
  [edge]: 0,
  height: '9%',
  backgroundImage: `${SEAL_RIDGES}, linear-gradient(${edge === 'top' ? '180deg' : '0deg'}, rgba(0,0,0,0.55), rgba(0,0,0,0.05))`,
});

// 7 diamonds around a ring, one per member
const DIAMONDS = Array.from({ length: 7 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 7 - Math.PI / 2;
  return { x: 50 + 43 * Math.cos(a), y: 50 + 43 * Math.sin(a) };
});

const Emblem: React.FC = () => (
  <svg viewBox="0 0 100 100" style={{ width: 'calc(var(--u) * 46)', height: 'calc(var(--u) * 46)', overflow: 'visible' }}>
    <defs>
      <linearGradient id="pk-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff6c8" />
        <stop offset="0.45" stopColor="#e2b457" />
        <stop offset="1" stopColor="#8a5a1c" />
      </linearGradient>
      <radialGradient id="pk-disc" cx="0.35" cy="0.3" r="0.9">
        <stop offset="0" stopColor="#2c4a7a" />
        <stop offset="1" stopColor="#0a1226" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="33" fill="url(#pk-disc)" stroke="url(#pk-gold)" strokeWidth="3" />
    <circle cx="50" cy="50" r="27.5" fill="none" stroke="#A5BCD6" strokeOpacity="0.5" strokeWidth="0.8" strokeDasharray="1.5 2" />
    {DIAMONDS.map((d, i) => (
      <rect
        key={i}
        x={d.x - 2.6}
        y={d.y - 2.6}
        width="5.2"
        height="5.2"
        fill="url(#pk-gold)"
        transform={`rotate(45 ${d.x} ${d.y})`}
      />
    ))}
    <text
      x="50"
      y="62"
      textAnchor="middle"
      fontSize="38"
      fill="url(#pk-gold)"
      style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
    >
      E
    </text>
  </svg>
);

export const PackArt: React.FC = () => (
  <div className="absolute inset-0" style={{ clipPath: FOIL_OUTLINE }}>
    {/* Midnight foil body */}
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(175deg, #1a2b52 0%, #0d1730 45%, #090f21 70%, #1b1233 100%)' }}
    />
    {/* Holographic sheen */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(118deg, transparent 12%, rgba(165,188,214,0.16) 28%, rgba(245,239,198,0.14) 38%, rgba(214,170,230,0.14) 47%, rgba(140,230,210,0.12) 56%, transparent 72%)',
      }}
    />
    {/* Foil crinkle */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at 18% 22%, rgba(255,255,255,0.14), transparent 38%), radial-gradient(ellipse at 82% 64%, rgba(165,188,214,0.16), transparent 42%), repeating-linear-gradient(115deg, rgba(255,255,255,0.045) 0 calc(var(--u) * 0.8), transparent calc(var(--u) * 0.8) calc(var(--u) * 2.2))',
      }}
    />

    {/* Diagonal gold band */}
    <div
      className="absolute"
      style={{
        left: '-10%',
        right: '-10%',
        top: '58%',
        height: 'calc(var(--u) * 15)',
        transform: 'rotate(-12deg)',
        background: 'linear-gradient(180deg, #8a5a1c, #f1cf7a 30%, #fff1b8 50%, #d6a548 70%, #7a4c14)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center font-mono font-bold uppercase text-[#1a1008]"
        style={{ fontSize: 'calc(var(--u) * 3.4)', letterSpacing: '0.34em' }}
      >
        Collector Pack · 7 Cards
      </div>
    </div>

    {/* Crimped seals */}
    <div style={seal('top')} />
    <div style={seal('bottom')} />

    {/* Corner tags */}
    <div
      className="absolute font-mono uppercase text-[#A5BCD6]"
      style={{ top: '12%', left: '9%', fontSize: 'calc(var(--u) * 2.8)', letterSpacing: '0.25em' }}
    >
      Series 01
    </div>
    <div
      className="absolute font-mono uppercase text-[#F5EFC6]/80"
      style={{ top: '12%', right: '9%', fontSize: 'calc(var(--u) * 2.8)', letterSpacing: '0.25em' }}
    >
      MSRIT
    </div>

    {/* Emblem + title */}
    <div
      className="absolute left-0 right-0 flex flex-col items-center"
      style={{ top: '17%', gap: 'calc(var(--u) * 1.5)' }}
    >
      <Emblem />
      <div
        className="font-display"
        style={{
          fontSize: 'calc(var(--u) * 15)',
          lineHeight: 1,
          letterSpacing: '0.05em',
          backgroundImage: 'linear-gradient(180deg, #fffbe0, #e8c36a 55%, #a8721f)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
        }}
      >
        E-CELL
      </div>
      <div className="font-editorial italic text-[#A5BCD6]" style={{ fontSize: 'calc(var(--u) * 7)', lineHeight: 1 }}>
        The Seven
      </div>
    </div>

    {/* Footer */}
    <div
      className="absolute left-0 right-0 flex items-end justify-between"
      style={{ bottom: '12%', padding: '0 9%' }}
    >
      <div
        className="font-mono uppercase text-[#F5EFC6]/75"
        style={{ fontSize: 'calc(var(--u) * 2.6)', letterSpacing: '0.25em' }}
      >
        Orientation 2026
      </div>
      <div
        style={{
          width: 'calc(var(--u) * 18)',
          height: 'calc(var(--u) * 6)',
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(245,239,198,0.85) 0 calc(var(--u) * 0.4), transparent calc(var(--u) * 0.4) calc(var(--u) * 0.9), rgba(245,239,198,0.85) calc(var(--u) * 0.9) calc(var(--u) * 1.8), transparent calc(var(--u) * 1.8) calc(var(--u) * 2.2))',
        }}
      />
    </div>

    {/* Gloss */}
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(100deg, rgba(255,255,255,0.1) 0%, transparent 26%, transparent 70%, rgba(255,255,255,0.04) 100%)' }}
    />
    <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 0 40px rgba(0,0,0,0.5)' }} />
  </div>
);
