

import React from 'react';
import { Anime } from '../types';
// FIX: Changed to named import for AnimeCard
import { AnimeCard } from './AnimeCard';
import SkeletonCard from './SkeletonCard';

interface AnimeGridProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  icon?: React.ReactNode;
  isLoading?: boolean;
  onViewMore?: () => void;
  onBackClick?: () => void;
  resultsCount?: number;
}

const AnimeGrid: React.FC<AnimeGridProps> = ({ title, animeList, onSelectAnime, icon, isLoading, onViewMore, onBackClick, resultsCount }) => {
  const skeletonCount = 28; // A good number to fill the view

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {onBackClick && (
            <button 
              onClick={onBackClick}
              className="group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm md:text-base whitespace-nowrap bg-gray-800/50 hover:bg-gray-700/60 px-4 py-2 rounded-lg"
              aria-label="Go back to homepage"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
          )}
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3 font-display tracking-wide uppercase">
              {icon && <span className="text-cyan-400">{icon}</span>}
              <span>{title}</span>
            </h2>
            {resultsCount != null && (
                <p className="text-sm text-gray-400 mt-1">{resultsCount.toLocaleString()} results found</p>
            )}
          </div>
        </div>
        {onViewMore && (
          <button 
            onClick={onViewMore} 
            className="group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm md:text-base whitespace-nowrap"
          >
            <span>View All</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-5">
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