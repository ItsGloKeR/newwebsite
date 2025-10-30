import React, { useRef } from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';
import { useTooltip } from '../contexts/TooltipContext';
import { getAnimeDetails } from '../services/anilistService';

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
}

// FIX: Changed to a named export to resolve import errors.
export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onSelect }) => {
  const { titleLanguage } = useTitleLanguage();
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
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

  const episodeText = () => {
    if (anime.status === 'RELEASING') {
        if (anime.episodes !== null) {
            return anime.totalEpisodes 
                ? `${anime.episodes}/${anime.totalEpisodes} Eps`
                : `${anime.episodes} Eps`;
        }
        return null; // Don't show episode count for airing anime if we don't know the latest episode
    }

    // For other statuses (FINISHED, NOT_YET_RELEASED, etc.)
    if (anime.totalEpisodes) {
      return `${anime.totalEpisodes} Eps`;
    }
    if (anime.episodes) { // Fallback, e.g. for FINISHED where totalEpisodes is null
        return `${anime.episodes} Eps`;
    }
    return null;
  };
  
  return (
    <div 
      ref={cardRef}
      className="group cursor-pointer text-left w-full h-full flex flex-col" 
      onClick={() => onSelect(anime)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-cyan-500/30">
        <img
          src={anime.coverImage}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
        />
        {anime.isAdult && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
            18+
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="pt-3">
        <div className="flex items-center gap-2 mb-1">
          {anime.status === 'RELEASING' && (
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Airing"></div>
          )}
          <h3 className="text-white text-sm font-bold truncate group-hover:text-cyan-400 transition-colors" title={title}>{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-gray-300 text-xs">
          {anime.format && anime.format !== 'N/A' && <span className="font-semibold">{anime.format}</span>}
          {anime.year > 0 && <span className="font-semibold">{anime.year}</span>}
        </div>
      </div>
    </div>
  );
};
