
import React from 'react';
import { HiAnime } from '../types';

interface HiAnimeCardProps {
  anime: HiAnime;
  onSelect: (anime: HiAnime) => void;
}

const HiAnimeCard: React.FC<HiAnimeCardProps> = ({ anime, onSelect }) => {
  return (
    <div 
      className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg"
      onClick={() => onSelect(anime)}
    >
      <img
        src={anime.coverImage}
        alt={anime.title}
        className="w-full h-48 object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      <div className="p-2 absolute bottom-0 left-0">
        <h3 className="text-white text-sm font-bold truncate group-hover:whitespace-normal">{anime.title}</h3>
      </div>
    </div>
  );
};

export default HiAnimeCard;
