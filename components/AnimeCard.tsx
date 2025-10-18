import React from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onSelect }) => {
  return (
    <div 
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30"
      onClick={() => onSelect(anime)}
    >
      <img
        src={anime.coverImage}
        alt={anime.title}
        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-100 brightness-90"
        loading="lazy"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
      />
      {anime.isAdult && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
          18+
        </div>
      )}
      {anime.episodes != null && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
          {anime.episodes} Ep
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4">
        <h3 className="text-white text-lg font-bold truncate group-hover:whitespace-normal">{anime.title}</h3>
        <p className="text-gray-300 text-sm">{anime.year}</p>
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

export default AnimeCard;