# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on port 3000
- `npm run build` — `tsc && vite build` (type-check is the only static check; there is no linter or test suite)
- `npm run preview` — serve the production build
- `node scripts/generate-assets.cjs` — regenerates the placeholder PNG/JPG artwork in `public/assets/` (dependency-free PNG encoder)

## Architecture

A single-page React 18 + Vite + Tailwind v4 (`@tailwindcss/vite`) presentation: a seven-card reveal for MSRIT E-Cell Orientation. No router, no backend, no global state library.

- **State machine lives in `src/components/PresentationStage.tsx`.** It owns `phase` (`RevealPhase` in `src/types/index.ts`), `cuts` and `cursor`. Flow: `PACK_SEALED` (slices come from mouse/touch swipes, not clicks; `PackOpening` opens it by itself `PACK_IDLE_MS` after the last cut) → `PACK_POPPING` → `DECK_READY` → `CARD_MOVING`/`CARD_SHOWN` per card → `FINALE` (all cards spread across the screen). Card layout is derived from `cursor`: index == cursor is in the middle, index > cursor is in the left pile, and cards already shown (index < cursor) are returned face-down beneath the left pile, most recent at the back. `-1` = nothing drawn yet. Transitions are `setTimeout`s (tracked in `timersRef`) that must stay in sync with the CSS transition durations in `StageCard` (`MOVE_MS`), and input is ignored while `locked` (derived from `phase`: `PACK_POPPING` or `CARD_MOVING`). The pack-burst timing comes from `POP_MS`/`POP_STAGGER` in `StageCard`. Clicks are handled once, on `<main>`; don't add `onClick={handleAdvance}` to children or it fires twice.
- `handleBack` (the ← key; there is no on-screen Back button) rewinds one card instantly: it sets `instant`, which makes `StageCard` skip all transitions and animations for that change, then clears it two animation frames later. Keep it animation-free.
- `handleJumpToMember`, `handleJumpToFinale` and `handleReset` navigate outside the forward flow by setting `cursor`/`phase` directly.
- **Data/config:** `src/data/members.ts` exports `MEMBERS` (the seven `MemberProfile`s) and `PRESENTATION_CONFIG` (background, overlay opacity, shared card back, progress indicator toggle). Types are in `src/types/index.ts`.
- **Artwork is decoupled from code.** `CardFront`/`CardBack` render image layers from `public/assets/**` (paths referenced in `members.ts`); swapping artwork means replacing files or editing paths, not CSS. Cards are 2:3 and use `object-fit: contain`. See `README.md` for the asset path table and ratios.
- Each member has a `backArtwork` (red card, shown face-down in the piles) and a `frontArtwork` (photo card, shown after the flip). `StageCard` renders one card (3D flip via CSS transition, arc via a Web Animations hop). In `FINALE` the same cards spread face-up across the screen in two rows (`spread` status, staggered); clicking one jumps back to it. The stage has no on-screen chrome (no hint text, progress dots, sound/fullscreen icons, Replay or Back buttons); everything is keyboard: Space/→ advance, ← back, 1–7 jump, E finale, R restart, M mute, F fullscreen.
- `src/utils/audio.ts` exports a `sound` singleton (Web Audio synthesized effects, **muted by default**). The stage calls it at phase transitions.
- **Pack slicing:** the player swipes across the pack. `PackOpening.tsx` listens for window pointer events, draws a live trail, and turns the swipe into a cut with `strokeToCut` as soon as the pointer crosses the pack and exits the far side (mid-drag, so one drag can make many cuts; releasing over the pack also cuts) (`src/utils/packSlices.ts`; rejects swipes that are short or miss the pack). The stage keeps `cuts: SliceDef[]`; pure `computePieces(cuts)` splits the pack polygon, mapping each cut into every shard's moved/rotated frame so cuts land where swiped. Each piece is a clipped copy of `PackArt` (just the `public/assets/pack/pack.png` image, 2:3 with transparent rounded corners; swap that file to change the pack), animated by the `pack-*` keyframes in `index.css`; slash/spark FX are portaled to `document.body`. Slice effects are intentionally subtle; only the final burst is bigger. A light layer behind the shards (glow plus a seam per cut) fills the gaps, and the cards are hidden (`StageCard` opacity 0 while `status === 'pack'`) until the burst. Clicks never slice (`handleAdvance` ignores `PACK_SEALED`).
