import React from 'react';
import { EnrichedAiringSchedule } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface LatestEpisodeCardProps {
  schedule: EnrichedAiringSchedule;
  onSelect: (anime: { anilistId: number }) => void;
}

const LatestEpisodeCard: React.FC<LatestEpisodeCardProps> = ({ schedule, onSelect }) => {
  const { media } = schedule;
  const title = media.title.english || media.title.romaji;
  
  return (
    <div 
      className="group cursor-pointer text-left w-full h-full flex flex-col"
      onClick={() => onSelect({ anilistId: media.id })}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-cyan-500/30">
        <img
          src={media.coverImage.extraLarge}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
        />
        {media.isAdult && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
            18+
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
          EP {schedule.episode}
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="pt-3">
        <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="Airing"></div>
            <h3 className="text-white text-sm font-bold truncate group-hover:text-cyan-400 transition-colors" title={title}>{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-xs">
            <span className="font-semibold">Ep {schedule.episode} just aired</span>
        </div>
      </div>
    </div>
  );
};

export default LatestEpisodeCard;