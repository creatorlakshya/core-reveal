import { MemberProfile, PresentationConfig } from '../types';

export const PRESENTATION_CONFIG: PresentationConfig = {
  // Replaceable presentation background asset
  backgroundImage: '/assets/background/background-placeholder.jpg',
  // Configurable dark overlay for legibility against bright backgrounds (0 to 1)
  backgroundOverlayOpacity: 0.2,
  // Shared card back artwork placeholder
  defaultCardBack: '/assets/cards/card-back-placeholder.png',
  // Configuration to show or hide the 7-member progress indicator
  showProgressIndicator: true,
};

export const MEMBERS: MemberProfile[] = [
  {
    id: 'member-1',
    order: 1,
    frontArtwork: '/assets/cards/member-01-front-placeholder.png',
    name: 'Member 01',
    designation: 'Role / Designation',
    description: 'Biographical description and contribution summary will be inserted here.',
    achievement: 'Notable milestone or core achievement will be inserted here.',
  },
  {
    id: 'member-2',
    order: 2,
    frontArtwork: '/assets/cards/member-02-front-placeholder.png',
    name: 'Member 02',
    designation: 'Role / Designation',
    description: 'Biographical description and contribution summary will be inserted here.',
    achievement: 'Notable milestone or core achievement will be inserted here.',
  },
  {
    id: 'member-3',
    order: 3,
    frontArtwork: '/assets/cards/member-03-front-placeholder.png',
    name: 'Member 03',
    designation: 'Role / Designation',
    description: 'Biographical description and contribution summary will be inserted here.',
    achievement: 'Notable milestone or core achievement will be inserted here.',
  },
  {
    id: 'member-4',
    order: 4,
    frontArtwork: '/assets/cards/member-04-front-placeholder.png',
    name: 'Member 04',
    designation: 'Role / Designation',
    description: 'Biographical description and contribution summary will be inserted here.',
    achievement: 'Notable milestone or core achievement will be inserted here.',
  },
  {
    id: 'member-5',
    order: 5,
    frontArtwork: '/assets/cards/member-05-front-placeholder.png',
    name: 'Member 05',
    designation: 'Role / Designation',
    description: 'Biographical description and contribution summary will be inserted here.',
    achievement: 'Notable milestone or core achievement will be inserted here.',
  },
  {
    id: 'member-6',
    order: 6,
    frontArtwork: '/assets/cards/member-06-front-placeholder.png',
    name: 'Member 06',
    designation: 'Role / Designation',
    description: 'Biographical description and contribution summary will be inserted here.',
    achievement: 'Notable milestone or core achievement will be inserted here.',
  },
  {
    id: 'member-7',
    order: 7,
    frontArtwork: '/assets/cards/member-07-front-placeholder.png',
    name: 'Member 07',
    designation: 'Role / Designation',
    description: 'Biographical description and contribution summary will be inserted here.',
    achievement: 'Notable milestone or core achievement will be inserted here.',
  },
];
