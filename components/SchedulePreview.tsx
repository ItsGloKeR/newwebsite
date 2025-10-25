
import React, { useMemo } from 'react';
import { AiringSchedule } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface SchedulePreviewProps {
  schedule: AiringSchedule[];
  onSelectAnime: (anime: { anilistId: number }) => void;
  onShowMore: () => void;
  isLoading?: boolean;
}

const SchedulePreview: React.FC<SchedulePreviewProps> = ({ schedule, onSelectAnime, onShowMore, isLoading }) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const nextAiringEpisodes = useMemo(() => {
    return schedule
      .filter(item => {
        const itemDate = new Date(item.airingAt * 1000);
        return itemDate >= today; // Filter for episodes from today onwards
      })
      .sort((a, b) => a.airingAt - b.airingAt) // Sort by airing time
      .slice(0, 5); // Take top 5 for preview
  }, [schedule, today]);

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (nextAiringEpisodes.length === 0) {
    return null; // Don't render if no upcoming episodes
  }

  return (
    <section className="mb-12 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-display tracking-wide uppercase">
          <span className="text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
          </span>
          <span>Upcoming Schedule</span>
        </h2>
        <button
          onClick={onShowMore}
          className="group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm md:text-base whitespace-nowrap"
        >
          <span>View Full Schedule</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
      <div className="bg-gray-900/50 rounded-lg p-2">
        {nextAiringEpisodes.map(item => (
          <div
            key={item.id}
            onClick={() => onSelectAnime({ anilistId: item.media.id })}
            className="flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-800/50 rounded-lg transition-colors group"
          >
            <span className="text-cyan-400 font-mono text-sm w-16 text-center">
              {new Date(item.airingAt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
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
              <p className="text-gray-400 text-xs">
                {new Date(item.airingAt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
              </p>
            </div>
            <span className="text-gray-400 text-sm font-semibold pr-4">
              Episode {item.episode}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SchedulePreview;