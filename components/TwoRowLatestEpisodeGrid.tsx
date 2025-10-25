

import React, { useRef, useState, useEffect } from 'react';
import { EnrichedAiringSchedule } from '../types';
import LatestEpisodeCard from './LatestEpisodeCard';
import SkeletonCard from './SkeletonCard';

interface TwoRowLatestEpisodeGridProps {
  title: string;
  episodes: EnrichedAiringSchedule[];
  onSelectAnime: (anime: { anilistId: number }) => void;
  isLoading?: boolean;
  onViewMore?: () => void;
}

const TwoRowLatestEpisodeGrid: React.FC<TwoRowLatestEpisodeGridProps> = ({ title, episodes, onSelectAnime, isLoading, onViewMore }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };
    
    const timer = setTimeout(checkOverflow, 150); // Give a bit more time for rendering
    window.addEventListener('resize', checkOverflow);

    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkOverflow);
    };
  }, [episodes, isLoading]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 4a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm10 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
  const skeletonCount = 12;

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3 font-display tracking-wide uppercase">
          <span className="text-cyan-400">{icon}</span>
          <span>{title}</span>
        </h2>
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
      
      <div className="relative">
        {showScrollButtons && (
          <>
              <button 
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block"
                  aria-label="Scroll Left"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block"
                  aria-label="Scroll Right"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
          </>
        )}

        <div ref={scrollContainerRef} className="overflow-x-auto pb-4 carousel-scrollbar">
          <div className="grid grid-rows-2 grid-flow-col gap-4 md:gap-6" style={{ width: 'max-content' }}>
            {isLoading ? (
              Array.from({ length: skeletonCount }).map((_, index) => (
                <div key={index} className="w-40 sm:w-48 md:w-56">
                  <SkeletonCard />
                </div>
              ))
            ) : (
              episodes.map(schedule => (
                <div key={schedule.id} className="w-40 sm:w-48 md:w-56">
                  <LatestEpisodeCard schedule={schedule} onSelect={onSelectAnime} />
                </div>
              ))
            )}
            {!isLoading && episodes.length === 0 && (
              <p className="text-gray-400 row-span-2 flex items-center justify-center">No recent episodes found.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TwoRowLatestEpisodeGrid;