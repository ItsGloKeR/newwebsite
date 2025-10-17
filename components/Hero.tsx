import React, { useState, useEffect } from 'react';
import { Anime } from '../types';

interface HeroProps {
  animes: Anime[];
  onWatchNow: (anime: Anime) => void;
  onDetails: (anime: Anime) => void;
}

const Hero: React.FC<HeroProps> = ({ animes, onWatchNow, onDetails }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const animeList = animes.slice(0, 10); // Ensure we only show up to 10

  useEffect(() => {
    if (animeList.length <= 1) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % animeList.length);
    }, 7000); // Change slide every 7 seconds

    return () => clearTimeout(timer);
  }, [currentIndex, animeList.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + animeList.length) % animeList.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % animeList.length);
  };
  
  if (animeList.length === 0) {
    return null;
  }

  const currentAnime = animeList[currentIndex];
  const description = currentAnime.description.length > 250
    ? `${currentAnime.description.substring(0, 250)}...`
    : currentAnime.description;

  const titleWords = currentAnime.title.split(' ');
  const displayTitle = titleWords.length > 7 ? titleWords.slice(0, 7).join(' ') + '...' : currentAnime.title;

  return (
    <div className="relative h-[60vh] md:h-[80vh] w-full text-white overflow-hidden">
      {/* Background Image and Gradients */}
      <div className="absolute inset-0">
        <img
          key={currentAnime.anilistId} // Add key to force re-render/animation
          src={currentAnime.bannerImage || currentAnime.coverImage}
          alt={currentAnime.title}
          className="w-full h-full object-cover brightness-50 animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 to-transparent"></div>
      </div>

      {/* Content */}
      <div key={currentIndex} className="container mx-auto relative z-10 h-full flex items-end p-4 md:p-8 animate-fade-in">
        <div className="max-w-xl">
          <p className="text-cyan-400 font-semibold text-lg drop-shadow-md">#{currentIndex + 1} Spotlight</p>
          <h1 className="text-4xl md:text-6xl font-black drop-shadow-lg leading-tight break-words">{displayTitle}</h1>
          <div className="flex items-center gap-4 my-4 text-gray-300 text-sm">
            <span>{currentAnime.year}</span>
            <span>&bull;</span>
            <span>{currentAnime.genres[0]}</span>
            <span>&bull;</span>
            <span>{currentAnime.episodes} Episodes</span>
          </div>
          <p className="text-gray-200 leading-relaxed hidden md:block">{description}</p>
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => onWatchNow(currentAnime)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Watch Now
            </button>
            <button
              onClick={() => onDetails(currentAnime)}
              className="bg-gray-700/70 hover:bg-gray-600/70 backdrop-blur-sm text-white font-bold py-3 px-8 rounded-full transition-colors"
            >
              Detail &gt;
            </button>
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      {animeList.length > 1 && (
        <>
            <button onClick={goToPrevious} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 p-2 rounded-full hover:bg-black/60 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={goToNext} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 p-2 rounded-full hover:bg-black/60 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </>
      )}

    </div>
  );
};

export default Hero;