import React, { useRef, useState, useEffect } from 'react';
import { Anime } from '../types';
import AnimeCard from './AnimeCard';
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
    
    const timer = setTimeout(checkOverflow, 100);
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

  const skeletonCount = 12;

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
          <div className="grid grid-rows-2 grid-flow-col gap-4 md:gap-6">
            {isLoading ? (
              Array.from({ length: skeletonCount }).map((_, index) => (
                <div key={index} className="w-40 sm:w-48 md:w-56">
                  <SkeletonCard />
                </div>
              ))
            ) : (
              animeList.map(anime => (
                <div key={anime.anilistId} className="w-40 sm:w-48 md:w-56">
                  <AnimeCard anime={anime} onSelect={onSelectAnime} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TwoRowAnimeGrid;