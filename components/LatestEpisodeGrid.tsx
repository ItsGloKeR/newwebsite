import React from 'react';
import { EnrichedAiringSchedule } from '../types';
import LatestEpisodeCard from './LatestEpisodeCard';
import SkeletonCard from './SkeletonCard';

interface LatestEpisodeGridProps {
  title: string;
  episodes: EnrichedAiringSchedule[];
  onSelectAnime: (anime: { anilistId: number }) => void;
  isLoading?: boolean;
  onViewMore?: () => void;
}

const LatestEpisodeGrid: React.FC<LatestEpisodeGridProps> = ({ title, episodes, onSelectAnime, isLoading, onViewMore }) => {
  const skeletonCount = 18;

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {isLoading ? (
          Array.from({ length: skeletonCount }).map((_, index) => <SkeletonCard key={index} />)
        ) : (
          episodes.map(schedule => (
            <LatestEpisodeCard key={schedule.id} schedule={schedule} onSelect={onSelectAnime} />
          ))
        )}
        {!isLoading && episodes.length === 0 && (
          <p className="text-gray-400 col-span-full">No recent episodes found.</p>
        )}
      </div>
    </section>
  );
};

export default LatestEpisodeGrid;
