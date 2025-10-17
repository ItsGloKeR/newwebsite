
import React from 'react';
import { Anime } from '../types';

interface CarouselCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
}

const CarouselCard: React.FC<CarouselCardProps> = ({ anime, onSelect }) => {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg w-64 flex-shrink-0 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      onClick={() => onSelect(anime)}
    >
      <img
        src={anime.coverImage}
        alt={anime.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4">
        <h3 className="text-white text-md font-bold truncate">{anime.title}</h3>
      </div>
    </div>
  );
};

export default CarouselCard;
