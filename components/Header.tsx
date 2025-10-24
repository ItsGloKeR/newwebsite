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
                <a href="https://glokflix.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-white p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Visit GlokFlix for movies">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 4a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm10 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-sm">Movies</span>
                </a>
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
                <SocialIcon href="https://discord.gg/H9TtXfCumQ" ariaLabel="Discord">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0.5 24 24" fill="currentColor">
                    <path d="M20.317 4.54101C18.7873 3.82774 17.147 3.30224 15.4319 3.00126C15.4007 2.99545 15.3695 3.00997 15.3534 3.039C15.1424 3.4203 14.9087 3.91774 14.7451 4.30873C12.9004 4.02808 11.0652 4.02808 9.25832 4.30873C9.09465 3.90905 8.85248 3.4203 8.64057 3.039C8.62448 3.01094 8.59328 2.99642 8.56205 3.00126C6.84791 3.30128 5.20756 3.82678 3.67693 4.54101C3.66368 4.54681 3.65233 4.5565 3.64479 4.56907C0.533392 9.29283 -0.31895 13.9005 0.0991801 18.451C0.101072 18.4733 0.11337 18.4946 0.130398 18.5081C2.18321 20.0401 4.17171 20.9701 6.12328 21.5866C6.15451 21.5963 6.18761 21.5847 6.20748 21.5585C6.66913 20.9179 7.08064 20.2424 7.43348 19.532C7.4543 19.4904 7.43442 19.441 7.39186 19.4246C6.73913 19.173 6.1176 18.8662 5.51973 18.5178C5.47244 18.4897 5.46865 18.421 5.51216 18.3881C5.63797 18.2923 5.76382 18.1926 5.88396 18.0919C5.90569 18.0736 5.93598 18.0697 5.96153 18.0813C9.88928 19.9036 14.1415 19.9036 18.023 18.0813C18.0485 18.0687 18.0788 18.0726 18.1015 18.091C18.2216 18.1916 18.3475 18.2923 18.4742 18.3881C18.5177 18.421 18.5149 18.4897 18.4676 18.5178C17.8697 18.8729 17.2482 19.173 16.5945 19.4236C16.552 19.4401 16.533 19.4904 16.5538 19.532C16.9143 20.2414 17.3258 20.9169 17.7789 21.5576C17.7978 21.5847 17.8319 21.5963 17.8631 21.5866C19.8241 20.9701 21.8126 20.0401 23.8654 18.5081C23.8834 18.4946 23.8948 18.4742 23.8967 18.452C24.3971 13.1911 23.0585 8.6212 20.3482 4.57004C20.3416 4.5565 20.3303 4.54681 20.317 4.54101ZM8.02002 15.6802C6.8375 15.6802 5.86313 14.577 5.86313 13.222C5.86313 11.8671 6.8186 10.7639 8.02002 10.7639C9.23087 10.7639 10.1958 11.8768 10.1769 13.222C10.1769 14.577 9.22141 15.6802 8.02002 15.6802ZM15.9947 15.6802C14.8123 15.6802 13.8379 14.577 13.8379 13.222C13.8379 11.8671 14.7933 10.7639 15.9947 10.7639C17.2056 10.7639 18.1705 11.8768 18.1516 13.222C18.1516 14.577 17.2056 15.6802 15.9947 15.6802Z" />
                  </svg>
                </SocialIcon>
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