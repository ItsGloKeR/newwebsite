import React, { useRef } from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';
import { useUserData } from '../contexts/UserDataContext';
import { useTooltip } from '../contexts/TooltipContext';
import { getAnimeDetails } from '../services/anilistService';

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


interface CarouselCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
  rank?: number;
  onRemove?: (animeId: number) => void;
  size?: 'normal' | 'small';
  isTrending?: boolean;
}

const CarouselCard: React.FC<CarouselCardProps> = ({ anime, onSelect, rank, onRemove, size = 'normal', isTrending }) => {
  const { titleLanguage } = useTitleLanguage();
  const { favorites, toggleFavorite } = useUserData();
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
  const isFavorite = favorites.includes(anime.anilistId);

  const { showTooltip, hideTooltip } = useTooltip();
  const cardRef = useRef<HTMLDivElement>(null);
  const prefetchTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      showTooltip(anime, cardRef.current.getBoundingClientRect());
    }
    // Prefetch details on hover with a delay
    prefetchTimeoutRef.current = window.setTimeout(() => {
      if (!anime.isAdult) {
        getAnimeDetails(anime.anilistId);
      }
    }, 200);
  };

  const handleMouseLeave = () => {
    hideTooltip();
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(anime.anilistId);
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the main card click
    if (onRemove) {
      onRemove(anime.anilistId);
    }
  };

  const episodeText = () => {
    if (anime.status === 'RELEASING' && anime.totalEpisodes) {
      return `${anime.episodes || 0}/${anime.totalEpisodes} Eps`;
    }
    if (anime.episodes) {
      return `${anime.episodes} Eps`;
    }
    if (anime.totalEpisodes) {
      return `${anime.totalEpisodes} Eps`;
    }
    return null;
  };

  const cardWidth = size === 'small' ? 'w-40' : 'w-48';

  return (
    <div 
      ref={cardRef}
      className={`relative group cursor-pointer text-left ${cardWidth} flex-shrink-0 flex flex-col`} 
      onClick={() => onSelect(anime)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
       <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-cyan-500/30 z-10 bg-gray-900">
        <img
            src={anime.coverImage}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
        />
        {isTrending && rank && (
             <div className="absolute top-0 left-0 bg-gradient-to-br from-black/80 to-transparent p-2 rounded-br-2xl pointer-events-none transition-transform duration-300 group-hover:scale-110">
                <span className="text-4xl font-black text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {String(rank).padStart(2, '0')}
                </span>
            </div>
        )}

         <div className="absolute top-2 right-2 z-30 flex flex-col gap-2">
            {onRemove && (
            <button
                onClick={handleRemove}
                className="bg-gray-900/70 text-white rounded-full p-2 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${title} from list`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            )}
            <button
            onClick={handleFavoriteClick}
            className="bg-gray-900/70 text-white rounded-full p-2 hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
            aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-colors ${isFavorite ? 'text-red-500' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            </button>
        </div>
         {anime.isAdult && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
            18+
          </div>
        )}
         {anime.progress > 0 && anime.progress < 95 && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-500/50 z-20">
                <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${anime.progress}%` }}
                ></div>
            </div>
        )}
      </div>
      <div className="pt-3 z-10">
        <div className="flex items-center gap-2 mb-1">
          {anime.status === 'RELEASING' && (
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Airing"></div>
          )}
          <h3 className="text-white text-sm font-bold truncate group-hover:text-cyan-400 transition-colors" title={title}>{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-xs">
          {anime.format && anime.format !== 'N/A' && <span className="font-semibold">{anime.format}</span>}
          {anime.year > 0 && <span className="font-semibold">{anime.year}</span>}
          {episodeText() && <span className="font-semibold">{episodeText()}</span>}
          {anime.rating > 0 && (
            <span className="flex items-center gap-1 font-semibold ml-auto">
              <StarIcon className="w-3 h-3 text-yellow-400" />
              {anime.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarouselCard;