import React from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface VerticalAnimeListProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onViewMore?: () => void;
}

const VerticalAnimeListItem: React.FC<{ anime: Anime; onSelect: (anime: Anime) => void; rank: number; }> = ({ anime, onSelect, rank }) => {
  return (
    <li 
      className="flex items-center gap-4 p-2 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors"
      onClick={() => onSelect(anime)}
    >
      <span className="text-2xl font-bold text-gray-500 w-8 text-center flex-shrink-0">{rank}</span>
      <img 
        src={anime.coverImage} 
        alt={anime.title} 
        className="w-16 h-24 object-cover rounded-md flex-shrink-0 shadow-md"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
      />
      <div className="overflow-hidden">
        <h4 className="text-white font-semibold truncate flex items-center gap-2">
            {anime.title}
            {anime.isAdult && <span className="flex-shrink-0 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">18+</span>}
        </h4>
        <p className="text-gray-400 text-sm">
            {anime.year} {anime.episodes ? `· ${anime.episodes} Episodes` : ''}
        </p>
        <p className="text-gray-400 text-sm truncate">{anime.genres.slice(0, 2).join(', ')}</p>
      </div>
    </li>
  );
};

const VerticalAnimeList: React.FC<VerticalAnimeListProps> = ({ title, animeList, onSelectAnime, onViewMore }) => {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white border-l-4 border-cyan-400 pl-4">{title}</h2>
        {onViewMore && (
          <button 
            onClick={onViewMore} 
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm md:text-base whitespace-nowrap"
          >
            View More &gt;
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-4">
        {animeList.map((anime, index) => (
          <VerticalAnimeListItem key={anime.anilistId} anime={anime} onSelect={onSelectAnime} rank={index + 1} />
        ))}
      </ul>
    </section>
  );
};

export default VerticalAnimeList;