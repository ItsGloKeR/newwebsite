import React from 'react';
import { Anime } from '../types';
import AnimeCard from './AnimeCard';
import SkeletonCard from './SkeletonCard';

interface AnimeGridProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  isLoading?: boolean;
}

const AnimeGrid: React.FC<AnimeGridProps> = ({ title, animeList, onSelectAnime, isLoading }) => {
  const skeletonCount = 18; // A good number to fill the view

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-cyan-400 pl-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {isLoading ? (
          Array.from({ length: skeletonCount }).map((_, index) => <SkeletonCard key={index} />)
        ) : (
          animeList.map(anime => (
            <AnimeCard key={anime.anilistId} anime={anime} onSelect={onSelectAnime} />
          ))
        )}
        {!isLoading && animeList.length === 0 && (
          <p className="text-gray-400 col-span-full">No anime found for this selection.</p>
        )}
      </div>
    </section>
  );
};

export default AnimeGrid;
