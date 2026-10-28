import React from 'react';

interface CardBackProps {
  imageSrc?: string;
  altText?: string;
}

export const CardBack: React.FC<CardBackProps> = ({
  imageSrc = '/assets/cards/card-back-placeholder.png',
  altText = 'Card Back Artwork',
}) => {
  return (
    <div className="w-full h-full relative overflow-hidden backface-hidden select-none rounded-[14px]">
      <img
        src={imageSrc}
        alt={altText}
        className="w-full h-full object-contain pointer-events-none rounded-[14px]"
        draggable={false}
      />
    </div>
  );
};
