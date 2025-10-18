import React from 'react';
import { Anime } from '../types';
import AnimeGrid from './AnimeGrid';

interface PlanToWatchPageProps {
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  isLoading: boolean;
  onBack: () => void;
}

const PlanToWatchPage: React.FC<PlanToWatchPageProps> = ({ animeList, onSelectAnime, isLoading, onBack }) => {
  return (
    <main className="container mx-auto p-4 md:p-8 animate-fade-in min-h-[60vh]">
      <button onClick={onBack} className="mb-6 text-cyan-400 hover:text-cyan-300 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Back to Home
      </button>
      <AnimeGrid
        title="Plan to Watch"
        animeList={animeList}
        onSelectAnime={onSelectAnime}
        isLoading={isLoading}
      />
    </main>
  );
};

export default PlanToWatchPage;