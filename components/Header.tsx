import React, { useState, useEffect, useRef } from 'react';
import { SearchSuggestion } from '../types';
import SearchSuggestions from './SearchSuggestions';

interface HeaderProps {
  onSearch: (term: string) => void;
  onHomeClick: () => void;
  onFilterClick: () => void;
  searchTerm: string;
  suggestions: SearchSuggestion[];
  onSuggestionClick: (anime: { anilistId: number }) => void;
  isSuggestionsLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  onHomeClick, 
  onFilterClick, 
  searchTerm,
  suggestions,
  onSuggestionClick,
  isSuggestionsLoading
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const showSuggestions = isFocused && searchTerm.trim() !== '';

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);


  return (
    <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 
          className="text-2xl font-black text-white cursor-pointer"
          onClick={onHomeClick}
        >
          <span className="text-cyan-400">Ani</span>GloK
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative" ref={searchContainerRef}>
            {/* Search Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search anime..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="bg-gray-800 text-white rounded-full py-2 pl-10 pr-10 w-48 md:w-64 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
            {/* Filter Button */}
            <button 
              onClick={onFilterClick} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              aria-label="Open filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
            </button>
            {showSuggestions && (
                <SearchSuggestions 
                    suggestions={suggestions} 
                    onSuggestionClick={onSuggestionClick} 
                    isLoading={isSuggestionsLoading}
                />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;