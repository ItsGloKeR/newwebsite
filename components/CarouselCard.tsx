import React from 'react';
import { Anime } from '../types';

interface CarouselCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
  index: number;
}

const CarouselCard: React.FC<CarouselCardProps> = ({ anime, onSelect, index }) => {
  return (
    <div 
      className="group flex-shrink-0 w-64 md:w-72 cursor-pointer"
      onClick={() => onSelect(anime)}
    >
      <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-105">
        <img
          src={anime.bannerImage}
          alt={anime.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== anime.coverImage) {
              target.onerror = null;
              target.src = anime.coverImage;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-md px-2 py-1">
          <span className="text-white text-2xl font-black drop-shadow-lg">#{String(index + 1).padStart(2, '0')}</span>
        </div>
      </div>
      <h3 className="text-white text-base font-semibold truncate mt-2 group-hover:text-cyan-400 transition-colors">{anime.title}</h3>
      <p className="text-gray-400 text-sm">{anime.year}</p>
    </div>
  );
};

export default CarouselCard;