import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MAX_SLICES, PACK_H, SliceDef, computePieces, exitVector, idHash, strokeToCut } from '../utils/packSlices';
import { sound } from '../utils/audio';
import { PackArt } from './PackArt';

interface PackOpeningProps {
  cuts: SliceDef[];                  // cuts made so far
  exiting: boolean;                  // true once the pack bursts open
  onCut: (cut: SliceDef) => void;    // called when a swipe crosses the pack
  onOpen: () => void;                // called once the pack has sat idle after a cut
}

// Idle time after the last cut before the pack opens by itself
const PACK_IDLE_MS = 1500;

interface Spark { x: number; y: number; dx: number; dy: number; size: number; dur: number; color: string }
interface SlashFx { key: number; cx: number; cy: number; angle: number; len: number; sparks: Spark[] }
interface BurstFx { key: number; cx: number; cy: number }

const SPARK_COLORS = ['#ffffff', '#F5EFC6', '#A5BCD6'];

// Small per-shard float offsets (units / degrees) so shards don't bob in sync
const floatVars = (id: string): React.CSSProperties => {
  const h = idHash(id);
  const sign = (n: number) => (((h >> n) & 1) ? 1 : -1);
  return {
    '--fdx': sign(1) * (0.3 + (h % 4) * 0.12),
    '--fdy': sign(2) * (0.5 + (h % 5) * 0.12),
    '--fdr': sign(3) * (0.15 + (h % 3) * 0.1),
  } as React.CSSProperties;
};
const floatSecs = (id: string) => (2.6 + (idHash(id) % 7) * 0.25).toFixed(2);

const polyToClip = (poly: [number, number][]) =>
  `polygon(${poly.map(([x, y]) => `${x}% ${(y / PACK_H) * 100}%`).join(',')})`;

const Flash: React.FC<{ peak: number; secs: number }> = ({ peak, secs }) => (
  <div
    className="absolute inset-0 bg-[#F5EFC6]"
    style={{ '--flash': peak, animation: `pack-flash ${secs}s ease-out forwards`, opacity: 0 } as React.CSSProperties}
  />
);

const shake = (el: Element | null | undefined, mag: number) => {
  el?.animate(
    [
      { transform: 'translate(0, 0)' },
      { transform: `translate(${-mag}px, ${mag * 0.6}px)` },
      { transform: `translate(${mag * 0.8}px, ${-mag * 0.5}px)` },
      { transform: `translate(${-mag * 0.5}px, ${mag * 0.3}px)` },
      { transform: 'translate(0, 0)' },
    ],
    { duration: 280, easing: 'ease-out' }
  );
};

