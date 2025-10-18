import React, { useRef, useState, useEffect } from 'react';
import { Anime } from '../types';
import CarouselCard from './CarouselCard';

interface AnimeCarouselProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
  onViewMore?: () => void;
  showRank?: boolean;
  onRemoveItem?: (animeId: number) => void;
}

const AnimeCarousel: React.FC<AnimeCarouselProps> = ({ title, animeList, onSelectAnime, onViewMore, showRank = true, onRemoveItem }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };
    
    // A small timeout allows the browser to render and calculate dimensions correctly
    const timer = setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);

    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkOverflow);
    };
  }, [animeList]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="mb-12 relative">
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
      
      {showScrollButtons && (
        <>
            <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block"
                style={{ top: '60%' }}
                aria-label="Scroll Left"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block"
                style={{ top: '60%' }}
                aria-label="Scroll Right"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </>
      )}

      <div ref={scrollContainerRef} className="flex gap-4 md:gap-6 overflow-x-auto pb-4 carousel-scrollbar">
        {animeList.map((anime, index) => (
          <CarouselCard 
            key={anime.anilistId} 
            anime={anime} 
            onSelect={onSelectAnime} 
            rank={showRank ? index + 1 : undefined} 
            onRemove={onRemoveItem}
          />
        ))}
      </div>
    </section>
  );
};

export default AnimeCarousel;