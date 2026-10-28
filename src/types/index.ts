export interface MemberProfile {
  id: string;                    // Unique identifier e.g. 'member-1'
  order: number;                 // 1 to 7
  frontArtwork: string;          // Path to front card image (e.g. '/assets/cards/member-01-front-placeholder.png')
  backArtwork?: string;          // Optional custom back image (defaults to shared back placeholder)
  name?: string;                 // Optional member name
  designation?: string;          // Optional designation / role
  description?: string;          // Optional biographical description
  achievement?: string;          // Optional notable milestone / achievement
  additionalAsset?: string;      // Optional portrait or secondary asset
}

export type RevealPhase =
  | 'DECK_READY'          // Physical 7-card deck resting on stage
  | 'CARD_DRAWING'        // Top card lifts forward from deck
  | 'CARD_FLIPPING'       // 3D vertical rotation
  | 'PORTRAIT_REVEALED'   // Face up, artwork revealed
  | 'PROFILE_EXPANDING'   // Continuous zoom & spread into full profile view
  | 'PROFILE_VISIBLE'     // Full profile view on screen
  | 'PROFILE_CONTRACTING' // Shrinks back into card geometry
  | 'CARD_RETURNING'      // Card turns face down and slides to back of deck
  | 'FINALE';             // Grand collective 7-card showcase

export interface PresentationConfig {
  defaultCardBack: string;
  backgroundImage: string;
  backgroundOverlayOpacity: number;
  showProgressIndicator: boolean;
}
