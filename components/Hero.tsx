import React, { useState, useEffect } from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

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
  const description = currentAnime.description.length > 200
    ? `${currentAnime.description.substring(0, 200)}...`
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
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 to-transparent"></div>
      </div>

      {/* Content */}
      <div key={currentIndex} className="container mx-auto relative z-10 h-full flex items-center p-4 md:p-8 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-4xl">
            {/* Image Tile */}
            <img
                key={currentAnime.anilistId + '-cover'} // Key for transition
                src={currentAnime.coverImage}
                alt={currentAnime.title}
                className="w-48 md:w-56 rounded-lg shadow-2xl object-cover flex-shrink-0 animate-fade-in"
                style={{ aspectRatio: '2/3' }}
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
            {/* Info */}
            <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-cyan-400 font-semibold text-base md:text-lg drop-shadow-md mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>#{currentIndex + 1} Spotlight</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black drop-shadow-lg leading-tight break-words">{displayTitle}</h1>
                <div className="flex items-center justify-center md:justify-start gap-4 my-3 text-gray-300 text-sm">
                    <span>{currentAnime.year}</span>
                    <span>&bull;</span>
                    <span>{currentAnime.genres[0]}</span>
                    <span>&bull;</span>
                    <span>{currentAnime.episodes} Episodes</span>
                </div>
                <p className="text-gray-200 leading-relaxed hidden md:block text-sm">{description}</p>
                <div className="mt-5 flex gap-4 justify-center md:justify-start">
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
                        className="bg-gray-700/70 hover:bg-gray-600/70 backdrop-blur-sm text-white font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Details
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Indicators */}
      {animeList.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
          {animeList.map((_, index) => (
            <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`
                    h-2 rounded-full transition-all duration-300 ease-in-out
                    ${currentIndex === index ? 'w-6 bg-white' : 'w-2 bg-gray-400/70 hover:bg-white'}
                `}
                aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
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