import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AiringSchedule } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface SchedulePageProps {
  schedule: AiringSchedule[];
  onSelectAnime: (anime: { anilistId: number }) => void;
  onClose: () => void;
}

const SchedulePage: React.FC<SchedulePageProps> = ({ schedule, onSelectAnime, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const dayCount = 7;
  const dates = useMemo(() => {
    return Array.from({ length: dayCount }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date;
    });
  }, [today, dayCount]);

  const todaysSchedule = useMemo(() => {
    return schedule
      .filter(item => {
        const itemDate = new Date(item.airingAt * 1000);
        return (
          itemDate.getFullYear() === selectedDate.getFullYear() &&
          itemDate.getMonth() === selectedDate.getMonth() &&
          itemDate.getDate() === selectedDate.getDate()
        );
      })
      .sort((a, b) => a.airingAt - b.airingAt);
  }, [schedule, selectedDate]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.7;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const title = "Airing Schedule";

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <section className="mb-12 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                </span>
                <span>{title}</span>
            </h2>
             <button 
                onClick={onClose} 
                className="group flex items-center gap-1.5 text-gray-400 hover:text-white font-semibold transition-colors text-sm md:text-base whitespace-nowrap"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close Schedule</span>
            </button>
        </div>
        <div className="relative">
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-800/50 p-2 rounded-full hover:bg-gray-700 transition-colors hidden sm:block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto pb-4 carousel-scrollbar sm:px-12">
                {dates.map(date => {
                    const isSelected = date.getTime() === selectedDate.getTime();
                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => setSelectedDate(date)}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors text-center border-2 ${isSelected ? 'bg-gray-800 border-cyan-500' : 'border-transparent hover:bg-gray-800/50'}`}
                        >
                            <p className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className={`text-sm ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                                {date.toLocaleDateString('en-US', { month: 'short' })} {date.getDate()}
                            </p>
                        </button>
                    )
                })}
            </div>
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gray-800/50 p-2 rounded-full hover:bg-gray-700 transition-colors hidden sm:block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
        <div className="mt-6 bg-gray-900/50 rounded-lg p-2">
            {todaysSchedule.length > 0 ? (
                todaysSchedule.map(item => (
                    <div 
                        key={item.id}
                        onClick={() => onSelectAnime({ anilistId: item.media.id })}
                        className="flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-800/50 rounded-lg transition-colors group"
                    >
                        <span className="text-cyan-400 font-mono text-sm w-16 text-center">{new Date(item.airingAt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                        <img 
                            src={item.media.coverImage.extraLarge} 
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }} 
                            alt={item.media.title.english || item.media.title.romaji} 
                            className="w-12 h-16 object-cover rounded-md flex-shrink-0 shadow-md" 
                        />
                        <div className="flex-grow overflow-hidden">
                            <p className="text-white font-semibold truncate group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                                {item.media.title.english || item.media.title.romaji}
                                {item.media.isAdult && <span className="flex-shrink-0 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">18+</span>}
                            </p>
                        </div>
                        <span className="text-gray-400 text-sm font-semibold pr-4">
                           Episode {item.episode}
                        </span>
                    </div>
                ))
            ) : (
                <div className="text-center py-12 text-gray-500">
                    No episodes scheduled for this day.
                </div>
            )}
        </div>
    </section>
  );
};

export default SchedulePage;