import React, { useRef, useState, useEffect } from 'react';
import { Anime } from '../types';
import CarouselCard from './CarouselCard';

interface AnimeCarouselProps {
  title: string;
  animeList: Anime[];
  icon?: React.ReactNode;
  onSelectAnime: (anime: Anime) => void;
  onViewMore?: () => void;
  showRank?: boolean;
  onRemoveItem?: (animeId: number) => void;
  cardSize?: 'normal' | 'small';
  isCollapsible?: boolean;
}

export const AnimeCarousel: React.FC<AnimeCarouselProps> = ({ title, animeList, icon, onSelectAnime, onViewMore, showRank = true, onRemoveItem, cardSize = 'normal', isCollapsible }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const collapseKey = `carousel-collapsed-${title.replace(/\s+/g, '-')}`;
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (!isCollapsible) return false;
    try {
      return localStorage.getItem(collapseKey) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isCollapsible) {
      try {
        localStorage.setItem(collapseKey, String(isCollapsed));
      } catch (error) {
        console.error("Failed to save collapse state to localStorage", error);
      }
    }
  }, [isCollapsed, isCollapsible, collapseKey]);

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

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <section className="relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-display tracking-wide uppercase">
            {icon && <span className="text-cyan-400">{icon}</span>}
            <span>{title}</span>
          </h2>
          {isCollapsible && (
              <button onClick={toggleCollapse} className="text-gray-400 hover:text-white transition-colors" aria-label={isCollapsed ? 'Show list' : 'Hide list'}>
                  {isCollapsed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zM10 12a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" /><path d="M10 17a7 7 0 01-7-7c0-1.554.482-3.002 1.32-4.243L12.243 15.68A6.958 6.958 0 0110 17z" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                  )}
              </button>
          )}
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
      
      {!isCollapsed && (
        <div className="relative">
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
                    size={cardSize}
                    isTrending={showRank && title === 'Trending'}
                />
                ))}
            </div>
        </div>
      )}
    </section>
  );
};

export default AnimeCarousel;