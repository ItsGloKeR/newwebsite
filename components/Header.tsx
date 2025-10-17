import React from 'react';
import { Anime } from '../types';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onHomeClick: () => void;
  onBackClick?: () => void;
  showBackButton?: boolean;
  isSearching: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  searchTerm, 
  onSearchChange,
  onSearchSubmit, 
  onHomeClick,
  onBackClick,
  showBackButton,
  isSearching,
}) => {
  
  return (
    <header className="bg-gray-950/80 backdrop-blur-md sticky top-0 z-50 p-4 shadow-lg shadow-black/20">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button onClick={onBackClick} className="text-white bg-gray-800/50 p-2 rounded-full hover:bg-cyan-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 
            className="text-2xl md:text-3xl font-black text-white cursor-pointer"
            onClick={onHomeClick}
          >
            <span className="text-cyan-400">Ani</span>Stream
          </h1>
        </div>
        <div className="relative w-full max-w-xs">
          <form onSubmit={onSearchSubmit}>
            <input
              type="text"
              placeholder="Search for anime..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-full py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
            />
          </form>
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-cyan-400"></div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;