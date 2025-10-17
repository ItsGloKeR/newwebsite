import React from 'react';
import { Anime } from '../types';
import AnimeCard from './AnimeCard';

interface AnimeGridProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
}

const AnimeGrid: React.FC<AnimeGridProps> = ({ title, animeList, onSelectAnime }) => {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-cyan-400 pl-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {animeList.map(anime => (
          <AnimeCard key={anime.anilistId} anime={anime} onSelect={onSelectAnime} />
        ))}
      </div>
    </section>
  );
};

export default AnimeGrid;