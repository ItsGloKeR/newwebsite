import React from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface CarouselCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
  rank?: number;
}

const CarouselCard: React.FC<CarouselCardProps> = ({ anime, onSelect, rank }) => {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg w-56 flex-shrink-0 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      onClick={() => onSelect(anime)}
    >
      <img
        src={anime.coverImage}
        alt={anime.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
      />
      {anime.isAdult && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
          18+
        </div>
      )}
      {anime.episodes != null && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
          {anime.episodes} Ep
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
      
      {/* Combined overlay for Rank and Title */}
      <div className="absolute bottom-0 left-0 w-full flex items-end p-2 z-20">
        {/* Rank number is positioned absolutely but within the card's bounds */}
        {rank && (
            <div className="absolute bottom-0 left-0 pointer-events-none">
            <span className="text-8xl font-black text-gray-950/50 -translate-y-2" style={{ WebkitTextStroke: '2px #22d3ee' }}>
                {rank}
            </span>
            </div>
        )}
        
        {/* Title is positioned with a higher z-index and padding to avoid the number */}
        <h3 className={`relative z-20 text-white text-md font-bold truncate w-full ${rank ? 'pl-14' : 'pl-2'}`}>
          {anime.title}
        </h3>
      </div>
       {/* Progress Bar */}
      {anime.progress > 0 && anime.progress < 95 && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-500/50 z-20">
              <div
                  className="h-full bg-cyan-500"
                  style={{ width: `${anime.progress}%` }}
              ></div>
          </div>
      )}
    </div>
  );
};

export default CarouselCard;
