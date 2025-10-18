import React, { useState, useEffect } from 'react';
import { getAiringSchedule } from '../services/anilistService';
import { AiringSchedule } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface SchedulePageProps {
  onSelectAnime: (anime: { anilistId: number }) => void;
}

const ScheduleCard: React.FC<{ schedule: AiringSchedule, onSelect: () => void }> = ({ schedule, onSelect }) => {
  const airingTime = new Date(schedule.airingAt * 1000);
  const timeString = airingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayString = airingTime.toLocaleDateString([], { weekday: 'short' });
  const title = schedule.media.title.english || schedule.media.title.romaji;

  return (
    <div 
      className="flex-shrink-0 w-40 cursor-pointer group"
      onClick={onSelect}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-105">
          <img 
            src={schedule.media.coverImage.extraLarge} 
            alt={title} 
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
              <p className="text-white text-sm font-bold line-clamp-2">{title}</p>
          </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-cyan-400 font-semibold text-sm">Ep {schedule.episode} airs {dayString}</p>
        <p className="text-gray-300 text-xs">{timeString}</p>
      </div>
    </div>
  )
};

const SchedulePage: React.FC<SchedulePageProps> = ({ onSelectAnime }) => {
  const [scheduleList, setScheduleList] = useState<AiringSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSelect = (schedule: AiringSchedule) => {
    onSelectAnime({ anilistId: schedule.media.id });
  };
  
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (scheduleList.length === 0) {
      return null;
  }

  return (
    <section className="mt-12 animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-cyan-400 pl-4">Airing Schedule</h2>
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 carousel-scrollbar">
        {scheduleList.map(schedule => (
            <ScheduleCard key={schedule.id} schedule={schedule} onSelect={() => handleSelect(schedule)} />
        ))}
      </div>
    </section>
  );
};

export default SchedulePage;