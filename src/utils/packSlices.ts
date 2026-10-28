// Pack geometry lives in a 100 x 150 unit box (1 unit = 1% of pack width), so
// slice angles are true on-screen angles for the 2:3 pack.
export type Pt = [number, number];

const PACK_W = 100;
export const PACK_H = 150;

export interface SliceDef {
  x: number;      // a point the cut passes through
  y: number;
  angle: number;  // cut direction in degrees
  push: number;   // how far each side recoils (units)
  spin: number;   // how far each side rotates (degrees)
}

// Largest distance (units) / tilt (degrees) a shard may end up from its original place
const MAX_DRIFT = 3.5;
const MAX_TILT = 1.5;

// Safety valve: the pack opens by itself at this many cuts to keep the DOM light
export const MAX_SLICES = 30;

export interface PackPiece {
  id: string;
  poly: Pt[];
  x: number; y: number; r: number;     // resting offset after the latest slice
  fx: number; fy: number; fr: number;  // offset before the latest slice
}

const RECT: Pt[] = [[0, 0], [PACK_W, 0], [PACK_W, PACK_H], [0, PACK_H]];

const area = (poly: Pt[]) => {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
};

// Sutherland–Hodgman clip of a convex polygon against one side of a line.
const clip = (poly: Pt[], nx: number, ny: number, c: number, sign: 1 | -1): Pt[] | null => {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = sign * (nx * a[0] + ny * a[1] - c);
    const db = sign * (nx * b[0] + ny * b[1] - c);
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out.length >= 3 && area(out) > 1 ? out : null;
};

// Cuts are in the pack's unrotated, unmoved frame at the moment they were made, but earlier
// cuts have already shifted/rotated the shards. Each cut is mapped into every shard's own
// frame before clipping, so a cut always lands where it was swiped.
export const computePieces = (cuts: SliceDef[]): PackPiece[] => {
  const cx = PACK_W / 2;
  const cy = PACK_H / 2;
  let pieces: PackPiece[] = [{ id: 'p', poly: RECT, x: 0, y: 0, r: 0, fx: 0, fy: 0, fr: 0 }];

  for (const s of cuts) {
    const rad = (s.angle * Math.PI) / 180;
    const nx = -Math.sin(rad);
    const ny = Math.cos(rad);
    const next: PackPiece[] = [];

    for (const p of pieces) {
      const inv = (-p.r * Math.PI) / 180;
      const cs = Math.cos(inv);
      const sn = Math.sin(inv);
      const toLocal = (vx: number, vy: number): Pt => [vx * cs - vy * sn, vx * sn + vy * cs];

      const [px, py] = toLocal(s.x - cx - p.x, s.y - cy - p.y);
      const [lnx, lny] = toLocal(nx, ny);
      const c = lnx * (px + cx) + lny * (py + cy);

      for (const sign of [1, -1] as const) {
        const poly = clip(p.poly, lnx, lny, c, sign);
        if (!poly) continue;
        // Shards only drift a little from their original spot, however many cuts are made
        let x = p.x + nx * s.push * sign;
        let y = p.y + ny * s.push * sign;
        const drift = Math.hypot(x, y);
        if (drift > MAX_DRIFT) {
          x *= MAX_DRIFT / drift;
          y *= MAX_DRIFT / drift;
        }
        next.push({
          id: p.id + (sign > 0 ? 'a' : 'b'),
          poly,
          fx: p.x, fy: p.y, fr: p.r,
          x,
          y,
          r: Math.max(-MAX_TILT, Math.min(MAX_TILT, p.r + s.spin * sign)),
        });
      }
    }
    pieces = next;
  }
  return pieces;
};

interface ScreenRect { left: number; top: number; width: number; height: number }

// Turn a mouse/touch swipe (screen px) into a cut across the pack, or null if the swipe
// is too short or doesn't actually pass over the pack. `k` = cuts made so far; later cuts
// recoil less so many cuts stay subtle and the shards stay on screen.
export const strokeToCut = (
  start: [number, number],
  end: [number, number],
  rect: ScreenRect,
  k: number
): SliceDef | null => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const len = Math.hypot(dx, dy);
  if (len < rect.width * 0.35) return null;

  // Liang–Barsky: the part of the swipe that lies over the pack
  let t0 = 0;
  let t1 = 1;
  const edge = (p: number, q: number) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  const crosses =
    edge(-dx, start[0] - rect.left) &&
    edge(dx, rect.left + rect.width - start[0]) &&
    edge(-dy, start[1] - rect.top) &&
    edge(dy, rect.top + rect.height - start[1]);
  if (!crosses || (t1 - t0) * len < rect.width * 0.3) return null;

  const tm = (t0 + t1) / 2;
  const ux = PACK_W / rect.width;
  const uy = PACK_H / rect.height;
  return {
    x: (start[0] + dx * tm - rect.left) * ux,
    y: (start[1] + dy * tm - rect.top) * uy,
    angle: (Math.atan2(dy * uy, dx * ux) * 180) / Math.PI,
    push: Math.max(0.5, 1.3 - k * 0.05),
    spin: Math.max(0.15, 0.5 - k * 0.02),
  };
};

// Stable per-shard pseudo-random number derived from the piece id
export const idHash = (id: string) => [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

// Where a piece flies when the pack bursts open: radially away from the pack centre.
export const exitVector = (p: PackPiece) => {
  const cx = p.poly.reduce((s, q) => s + q[0], 0) / p.poly.length + p.x - PACK_W / 2;
  const cy = p.poly.reduce((s, q) => s + q[1], 0) / p.poly.length + p.y - PACK_H / 2;
  const len = Math.hypot(cx, cy);
  const [dx, dy] = len < 1 ? [0, -1] : [cx / len, cy / len];
  const hash = idHash(p.id);
  const spin = (hash % 2 ? 1 : -1) * (40 + (hash % 40));
  return { x: dx * 230, y: dy * 230, r: spin };
};
