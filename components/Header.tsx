import React, { useState, useEffect, useRef } from 'react';
import { SearchSuggestion, FilterState } from '../types';
import SearchSuggestions from './SearchSuggestions';
import DropdownMenu from './DropdownMenu';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSearch: (term: string) => void;
  onHomeClick: () => void;
  onFilterClick: () => void;
  searchTerm: string;
  suggestions: SearchSuggestion[];
  onSuggestionClick: (anime: { anilistId: number }) => void;
  isSuggestionsLoading: boolean;
  onNavigate: (filters: Partial<FilterState>, title: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  onHomeClick, 
  onFilterClick, 
  searchTerm,
  suggestions,
  onSuggestionClick,
  isSuggestionsLoading,
  onNavigate
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { user, login, logout, isLoading: isAuthLoading } = useAuth();
  
  const showSuggestions = isSearchFocused && searchTerm.trim() !== '';

  // Handle click outside to close suggestions and menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [headerRef]);

  return (
    <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 p-4 shadow-lg" ref={headerRef}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-1 rounded-md hover:bg-gray-700 transition-colors" aria-label="Open menu">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
             <h1 
                className="text-2xl font-black text-white cursor-pointer"
                onClick={onHomeClick}
            >
                <span className="text-cyan-400">Ani</span>GloK
            </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
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
              onFocus={() => setIsSearchFocused(true)}
              className="bg-gray-800 text-white rounded-full py-2 pl-10 pr-24 w-48 sm:w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
            {/* Filter Button */}
            <button 
              onClick={onFilterClick} 
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-gray-700/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors rounded-full px-3 py-1"
              aria-label="Open filters"
            >
              <span className="font-semibold text-sm">Filter</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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

           {/* Auth Section */}
          <div className="flex items-center">
            {isAuthLoading ? (
                 <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
            ) : user ? (
                <div className="relative group">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full cursor-pointer border-2 border-transparent group-hover:border-cyan-400 transition-colors" />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg hidden group-hover:block animate-fade-in-fast z-50">
                        <div className="p-3 border-b border-gray-700">
                        <p className="font-semibold text-white truncate">{user.name}</p>
                        </div>
                        <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-b-md">
                        Logout
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={login} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-full transition-colors whitespace-nowrap">
                    Login
                </button>
            )}
          </div>
        </div>
      </div>
      <DropdownMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onFilterClick={onFilterClick}
        onNavigate={onNavigate}
      />
    </header>
  );
};

export default Header;
