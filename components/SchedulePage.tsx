import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAiringSchedule } from '../services/anilistService';
import { AiringSchedule } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface SchedulePageProps {
  onSelectAnime: (anime: { anilistId: number }) => void;
}

const SchedulePage: React.FC<SchedulePageProps> = ({ onSelectAnime }) => {
  const [scheduleList, setScheduleList] = useState<AiringSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const schedules = await getAiringSchedule();
        setScheduleList(schedules);
      } catch (error) {
        console.error("Failed to fetch airing schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const dayCount = 7;
  const dates = useMemo(() => {
    return Array.from({ length: dayCount }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date;
    });
  }, [today, dayCount]);

  const todaysSchedule = useMemo(() => {
    return scheduleList
      .filter(item => {
        const itemDate = new Date(item.airingAt * 1000);
        return (
          itemDate.getFullYear() === selectedDate.getFullYear() &&
          itemDate.getMonth() === selectedDate.getMonth() &&
          itemDate.getDate() === selectedDate.getDate()
        );
      })
      .sort((a, b) => a.airingAt - b.airingAt);
  }, [scheduleList, selectedDate]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <section className="mt-12 mb-12 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white border-l-4 border-cyan-400 pl-4">{title}</h2>
        </div>
        <div className="relative">
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-800/50 p-2 rounded-full hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto pb-4 carousel-scrollbar px-12">
                {dates.map(date => {
                    const isSelected = date.getTime() === selectedDate.getTime();
                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => setSelectedDate(date)}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors text-center ${isSelected ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
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
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gray-800/50 p-2 rounded-full hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
        <div className="mt-6">
            {todaysSchedule.length > 0 ? (
                todaysSchedule.map(item => (
                    <div 
                        key={item.id}
                        onClick={() => onSelectAnime({ anilistId: item.media.id })}
                        className="flex items-center justify-between py-4 border-b border-gray-800 cursor-pointer hover:bg-gray-900 px-2 rounded-md transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-gray-400 font-mono text-sm w-16">
                                {new Date(item.airingAt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <span className="text-white font-semibold">
                                {item.media.title.english || item.media.title.romaji}
                            </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                            ▸ Episode {item.episode}
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