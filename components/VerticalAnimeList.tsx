import React from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface VerticalAnimeListProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
}

const VerticalAnimeListItem: React.FC<{ anime: Anime; onSelect: (anime: Anime) => void; }> = ({ anime, onSelect }) => {
  return (
    <li 
      className="flex items-center gap-4 p-2 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors"
      onClick={() => onSelect(anime)}
    >
      <img 
        src={anime.coverImage} 
        alt={anime.title} 
        className="w-16 h-24 object-cover rounded-md flex-shrink-0 shadow-md"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
      />
      <div className="overflow-hidden">
        <h4 className="text-white font-semibold truncate">{anime.title}</h4>
        <p className="text-gray-400 text-sm">{anime.year}</p>
        <p className="text-gray-400 text-sm truncate">{anime.genres.slice(0, 2).join(', ')}</p>
      </div>
    </li>
  );
};

const VerticalAnimeList: React.FC<VerticalAnimeListProps> = ({ title, animeList, onSelectAnime }) => {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-cyan-400 pl-4">{title}</h2>
      <ul className="flex flex-col gap-4">
        {animeList.map(anime => (
          <VerticalAnimeListItem key={anime.anilistId} anime={anime} onSelect={onSelectAnime} />
        ))}
      </ul>
    </section>
  );
};

export default VerticalAnimeList;
