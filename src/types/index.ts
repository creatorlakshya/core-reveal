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
  | 'PACK_SEALED'    // Sealed pack awaiting swipes; opens itself after a short idle
  | 'PACK_POPPING'   // Pack bursts apart, cards pop out to the left pile
  | 'DECK_READY'     // All cards in the left pile, middle empty
  | 'CARD_MOVING'    // A card travelling between the left pile and the middle
  | 'CARD_SHOWN'     // Current card face-up in the middle with its description
  | 'FINALE';        // Grand collective 7-card showcase

export interface PresentationConfig {
  defaultCardBack: string;
  backgroundImage: string;
  backgroundOverlayOpacity: number;
  showProgressIndicator: boolean;
}
