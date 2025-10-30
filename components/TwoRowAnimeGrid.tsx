

import React, { useRef, useState, useEffect } from 'react';
import { Anime } from '../types';
// FIX: Changed to named import for AnimeCard
import { AnimeCard } from './AnimeCard';
import SkeletonCard from './SkeletonCard';

interface TwoRowAnimeGridProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onViewMore?: () => void;
  isLoading?: boolean;
}

const TwoRowAnimeGrid: React.FC<TwoRowAnimeGridProps> = ({ title, animeList, onSelectAnime, onViewMore, isLoading }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };
    
    const timer = setTimeout(checkOverflow, 150);
    window.addEventListener('resize', checkOverflow);

    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkOverflow);
    };
  }, [animeList, isLoading]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path d="M11 2a1 1 0 10-2 0v1a1 1 0 102 0V2zM5 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm3 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm-3 4a1 1 0 100 2h8a1 1 0 100-2H5z" /><path fillRule="evenodd" d="M3 5a3 3 0 013-3h8a3 3 0 013 3v12a1 1 0 11-2 0V5a1 1 0 00-1-1H6a1 1 0 00-1 1v12a1 1 0 11-2 0V5z" clipRule="evenodd" /></svg>;
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
                <div key={index} className="w-36 sm:w-44 md:w-48">
                  <SkeletonCard />
                </div>
              ))
            ) : (
              animeList.map(anime => (
                <div key={anime.anilistId} className="w-36 sm:w-44 md:w-48">
                  <AnimeCard anime={anime} onSelect={onSelectAnime} />
                </div>
              ))
            )}
            {!isLoading && animeList.length === 0 && (
              <p className="text-gray-400 row-span-2 flex items-center justify-center">No anime found.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TwoRowAnimeGrid;