import React, { useState } from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface VerticalAnimeListProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onViewMore?: () => void;
  icon?: React.ReactNode;
}

const VerticalAnimeListItem: React.FC<{ anime: Anime; onSelect: (anime: Anime) => void; }> = ({ anime, onSelect }) => {
  let episodeText: string;

  if (anime.status === 'RELEASING' && anime.nextAiringEpisode) {
    const currentEp = anime.nextAiringEpisode.episode - 1;
    episodeText = `${currentEp} / ${anime.episodes || '?'}`;
  } else if (anime.episodes) {
    episodeText = `${anime.episodes} / ${anime.episodes}`;
  } else {
    episodeText = 'TBA';
  }

  return (
    <li 
      className="p-3 rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700/60 transition-colors"
      onClick={() => onSelect(anime)}
    >
      <div className="flex items-center gap-4">
        <div className="group relative w-14 h-20 flex-shrink-0">
            <img 
                src={anime.coverImage} 
                alt={anime.title} 
                className="w-full h-full object-cover rounded-md shadow-md"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
            <div className="absolute inset-0 bg-black/30 rounded-md flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
        <div className="overflow-hidden flex-grow">
          <h4 className="text-white font-semibold truncate flex items-center text-sm">
              <span className="truncate">{anime.title}</span>
          </h4>
          <div className="text-gray-400 text-xs mt-2 flex items-center gap-3">
             <span className="capitalize">{anime.format}</span>
             <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {anime.year}
             </span>
             <span className="flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                {episodeText}
             </span>
          </div>
        </div>
      </div>
    </li>
  );
};

const VerticalAnimeList: React.FC<VerticalAnimeListProps> = ({ title, animeList, onSelectAnime, onViewMore, icon }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsToShow = isExpanded ? animeList : animeList.slice(0, 5);

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase">
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
            {itemsToShow.map((anime) => (
            <VerticalAnimeListItem key={anime.anilistId} anime={anime} onSelect={onSelectAnime} />
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