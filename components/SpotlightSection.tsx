import React, { useState, useEffect } from 'react';
import { Anime } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';
import { useUserData } from '../contexts/UserDataContext';
import GenrePill from './GenrePill';

interface SpotlightSectionProps {
  anime: Anime;
  onWatchNow: (anime: Anime) => void;
  onDetails: (anime: Anime) => void;
}

const SpotlightSection: React.FC<SpotlightSectionProps> = ({ anime, onWatchNow, onDetails }) => {
  const { titleLanguage } = useTitleLanguage();
  const { watchlist, favorites, toggleWatchlist, toggleFavorite } = useUserData();
  const [isInList, setIsInList] = useState(false);
  
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;

  useEffect(() => {
    setIsInList(watchlist.includes(anime.anilistId));
  }, [watchlist, anime.anilistId]);

  const handleToggleWatchlist = () => {
    toggleWatchlist(anime.anilistId);
    setIsInList(true);
  };
  
  const isFavorite = favorites.includes(anime.anilistId);

  const description = anime.description
    ? (anime.description.length > 300 ? `${anime.description.substring(0, 300)}...` : anime.description)
    : 'No description available.';

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] my-16 overflow-hidden">
      {/* Parallax Background */}
      <div
        className="absolute inset-0 bg-cover bg-fixed bg-center"
        style={{ backgroundImage: `url(${anime.bannerImage || anime.coverImage})` }}
      ></div>
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"></div>
      
      <div className="container mx-auto relative z-10 h-full flex items-center p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-white">
          <div className="md:col-span-1 flex justify-center">
            <img 
              src={anime.coverImage} 
              alt={title} 
              className="w-48 md:w-64 h-auto object-cover rounded-lg shadow-2xl aspect-[2/3] animate-fade-in"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
          </div>
          <div className="md:col-span-2 text-center md:text-left animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-cyan-400 font-bold uppercase tracking-widest mb-2 font-display">Movie Spotlight</p>
            <h2 className="text-4xl md:text-5xl font-black drop-shadow-lg leading-tight break-words font-display">{title}</h2>
            
            <div className="my-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {anime.genres.slice(0, 4).map(genre => <GenrePill key={genre} genre={genre} />)}
            </div>

            <p className="text-gray-200 leading-relaxed text-sm my-4 max-w-2xl mx-auto md:mx-0">{description}</p>
            
            <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start items-center">
                <button
                    onClick={() => onWatchNow(anime)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 md:py-3 md:px-6 rounded-md transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    Watch Now
                </button>
                <button
                    onClick={() => onDetails(anime)}
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-2 px-4 md:py-3 md:px-6 rounded-md transition-colors flex items-center gap-2"
                >
                    Details 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </button>
                <button
                    onClick={handleToggleWatchlist}
                    className={`font-bold p-3 rounded-full transition-all duration-300 flex items-center gap-2 relative overflow-hidden ${
                    isInList ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white'
                    }`}
                    aria-label={isInList ? 'In your list' : 'Add to your list'}
                >
                    <span className={`transition-opacity duration-200 ${isInList ? 'opacity-0' : 'opacity-100'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                    </span>
                    {isInList && (
                    <span className="absolute inset-0 flex items-center justify-center animate-show-check">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </span>
                    )}
                </button>
                 <button 
                    onClick={() => toggleFavorite(anime.anilistId)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-colors"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-300 ${isFavorite ? 'text-red-500' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightSection;