import React, { useState, useEffect, useRef } from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';

interface HeroProps {
  animes: Anime[];
  onWatchNow: (anime: Anime) => void;
  onDetails: (anime: Anime) => void;
  onBannerChange: (url: string) => void;
  setInView: (inView: boolean) => void;
}

const Hero: React.FC<HeroProps> = ({ animes, onWatchNow, onDetails, onBannerChange, setInView }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const animeList = animes.slice(0, 10);
  const { titleLanguage } = useTitleLanguage();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1 } // Fires when at least 10% is visible
    );

    const currentRef = heroRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [setInView]);

  useEffect(() => {
    if (animeList.length > 0) {
      onBannerChange(animeList[currentIndex].bannerImage || animeList[currentIndex].coverImage);
    }
    
    if (animeList.length <= 1) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % animeList.length);
    }, 7000);

    return () => clearTimeout(timer);
  }, [currentIndex, animeList, onBannerChange]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + animeList.length) % animeList.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % animeList.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };
  
  if (animeList.length === 0) {
    return <div ref={heroRef} className="h-[60vh] md:h-[70vh] w-full bg-gray-900 animate-pulse"></div>;
  }

  const currentAnime = animeList[currentIndex];
  const title = titleLanguage === 'romaji' ? currentAnime.romajiTitle : currentAnime.englishTitle;
  
  const description = currentAnime.description
    ? (currentAnime.description.length > 250 ? `${currentAnime.description.substring(0, 250)}...` : currentAnime.description)
    : 'No description available.';

  return (
    <div ref={heroRef} className="relative h-[60vh] md:h-[70vh] w-full text-white overflow-hidden -mt-16 pt-16">
      {/* Background Image Slideshow */}
      <div className="absolute inset-0">
         {animeList.map((anime, index) => (
            <img
              key={anime.anilistId}
              src={anime.bannerImage || anime.coverImage}
              alt={anime.englishTitle}
              className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto relative z-10 h-full flex items-center p-4 md:p-8">
        <div key={currentIndex} className="flex items-center gap-4 md:gap-8 animate-fade-in">
          <img 
            src={currentAnime.coverImage} 
            alt={title} 
            className="hidden sm:block w-36 md:w-48 lg:w-56 h-auto object-cover rounded-lg shadow-2xl aspect-[2/3]"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
          />
          <div className="max-w-xl pb-24 sm:pb-0">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm md:text-lg mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 10a1 1 0 112 0 1 1 0 01-2 0zm-5 0a5 5 0 1110 0 5 5 0 01-10 0z" clipRule="evenodd" />
              </svg>
              <span>#{currentIndex + 1} Spotlight</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black drop-shadow-lg leading-tight break-words">{title}</h1>
            
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 my-4 text-gray-300 text-sm">
              <span className="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>{currentAnime.format}</span>
              <span className="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>{currentAnime.duration}m</span>
              <span className="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>{currentAnime.year}</span>
            </div>

            <p className="text-gray-200 leading-relaxed text-sm my-4">{description}</p>
            
            <div className="mt-6 flex gap-4">
                <button
                    onClick={() => onWatchNow(currentAnime)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 md:py-3 md:px-6 rounded-md transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    Watch Now
                </button>
                <button
                    onClick={() => onDetails(currentAnime)}
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-2 px-4 md:py-3 md:px-6 rounded-md transition-colors flex items-center gap-2"
                >
                    Details 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation and Pagination */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-8">
        {animeList.length > 1 && (
            <button onClick={goToPrevious} className="bg-black/30 p-2 rounded-full hover:bg-black/60 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
        )}

        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
            {animeList.map((_, index) => (
                <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all duration-300 rounded-full h-2
                        ${index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-gray-500 hover:bg-gray-300'}`
                    }
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>

        {animeList.length > 1 && (
            <button onClick={goToNext} className="bg-black/30 p-2 rounded-full hover:bg-black/60 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        )}
      </div>

    </div>
  );
};

export default Hero;