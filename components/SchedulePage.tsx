


import React, { useState, useEffect } from 'react';
import { getAiringSchedule } from '../services/anilistService';
import { AiringSchedule } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface SchedulePageProps {
  onSelectAnime: (anime: { anilistId: number }) => void;
}

const ScheduleCard: React.FC<{ schedule: AiringSchedule, onSelect: () => void }> = ({ schedule, onSelect }) => {
  const airingTime = new Date(schedule.airingAt * 1000);
  const timeString = airingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayString = airingTime.toLocaleDateString([], { weekday: 'long' });

  return (
    <div 
      className="flex gap-4 p-4 bg-gray-900 rounded-lg cursor-pointer transition-transform transform hover:scale-105"
      onClick={onSelect}
    >
      <img 
        src={schedule.media.coverImage.extraLarge} 
        alt={schedule.media.title.romaji} 
        className="w-20 h-28 object-cover rounded-md"
      />
      <div className="flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white line-clamp-2">{schedule.media.title.english || schedule.media.title.romaji}</h3>
          <p className="text-gray-400 text-sm">Episode {schedule.episode}</p>
        </div>
        <div className="mt-2">
          <p className="text-cyan-400 font-semibold">{dayString}</p>
          <p className="text-cyan-300">{timeString}</p>
        </div>
      </div>
    </div>
  )
};

const SchedulePage: React.FC<SchedulePageProps> = ({ onSelectAnime }) => {
  const [scheduleByDay, setScheduleByDay] = useState<Record<string, AiringSchedule[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const scheduleList = await getAiringSchedule();
        const groupedByDay: Record<string, AiringSchedule[]> = scheduleList.reduce((acc, item) => {
          const day = new Date(item.airingAt * 1000).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
          if (!acc[day]) {
            acc[day] = [];
          }
          acc[day].push(item);
          return acc;
        }, {} as Record<string, AiringSchedule[]>);
        setScheduleByDay(groupedByDay);
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

  return (
    <section className="mt-12 animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-cyan-400 pl-4">Airing Schedule (Next 7 Days)</h2>
      {Object.keys(scheduleByDay).length === 0 && !isLoading && (
        <p className="text-gray-400">No airing schedule found for the next 7 days.</p>
      )}
      <div className="flex flex-col gap-8">
        {/* FIX: Use Object.keys to iterate over the scheduleByDay object.
            This resolves a TypeScript issue where Object.entries was inferring the value as 'unknown'.
            Accessing the value via scheduleByDay[day] ensures the correct type is used. */}
        {Object.keys(scheduleByDay).map((day) => (
          <div key={day}>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">{day}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduleByDay[day].map(schedule => (
                <ScheduleCard key={schedule.id} schedule={schedule} onSelect={() => handleSelect(schedule)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SchedulePage;