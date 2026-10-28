import React from 'react';

interface CardFrontProps {
  imageSrc: string;
  altText?: string;
}

export const CardFront: React.FC<CardFrontProps> = ({
  imageSrc,
  altText = 'Card Front Artwork',
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
