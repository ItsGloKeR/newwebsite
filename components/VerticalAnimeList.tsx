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

const VerticalAnimeListItem: React.FC<{ anime: Anime; onSelect: (anime: Anime) => void; rank: number }> = ({ anime, onSelect, rank }) => {
  const { titleLanguage } = useTitleLanguage();
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
  
  return (
    <li 
      className="relative p-2 rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-700/60 transition-colors duration-300 group"
      onClick={() => onSelect(anime)}
    >
      <div className="flex items-center gap-4">
        {rank && (
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-0">
                <span className="text-6xl font-black text-gray-900/80" style={{ WebkitTextStroke: '2px rgba(34, 211, 238, 0.3)' }}>
                    {rank}
                </span>
            </div>
        )}
        <div className={`relative ${rank ? 'ml-8' : ''} w-16 h-24 flex-shrink-0`}>
            <img 
                src={anime.coverImage} 
                alt={title} 
                className="w-full h-full object-cover rounded-md shadow-md transform transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
        </div>
        <div className="overflow-hidden flex-grow">
          <h4 className="text-white font-bold truncate group-hover:text-cyan-300 transition-colors text-sm">
              <span className="truncate">{title}</span>
          </h4>
          <div className="text-gray-400 text-xs mt-2 flex flex-col gap-1">
             <span className="capitalize">{anime.format}</span>
             <div className="flex items-center gap-3">
                <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {anime.year}
                </span>
                <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {anime.rating ? `${anime.rating}/100` : 'N/A'}
                </span>
             </div>
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