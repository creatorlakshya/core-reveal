import { MemberProfile, PresentationConfig } from '../types';

export const PRESENTATION_CONFIG: PresentationConfig = {
  // Replaceable presentation background asset
  backgroundImage: '/assets/background/background.jpg',
  // Configurable dark overlay for legibility against bright backgrounds (0 to 1)
  backgroundOverlayOpacity: 0,
  // Shared card back artwork placeholder
  defaultCardBack: '/assets/cards/card-back-placeholder.png',
};

export const MEMBERS: MemberProfile[] = [
  {
    id: 'member-1',
    order: 1,
    frontArtwork: '/assets/cards/member-01-front.png?v=4',
    backArtwork: '/assets/cards/member-01-back.png?v=4',
    name: 'Siddharth Priyatam',
    designation: 'President, Upstarters and Finance',
    description: "I play the game for the game's own sake.",
  },
  {
    id: 'member-2',
    order: 2,
    frontArtwork: '/assets/cards/member-02-front.png?v=4',
    backArtwork: '/assets/cards/member-02-back.png?v=4',
    name: 'Priya Gariya',
    designation: 'President, EM, Operation, PR and SP',
    description: "Stay a student. Think like a leader. Be the 1%. Do what the 99% won't.",
  },
  {
    id: 'member-3',
    order: 3,
    frontArtwork: '/assets/cards/member-03-front.png?v=4',
    backArtwork: '/assets/cards/member-03-back.png?v=4',
    name: 'Saksham Jain',
    designation: 'Vice President, Social Media and Marketing',
    description: 'Born to chill, forced to coordinate.',
  },
  {
    id: 'member-4',
    order: 4,
    frontArtwork: '/assets/cards/member-04-front.png?v=4',
    backArtwork: '/assets/cards/member-04-back.png?v=4',
    name: 'Hardik Bansal',
    designation: 'Head of Documentation',
    description: "Dont let the fear of getting it wrong stop you from finding out what's right.",
  },
  {
    id: 'member-5',
    order: 5,
    frontArtwork: '/assets/cards/member-05-front.png?v=5',
    backArtwork: '/assets/cards/member-05-back.png?v=4',
    name: 'Shashwath Prabhu',
    designation: 'Head of Design',
    description: 'Create without limits, collaborate without ego.',
  },
  {
    id: 'member-6',
    order: 6,
    frontArtwork: '/assets/cards/member-06-front.png?v=5',
    backArtwork: '/assets/cards/member-06-back.png?v=4',
    name: 'Shivesh Tiwari',
    designation: 'Head of IT',
    description: 'Building and breaking stuff.',
  },
  {
    id: 'member-7',
    order: 7,
    frontArtwork: '/assets/cards/member-07-front.png?v=4',
    backArtwork: '/assets/cards/member-07-back.png?v=4',
    name: 'Rohith Jagri',
    designation: 'Head of Coverage and Publicity',
    description: "Don't just be part of the change. Be the reason it begins.",
  },
];
