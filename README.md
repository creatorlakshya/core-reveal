# MSRIT E-CELL: SEVEN-MEMBER CARD REVEAL TEMPLATE

> A cinematic, presentation-ready digital card-reveal template for MSRIT E-Cell Orientation 2026. Designed with anchored central physical deck physics, genuine 3D vertical flips, and fully replaceable artwork layers.

---

## 📁 Replaceable Assets Directory

All visual artwork is decoupled from CSS and code logic. Drop the final artwork files directly into the following paths in `public/`:

### 1. Stage Background Artwork
- **Path**: [`public/assets/background/background-placeholder.jpg`](file:///c:/Users/LENOVO/OneDrive/Desktop/Cards%20Revealing/public/assets/background/background-placeholder.jpg)
- **Ratio**: 16:9 widescreen or ultra-wide (e.g., `1920 × 1080` or higher)
- **Behavior**: Rendered via `background-size: cover` and centered automatically behind all reveal phases.

### 2. Common Card Back Artwork
- **Path**: [`public/assets/cards/card-back-placeholder.png`](file:///c:/Users/LENOVO/OneDrive/Desktop/Cards%20Revealing/public/assets/cards/card-back-placeholder.png)
- **Ratio**: Standard 2:3 card ratio (target `800 × 1200` px or `600 × 900` px)
- **Behavior**: Rendered using `object-fit: contain` with rounded corners and backface culling.

### 3. Member Front Artworks (Seven Cards)
| Member | Asset Path |
| :--- | :--- |
| **Member 01** | `public/assets/cards/member-01-front-placeholder.png` |
| **Member 02** | `public/assets/cards/member-02-front-placeholder.png` |
| **Member 03** | `public/assets/cards/member-03-front-placeholder.png` |
| **Member 04** | `public/assets/cards/member-04-front-placeholder.png` |
| **Member 05** | `public/assets/cards/member-05-front-placeholder.png` |
| **Member 06** | `public/assets/cards/member-06-front-placeholder.png` |
| **Member 07** | `public/assets/cards/member-07-front-placeholder.png` |

---

## ⚙️ Configuration & Data Structure

Configuration and member information are located in [`src/data/members.ts`](file:///c:/Users/LENOVO/OneDrive/Desktop/Cards%20Revealing/src/data/members.ts).

### Presentation Settings (`PRESENTATION_CONFIG`)
```typescript
export const PRESENTATION_CONFIG = {
  // Path to background artwork
  backgroundImage: '/assets/background/background-placeholder.jpg',
  // Configurable dark overlay for legibility (0 = no overlay, 0.25 = subtle 25% tint)
  backgroundOverlayOpacity: 0.2,
  // Shared card back artwork
  defaultCardBack: '/assets/cards/card-back-placeholder.png',
  // Toggle the floating top-right 7-member progress indicator (true / false)
  showProgressIndicator: true,
};
```

### Member Data Structure
```typescript
export interface MemberProfile {
  id: string;               // Unique ID, e.g. 'member-1'
  order: number;            // 1 to 7
  frontArtwork: string;     // Path to front card image
  backArtwork?: string;     // Optional custom back image (defaults to shared back)
  name?: string;            // Optional member name
  designation?: string;     // Optional role / designation
  description?: string;     // Optional bio / description
  achievement?: string;     // Optional notable milestone / achievement
  additionalAsset?: string; // Optional portrait or secondary asset
}
```

---

## 🎬 Reveal Experience & Key Changes

1. **Horizontally Centred Stationary Deck**
   - No sideways translation, lateral rotation, or stack drift.
   - The stack remains stationary in the viewport center.
   - The active card lifts naturally upward and forward, flips 180° around its vertical axis, and returns cleanly underneath the stack before the next member.
2. **Artwork-Driven Cards**
   - Card faces are rendered via separate image layers (`CardBack` and `CardFront`), not hardcoded CSS/HTML.
   - Images maintain correct orientation during 3D flip (no mirroring or reversed text).
   - Preserves 2:3 card aspect ratio with `object-fit: contain`.
3. **No Top Header Bar or Distracting Headings**
   - Branding headers, orientation labels, top borders, and headings ("THE PEOPLE BEHIND E-CELL") are completely removed.
   - The viewport is balanced and centered.
4. **Unobtrusive Stage Controls**
   - No developer toolbar, debug panel, or bottom controllers.
   - Progress indicator is a clean floating pill (can be turned off via `showProgressIndicator`).

---

## 🕹️ Keyboard Controls

| Key | Action |
| :--- | :--- |
| **`Space`** or **`→`** | Advance to next step (Draw → 3D Flip → Profile view → Return to deck) |
| **`←`** | Step back safely |
| **`1` – `7`** | Direct member jump (rehearsal / quick navigation) |
| **`E`** | Jump directly to Grand Collective Finale |
| **`R`** | Replay / Reset presentation from beginning |
| **`F`** | Toggle Fullscreen mode |
| **`M`** | Toggle Audio |

---

## 🚀 Development & Build

```bash
# Install dependencies
npm install

# Start local server (http://localhost:3000)
npm run dev

# Regenerate placeholder assets
node scripts/generate-assets.cjs

# Build production bundle
npm run build
```