export const PackOpening: React.FC<PackOpeningProps> = ({ cuts, exiting, onCut, onOpen }) => {
  const slices = cuts.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const [slashes, setSlashes] = useState<SlashFx[]>([]);
  const [bursts, setBursts] = useState<BurstFx[]>([]);

  const pieces = useMemo(() => computePieces(cuts), [cuts]);

  const trailRef = useRef<SVGPolylineElement>(null);
  const onCutRef = useRef(onCut);
  onCutRef.current = onCut;
  const cutsMadeRef = useRef(slices);
  cutsMadeRef.current = slices;

  // Swipe to slice: press, then drag across the pack. A cut fires the moment the pointer
  // crosses over and out the other side, without releasing, so one drag can make many cuts
  // (zig-zag back and forth). Releasing while still over the pack cuts too.
  useEffect(() => {
    if (exiting) return;
    let trail: [number, number][] | null = null;
    let anchor: [number, number] | null = null; // last point the next cut is measured from
    let rect: DOMRect | null = null; // pack bounds, read once per press rather than per pointermove
    let made = 0;

    const draw = () => {
      const el = trailRef.current;
      if (!el || !trail) return;
      el.setAttribute('points', trail.map((q) => q.join(',')).join(' '));
      el.style.display = 'block';
    };
    const hide = () => {
      if (trailRef.current) trailRef.current.style.display = 'none';
      trail = null;
      anchor = null;
    };
    const inside = (r: DOMRect, x: number, y: number) =>
      x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

    const tryCut = (to: [number, number]): boolean => {
      if (!anchor || !rect) return false;
      const cut = strokeToCut(anchor, to, rect, made);
      if (!cut) return false;
      made++;
      onCutRef.current(cut);
      return true;
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if ((e.target as Element | null)?.closest('button')) return;
      anchor = [e.clientX, e.clientY];
      trail = [anchor];
      rect = rootRef.current?.getBoundingClientRect() ?? null;
      made = cutsMadeRef.current;
      draw();
    };
    const move = (e: PointerEvent) => {
      if (!trail || !anchor) return;
      const here: [number, number] = [e.clientX, e.clientY];
      trail.push(here);
      if (trail.length > 18) trail.shift();
      draw();

      // Only measure once the pointer is back outside the pack, i.e. it has crossed it
      if (rect && !inside(rect, here[0], here[1])) {
        tryCut(here);
        anchor = here;
      }
    };
    const up = (e: PointerEvent) => {
      tryCut([e.clientX, e.clientY]);
      hide();
    };

    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', hide);
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', hide);
      hide();
    };
  }, [exiting]);

  // Open the pack once no cut has landed for a while; each new cut restarts the wait
  useEffect(() => {
    if (slices === 0 || exiting) return;
    const timer = setTimeout(onOpen, slices >= MAX_SLICES ? 400 : PACK_IDLE_MS);
    return () => clearTimeout(timer);
  }, [slices, exiting]);

  // Sound, slash streak, sparks, flash and screen shake on every slice
  useEffect(() => {
    if (slices === 0 || exiting) return;
    const el = rootRef.current;
    if (!el) return;
    sound.playPackSlice(slices);

    const rect = el.getBoundingClientRect();
    const s = cuts[slices - 1];
    const rad = (s.angle * Math.PI) / 180;
    const cx = rect.left + (rect.width * s.x) / 100;
    const cy = rect.top + (rect.height * s.y) / PACK_H;
    const len = Math.hypot(rect.width, rect.height) * 1.25;
    const sparks: Spark[] = Array.from({ length: 9 }, () => {
      const t = (Math.random() - 0.5) * rect.width * 0.9;
      const side = Math.random() < 0.5 ? -1 : 1;
      const speed = 30 + Math.random() * 80;
      const along = (Math.random() - 0.5) * 40;
      return {
        x: cx + Math.cos(rad) * t,
        y: cy + Math.sin(rad) * t,
        dx: -Math.sin(rad) * side * speed + Math.cos(rad) * along,
        dy: Math.cos(rad) * side * speed + Math.sin(rad) * along + 20,
        size: 1.5 + Math.random() * 2,
        dur: 0.35 + Math.random() * 0.3,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      };
    });
    const fx: SlashFx = {
      key: slices,
      // the slash is centred on the cut and runs in the swipe direction
      cx: cx - (Math.cos(rad) * len) / 2,
      cy: cy - (Math.sin(rad) * len) / 2,
      angle: s.angle,
      len,
      sparks,
    };

    setSlashes((list) => [...list, fx]);
    shake(el.closest('main'), Math.min(2.5, 1.2 + slices * 0.1));
    const timer = setTimeout(() => setSlashes((list) => list.filter((f) => f.key !== fx.key)), 900);
    return () => {
      clearTimeout(timer);
      setSlashes((list) => list.filter((f) => f.key !== fx.key));
    };
  }, [slices, exiting]);

  // Shockwave when the pack bursts apart
  useEffect(() => {
    if (!exiting) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fx: BurstFx = { key: Date.now(), cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
    setBursts((list) => [...list, fx]);
    shake(el.closest('main'), 8);
    const timer = setTimeout(() => setBursts((list) => list.filter((f) => f.key !== fx.key)), 1100);
    return () => {
      clearTimeout(timer);
      setBursts((list) => list.filter((f) => f.key !== fx.key));
    };
  }, [exiting]);

  return (
    <>
      <div
        ref={rootRef}
        className="absolute inset-0 pointer-events-none"
        style={
          {
            '--u': 'calc(var(--cw) / 100)',
            transform: 'translateZ(60px) scale(1.08)',
            transformStyle: 'preserve-3d',
          } as React.CSSProperties
        }
      >
        {/* Light that pours through the cuts, so the cards inside are never visible before the burst */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            transform: `translateZ(-1px) scale(${exiting ? 1.12 : 1})`,
            opacity: exiting || slices === 0 ? 0 : Math.min(0.95, 0.55 + slices * 0.07),
            transition: exiting ? 'opacity 0.6s ease-out, transform 0.6s ease-out' : 'opacity 0.7s ease-out',
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(255,248,215,0.95), rgba(190,208,228,0.8) 55%, rgba(130,158,196,0.65))',
            boxShadow: '0 0 calc(var(--u) * 14) rgba(245,239,198,0.3)',
          }}
        >
          {cuts.map((c, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: `${(c.y / PACK_H) * 100}%`,
                width: '170%',
                height: 'calc(var(--u) * 1.6)',
                transform: `translate(-50%, -50%) rotate(${c.angle}deg)`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 25%, rgba(255,255,255,0.95) 75%, transparent)',
                  filter: 'blur(calc(var(--u) * 0.7))',
                  animation: 'pack-seam 1.1s ease-out forwards',
                }}
              />
            </div>
          ))}
        </div>

        {pieces.map((p) => {
          const exit = exiting ? exitVector(p) : null;
          // Shards move from where they were to where they now rest (or, on the burst, off-screen)
          const from = exit ? { x: p.x, y: p.y, r: p.r } : { x: p.fx, y: p.fy, r: p.fr };
          const to = exit ? { x: p.x + exit.x, y: p.y + exit.y, r: p.r + exit.r } : { x: p.x, y: p.y, r: p.r };
          const vars = {
            '--fx': from.x, '--fy': from.y, '--fr': from.r,
            '--tx': to.x, '--ty': to.y, '--tr': to.r,
          } as React.CSSProperties;

          return (
            <div
              key={`${exiting ? 'exit' : slices}-${p.id}`}
              className="absolute inset-0"
              style={{
                ...vars,
                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))',
                animation: exit
                  ? 'pack-piece-exit 0.7s cubic-bezier(0.45, 0, 0.9, 0.5) forwards'
                  : 'pack-piece-move 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.04s both',
              }}
            >
              {/* Idle float: each shard bobs gently in place, out of phase with the others */}
              <div
                className="absolute inset-0"
                style={{
                  ...floatVars(p.id),
                  animation: exit ? undefined : `pack-float ${floatSecs(p.id)}s ease-in-out 0.5s infinite`,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: polyToClip(p.poly),
                    animation: exit || slices === 0 ? undefined : 'pack-art-flash 0.4s ease-out 0.04s both',
                  }}
                >
                  <PackArt />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {createPortal(
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
          {/* Live swipe trail */}
          <svg className="absolute inset-0 w-full h-full">
            <polyline
              ref={trailRef}
              fill="none"
              stroke="rgba(245,239,198,0.75)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: 'none', filter: 'drop-shadow(0 0 4px rgba(245,239,198,0.6))' }}
            />
          </svg>
          {slashes.map((f) => (
            <React.Fragment key={f.key}>
              <Flash peak={0.1} secs={0.2} />
              <div
                className="absolute"
                style={{ left: f.cx, top: f.cy, width: f.len, height: 0, transform: `translate(0, -50%) rotate(${f.angle}deg)`, transformOrigin: '0 50%' }}
              >
                <div
                  className="absolute left-0"
                  style={{
                    top: -7,
                    width: '100%',
                    height: 14,
                    background: 'linear-gradient(90deg, rgba(165,188,214,0), rgba(165,188,214,0.3) 10%, rgba(245,239,198,0.25) 50%, rgba(165,188,214,0))',
                    filter: 'blur(5px)',
                    transformOrigin: '0 50%',
                    animation: 'pack-slash 0.42s ease-out forwards',
                  }}
                />
                <div
                  className="absolute left-0"
                  style={{
                    top: -1,
                    width: '100%',
                    height: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 12%, rgba(255,255,255,0.9) 88%, transparent)',
                    boxShadow: '0 0 6px 1px rgba(245,239,198,0.55)',
                    transformOrigin: '0 50%',
                    animation: 'pack-slash 0.42s ease-out forwards',
                  }}
                />
              </div>
              {f.sparks.map((sp, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={
                    {
                      left: sp.x,
                      top: sp.y,
                      width: sp.size,
                      height: sp.size,
                      background: sp.color,
                      boxShadow: `0 0 4px 1px ${sp.color}`,
                      '--dx': `${sp.dx}px`,
                      '--dy': `${sp.dy}px`,
                      animation: `pack-spark ${sp.dur}s cubic-bezier(0.1, 0.7, 0.3, 1) 0.05s forwards`,
                      opacity: 0,
                    } as React.CSSProperties
                  }
                />
              ))}
            </React.Fragment>
          ))}

          {bursts.map((b) => (
            <React.Fragment key={b.key}>
              <Flash peak={0.3} secs={0.4} />
              <div
                className="absolute rounded-full"
                style={{
                  left: b.cx, top: b.cy, width: 60, height: 60, margin: -30,
                  border: '3px solid #F5EFC6',
                  boxShadow: '0 0 30px 6px rgba(245,239,198,0.6), inset 0 0 30px 4px rgba(165,188,214,0.5)',
                  animation: 'pack-ring 0.7s cubic-bezier(0.15, 0.7, 0.3, 1) forwards',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  left: b.cx, top: b.cy, width: 420, height: 420, margin: -210,
                  background: 'radial-gradient(circle, rgba(245,239,198,0.75), rgba(165,188,214,0.25) 45%, transparent 70%)',
                  animation: 'pack-glow 0.75s ease-out forwards',
                }}
              />
            </React.Fragment>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};
