import React from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';

interface CarouselCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
  rank?: number;
  onRemove?: (animeId: number) => void;
  size?: 'normal' | 'small';
}

const CarouselCard: React.FC<CarouselCardProps> = ({ anime, onSelect, rank, onRemove, size = 'normal' }) => {
  const { titleLanguage } = useTitleLanguage();
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the main card click
    if (onRemove) {
      onRemove(anime.anilistId);
    }
  };

  const widthClass = size === 'small' ? 'w-44' : 'w-56';
  const rankSizeClass = size === 'small' ? 'text-7xl' : 'text-8xl';
  const titlePaddingClass = size === 'small' ? 'pl-12' : 'pl-14';

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-lg shadow-lg ${widthClass} flex-shrink-0 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
      onClick={() => onSelect(anime)}
    >
      <img
        src={anime.coverImage}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
      />

      {onRemove && (
        <button
          onClick={handleRemove}
          className="absolute top-2 left-2 z-30 bg-gray-900/70 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove from list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {anime.isAdult && (
        <div className={`absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-20`}>
          18+
        </div>
      )}
      {anime.episodes != null && (
        <div className={`absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-20 transition-opacity ${onRemove ? 'group-hover:opacity-0' : ''}`}>
          {anime.episodes} Ep
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
      
      {/* Combined overlay for Rank and Title */}
      <div className="absolute bottom-0 left-0 w-full flex items-end p-2 z-20">
        {/* Rank number is positioned absolutely but within the card's bounds */}
        {rank && (
            <div className="absolute bottom-0 left-0 pointer-events-none">
            <span className={`${rankSizeClass} font-black text-gray-950/50 -translate-y-2`} style={{ WebkitTextStroke: '2px #22d3ee' }}>
                {rank}
            </span>
            </div>
        )}
        
        {/* Title is positioned with a higher z-index and padding to avoid the number */}
        <h3 className={`relative z-20 text-white text-md font-bold truncate w-full ${rank ? titlePaddingClass : 'pl-2'}`}>
          {title}
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