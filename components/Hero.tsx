import React from 'react';
import { Anime } from '../types';
import GenrePill from './GenrePill';

interface HeroProps {
  anime: Anime | null;
  onWatchNow: (anime: Anime) => void;
}

const Hero: React.FC<HeroProps> = ({ anime, onWatchNow }) => {
  if (!anime) {
    return (
      <div className="h-[75vh] bg-gray-900 animate-pulse flex items-center justify-center">
        <p className="text-white">Loading featured anime...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[75vh] w-full text-white overflow-hidden mb-8">
      <div className="absolute inset-0">
        <img
          src={anime.bannerImage}
          alt={anime.title}
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== anime.coverImage) {
              target.onerror = null; // prevent infinite loop if coverImage also fails
              target.src = anime.coverImage;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent"></div>
      </div>
      <div className="container mx-auto relative z-10 flex flex-col justify-center h-full p-4 md:p-8 md:w-1/2 lg:w-2/3">
        <div className="md:pl-10 text-center md:text-left">
          <p className="text-cyan-400 font-bold text-lg mb-2">#1 Spotlight</p>
          <h2 className="text-4xl lg:text-7xl font-black mb-4 leading-tight drop-shadow-lg">{anime.title}</h2>
          <div className="flex flex-wrap justify-center md:justify-start mb-4 gap-2">
            <span className="bg-gray-800 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full">{anime.year}</span>
            <span className="bg-gray-800 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full">HD</span>
            <span className="bg-gray-800 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full">{anime.episodes} Episodes</span>
          </div>
          <p className="text-gray-300 mb-6 line-clamp-3 max-w-2xl">{anime.description}</p>
          <button 
            onClick={() => onWatchNow(anime)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto md:mx-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Watch Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;