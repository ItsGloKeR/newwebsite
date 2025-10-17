
import React from 'react';
import { HiAnime } from '../types';
import HiAnimeCard from './HiAnimeCard';

interface HiAnimeGridProps {
  title: string;
  animeList: HiAnime[];
  onSelectAnime: (anime: HiAnime) => void;
}

const HiAnimeGrid: React.FC<HiAnimeGridProps> = ({ title, animeList, onSelectAnime }) => {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {animeList.map(anime => (
          <HiAnimeCard key={anime.id} anime={anime} onSelect={onSelectAnime} />
        ))}
      </div>
    </section>
  );
};

export default HiAnimeGrid;
