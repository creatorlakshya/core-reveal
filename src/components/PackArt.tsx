import React from 'react';

// The pack face: a 2:3 image with transparent rounded corners. Every shard of the sliced pack
// renders this same image, clipped to its own polygon.
const PACK_IMAGE = '/assets/pack/pack.png';

export const PackArt: React.FC = () => (
  <div
    className="absolute inset-0"
    style={{ backgroundImage: `url(${PACK_IMAGE})`, backgroundSize: '100% 100%' }}
  />
);
