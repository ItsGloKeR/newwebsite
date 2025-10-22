import React, { useState, useEffect, useRef } from 'react';
import { SearchSuggestion, FilterState } from '../types';
import SearchSuggestions from './SearchSuggestions';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';
import { getSearchHistory, removeSearchTermFromHistory, clearSearchHistory } from '../services/cacheService';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/firebaseService';
import UserMenu from './UserMenu';


interface HeaderProps {
  onSearch: (term: string) => void;
  onHomeClick: () => void;
  onLogoClick: () => void;
  onMenuClick: () => void;
  onFilterClick: () => void;
  onRandomAnime: () => void;
  isRandomLoading?: boolean;
  onLoginClick: () => void;
  onProfileClick: () => void;
  onSearchSubmit: () => void;
  searchTerm: string;
  suggestions: SearchSuggestion[];
  onSuggestionClick: (anime: { anilistId: number }) => void;
  isSuggestionsLoading: boolean;
  onNavigate: (filters: Partial<FilterState> & { list?: 'watchlist' | 'favorites' | 'continue-watching' }, title: string) => void;
  isBannerInView: boolean;
}

const SocialIcon: React.FC<{ href: string; ariaLabel: string; children: React.ReactNode }> = ({ href, ariaLabel, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className="text-gray-200 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
        {children}
    </a>
);

// Icons for the new mobile header
const SearchIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CloseIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;


const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  onHomeClick, 
  onLogoClick,
  onMenuClick,
  onFilterClick,
  onRandomAnime,
  isRandomLoading,
  onLoginClick,
  onProfileClick,
  onSearchSubmit,
  searchTerm,
  suggestions,
  onSuggestionClick,
  isSuggestionsLoading,
  onNavigate,
  isBannerInView
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  
  const { titleLanguage, setTitleLanguage } = useTitleLanguage();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { user } = useAuth();
  
  const showSuggestions = isSearchFocused && searchTerm.trim() !== '';
  const showHistory = isSearchFocused && searchTerm.trim() === '' && searchHistory.length > 0;
  const showDropdown = showSuggestions || showHistory;

  // Auto-focus mobile search input
  useEffect(() => {
    if (isMobileSearchActive) {
        setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
    }
  }, [isMobileSearchActive]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
        setIsMobileSearchActive(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [headerRef]);
  
  const handleLocalSearchSubmit = () => {
    onSearchSubmit();
    setIsMobileSearchActive(false); // Close mobile search on submit
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleLocalSearchSubmit();
    }
  };
  
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setSearchHistory(getSearchHistory());
  };

  const handleHistoryClick = (term: string) => {
    onSearch(term);
    setTimeout(() => {
        handleLocalSearchSubmit();
    }, 0);
  };
  
  const handleRemoveHistoryItem = (term: string) => {
    removeSearchTermFromHistory(term);
    setSearchHistory(prev => prev.filter(t => t !== term));
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  const handleCloseMobileSearch = () => {
      setIsMobileSearchActive(false);
      onSearch(''); // Clear search term on close
  }

  return (
    <header className="sticky top-0 z-50" ref={headerRef}>
      <div className={`absolute inset-0 transition-all duration-300 backdrop-blur-lg ${isMobileSearchActive || !isBannerInView ? 'bg-gray-950/80 shadow-lg' : 'bg-transparent'}`} />
      
      <div className="relative container mx-auto max-w-screen-2xl flex justify-between items-center p-3">

        {/* --- DESKTOP HEADER (md and up) --- */}
        <div className="hidden md:flex justify-between items-center w-full">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="text-white p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Open menu">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="cursor-pointer" onClick={onLogoClick}>
                    <svg width="105" height="24" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.6923 4.5L2.84615 27.5H30.5385L16.6923 4.5Z" stroke="#22d3ee" strokeWidth="2"/><path d="M16.6923 15.5L11.7692 23.5H21.6154L16.6923 15.5Z" fill="white"/><text x="40" y="23" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="900" fill="#22d3ee">Ani<tspan fill="white">GloK</tspan></text>
                    </svg>
                </div>
                <button onClick={onHomeClick} className="flex items-center gap-1.5 text-white p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Go to homepage">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                    <span className="font-semibold text-sm">Home</span>
                </button>
            </div>

            <div className="flex-1 flex justify-center px-4">
                 <div className="relative w-full max-w-md" ref={searchContainerRef}>
                    <button onClick={handleLocalSearchSubmit} className="absolute left-0 top-0 bottom-0 flex items-center pl-4 text-gray-400 hover:text-white transition-colors z-10" aria-label="Submit search">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                    <input type="text" placeholder="Search anime..." value={searchTerm} onChange={(e) => onSearch(e.target.value)} onKeyDown={handleKeyDown} onFocus={handleSearchFocus} className="bg-gray-900/80 text-white rounded-full py-2 pl-12 pr-24 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all border border-transparent focus:border-cyan-500" />
                    <button onClick={onFilterClick} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-gray-700/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors rounded-full px-3 py-1" aria-label="Open filters"><span className="font-semibold text-sm">Filter</span></button>
                    {showDropdown && (<SearchSuggestions suggestions={showSuggestions ? suggestions : undefined} history={showHistory ? searchHistory : undefined} onSuggestionClick={onSuggestionClick} isLoading={isSuggestionsLoading} onViewAllClick={handleLocalSearchSubmit} onHistoryClick={handleHistoryClick} onRemoveHistoryItem={handleRemoveHistoryItem} onClearHistory={handleClearHistory} />)}
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <SocialIcon href="https://discord.gg/H9TtXfCumQ" ariaLabel="Discord"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317,4.444c-0.457-0.222-0.937-0.4-1.437-0.545c-0.171,0.308-0.366,0.668-0.582,1.065 c-1.535-0.418-3.176-0.418-4.711,0C12.83,5.632,12.635,5.272,12.465,4.967c-0.499,0.145-0.979,0.323-1.436,0.545 C6.232,7.9,4.425,12.28,4.5,16.521c1.559,1.75,3.528,2.693,5.556,2.836c0.334-0.472,0.63-0.985,0.88-1.533 c-0.652-0.222-1.272-0.518-1.849-0.88c0.239-0.15,0.47-0.31,0.69-0.48C9.932,16.35,10,16.205,10,16.205 s-0.125-0.038-0.347-0.133c-0.786-0.34-1.44-0.786-1.946-1.32c0.003,0,0.005-0.002,0.008-0.003c0,0-0.031-0.018-0.088-0.057 c-0.231-0.165-0.448-0.345-0.647-0.536c-0.124-0.117-0.24-0.237-0.354-0.365c-0.002-0.002-0.003-0.004-0.005-0.005 c-0.244-0.27-0.47-0.553-0.676-0.845c-0.015-0.022-0.03-0.043-0.044-0.065c-0.291-0.413-0.55-0.848-0.771-1.3c-0.02-0.04-0.038-0.08-0.057-0.118c-0.323-0.71-0.57-1.458-0.73-2.235C4.01,10.743,4.02,7.2,6.389,4.967C6.389,4.967,6.4,4.96,6.402,4.954C6.402,4.954,6.402,4.954,6.402,4.954c0.46-0.51,1.03-0.94,1.69-1.28 c0.21-0.107,0.42-0.21,0.64-0.3c0.036-0.014,0.07-0.03,0.1-0.04c0.44-0.17,0.9-0.3,1.36-0.4c0.52-0.11,1.05-0.18,1.6-0.2 c0.02,0,0.04-0.004,0.06-0.004c0.55-0.04,1.1-0.06,1.65-0.06s1.1,0.02,1.65,0.06c0.02,0,0.04,0.004,0.06,0.004 c0.55,0.02,1.08,0.09,1.6,0.2c0.46,0.1,0.92,0.23,1.36,0.4c0.03,0.01,0.06,0.026,0.1,0.04c0.22,0.09,0.43,0.193,0.64,0.3 c0.66,0.34,1.23,0.77,1.69,1.28C17.6,4.96,17.611,4.967,17.611,4.967C20.016,7.23,19.95,10.77,19.95,10.77 c-0.16,0.777-0.407,1.525-0.73,2.235c-0.019,0.038-0.037,0.078-0.057,0.118c-0.221,0.452-0.48,0.887-0.771,1.3 c-0.014,0.022-0.029,0.043-0.044,0.065c-0.205,0.292-0.432,0.575-0.676,0.845c-0.002,0.001-0.003,0.003-0.005,0.005 c-0.114,0.128-0.23,0.248-0.354,0.365c-0.199,0.191-0.416,0.371-0.647,0.536c-0.057,0.039-0.088,0.057-0.088,0.057 c0.003,0.001,0.005,0.003,0.008,0.003c-0.475,0.505-1.09,0.92-1.81,1.25c-0.1,0.04-0.2,0.08-0.3,0.12c-0.17,0.09-0.35,0.17-0.53,0.25 c-0.577,0.264-1.197,0.56-1.849,0.88c0.25,0.548,0.546,1.061,0.88,1.533c2.028-0.143,3.997-1.086,5.556-2.836 C19.575,12.28,17.768,7.9,20.317,4.444z M10.2,13.2c-0.664,0-1.2-0.6-1.2-1.33c0-0.73,0.536-1.33,1.2-1.33s1.2,0.6,1.2,1.33 C11.4,12.6,10.864,13.2,10.2,13.2z M13.8,13.2c-0.664,0-1.2-0.6-1.2-1.33c0-0.73,0.536-1.33,1.2-1.33s1.2,0.6,1.2,1.33 C15,12.6,14.464,13.2,13.8,13.2z" /></svg></SocialIcon>
                <div className="h-5 w-px bg-gray-700 mx-1"></div>
                <button onClick={onRandomAnime} disabled={isRandomLoading} title="Random Anime" className="text-gray-200 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isRandomLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-cyan-400"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" transform="rotate(45 10 10)" /></svg>
                    )}
                    <span className="hidden sm:inline text-sm font-semibold">Random</span>
                </button>
                <div className="bg-gray-800 rounded-full p-0.5 flex items-center text-xs font-bold"><button onClick={() => setTitleLanguage('english')} className={`px-2 py-0.5 rounded-full ${titleLanguage === 'english' ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>EN</button><button onClick={() => setTitleLanguage('romaji')} className={`px-2 py-0.5 rounded-full ${titleLanguage === 'romaji' ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>JP</button></div>
                <div className="h-5 w-px bg-gray-700 mx-1"></div>
                {user ? (<UserMenu user={user} onLogout={logout} onProfileClick={onProfileClick} onNavigate={onNavigate} />) : (<button onClick={onLoginClick} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">Login</button>)}
            </div>
        </div>

        {/* --- MOBILE HEADER (below md) --- */}
        <div className="flex md:hidden justify-between items-center w-full">
            <div className="flex items-center gap-2">
                <button onClick={onMenuClick} className="text-white p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Open menu"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                <div className="cursor-pointer" onClick={onLogoClick}><svg width="105" height="24" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.6923 4.5L2.84615 27.5H30.5385L16.6923 4.5Z" stroke="#22d3ee" strokeWidth="2"/><path d="M16.6923 15.5L11.7692 23.5H21.6154L16.6923 15.5Z" fill="white"/><text x="40" y="23" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="900" fill="#22d3ee">Ani<tspan fill="white">GloK</tspan></text></svg></div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsMobileSearchActive(true)} className="text-white p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Open search"><SearchIcon /></button>
                {user ? (<UserMenu user={user} onLogout={logout} onProfileClick={onProfileClick} onNavigate={onNavigate} />) : (<button onClick={onLoginClick} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1.5 px-3 rounded-md transition-colors text-sm">Login</button>)}
            </div>
        </div>
      </div>
       {/* --- MOBILE SEARCH BAR (appears below header) --- */}
        {isMobileSearchActive && (
            <div className="relative md:hidden container mx-auto max-w-screen-2xl p-3 pt-0 animate-fade-in-fast">
                <div className="flex items-center gap-2 w-full">
                    <div className="relative w-full">
                         <button onClick={handleLocalSearchSubmit} className="absolute left-0 top-0 bottom-0 flex items-center pl-4 text-gray-400 hover:text-white transition-colors z-10" aria-label="Submit search">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                        <input ref={mobileSearchInputRef} type="text" placeholder="Search anime..." value={searchTerm} onChange={(e) => onSearch(e.target.value)} onKeyDown={handleKeyDown} onFocus={handleSearchFocus} className="bg-gray-900 text-white rounded-full py-2 pl-12 pr-24 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all border border-transparent focus:border-cyan-500" />
                        <button onClick={onFilterClick} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-gray-700/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors rounded-full px-3 py-1" aria-label="Open filters"><span className="font-semibold text-sm">Filter</span></button>
                        {showDropdown && (<SearchSuggestions suggestions={showSuggestions ? suggestions : undefined} history={showHistory ? searchHistory : undefined} onSuggestionClick={onSuggestionClick} isLoading={isSuggestionsLoading} onViewAllClick={handleLocalSearchSubmit} onHistoryClick={handleHistoryClick} onRemoveHistoryItem={handleRemoveHistoryItem} onClearHistory={handleClearHistory} />)}
                    </div>
                    <button onClick={handleCloseMobileSearch} className="text-gray-400 p-2 rounded-md hover:bg-white/10" aria-label="Close search">
                        <CloseIcon />
                    </button>
                </div>
            </div>
        )}
    </header>
  );
};

export default Header;