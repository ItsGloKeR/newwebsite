import React, { useState } from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';


interface VerticalAnimeListProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onViewMore?: () => void;
  icon?: React.ReactNode;
  showRank?: boolean;
}

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const VerticalAnimeListItem: React.FC<{ anime: Anime; onSelect: (anime: Anime) => void; rank: number }> = ({ anime, onSelect, rank }) => {
  const { titleLanguage } = useTitleLanguage();
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;

  const episodeText = () => {
    // For airing anime, show the latest episode number
    if (anime.status === 'RELEASING' && anime.episodes !== null && anime.episodes > 0) {
      return `Ep ${anime.episodes}`;
    }
    
    // For finished anime, show total episodes
    if (anime.totalEpisodes) {
      if (anime.format === 'MOVIE') return null; // format is already shown in metadata
      if (anime.totalEpisodes === 1) return `1 Episode`;
      return `${anime.totalEpisodes} Eps`;
    }

    return null;
  };

  const epText = episodeText();
  
  return (
    <li 
      className="relative p-2 rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-700/60 transition-colors duration-300 group"
      onClick={() => onSelect(anime)}
    >
        {rank > 0 && (
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-0 pointer-events-none" aria-hidden="true">
                <span className="text-5xl font-black text-transparent" style={{ WebkitTextStroke: '2px rgba(34, 211, 238, 0.5)' }}>
                    {rank}
                </span>
            </div>
        )}
      <div className="flex items-center gap-3 relative z-10">
        <div className={`w-14 h-20 flex-shrink-0 ${rank > 0 ? 'ml-4' : ''}`}>
            <img 
                src={anime.coverImage} 
                alt={title} 
                className="w-full h-full object-cover rounded-md shadow-md transform transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
        </div>
        <div className="overflow-hidden flex-grow">
          <h4 className="text-white font-bold group-hover:text-cyan-300 transition-colors text-sm line-clamp-2" title={title}>
              {title}
          </h4>
          <div className="flex justify-between items-center text-gray-400 text-xs mt-1.5">
            <div className="flex flex-wrap items-center gap-x-2 overflow-hidden whitespace-nowrap">
                {anime.rating > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-yellow-400">
                        <StarIcon className="w-3 h-3" />
                        {anime.rating}
                    </span>
                )}
                {anime.format && anime.format !== 'N/A' && (
                    <>
                        {anime.rating > 0 && <span className="text-gray-600">•</span>}
                        <span className="font-medium">{anime.format}</span>
                    </>
                )}
                {anime.year > 0 && (
                    <>
                        {(anime.rating > 0 || (anime.format && anime.format !== 'N/A')) && <span className="text-gray-600">•</span>}
                        <span className="font-medium">{anime.year}</span>
                    </>
                )}
            </div>
            {epText && <span className="font-semibold text-cyan-400 flex-shrink-0 ml-2">{epText}</span>}
          </div>
        </div>
      </div>
    </li>
  );
};

const VerticalAnimeList: React.FC<VerticalAnimeListProps> = ({ title, animeList, onSelectAnime, onViewMore, icon, showRank }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsToShow = isExpanded ? animeList : animeList.slice(0, 5);

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase font-display tracking-wider">
            {icon}
            {title}
        </h2>
        {onViewMore && (
          <button 
            onClick={onViewMore} 
            className="group flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-xs whitespace-nowrap"
          >
            <span>View All</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
      <div className="bg-gray-900/50 rounded-lg p-2">
        <ul className="flex flex-col gap-2">
            {itemsToShow.map((anime, index) => (
            <VerticalAnimeListItem key={anime.anilistId} anime={anime} onSelect={onSelectAnime} rank={showRank ? index + 1 : 0} />
            ))}
        </ul>
        {animeList.length > 5 && (
            <div className="flex justify-center mt-2">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={isExpanded ? 'Show less' : 'Show more'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
        )}
      </div>
    </section>
  );
};

export default VerticalAnimeList;