import React, { useState } from 'react';
import { MediaSort, FilterState, MediaFormat, MediaStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/firebaseService';
import { DEFAULT_AVATAR_URL } from '../constants';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';

// Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const TrendingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const ScheduleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const RandomIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" transform="rotate(45 10 10)" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LoginIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (filters: Partial<FilterState> & { list?: 'watchlist' | 'favorites' | 'continue-watching' }, title: string) => void;
  onHomeClick: () => void;
  onScheduleClick: () => void;
  onLoginClick: () => void;
  onProfileClick: () => void;
  onRandomAnime: () => void;
  isRandomLoading?: boolean;
  allGenres: string[];
  isHome: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, onHomeClick, onScheduleClick, onLoginClick, onProfileClick, onRandomAnime, isRandomLoading, allGenres, isHome }) => {
  const [isGenresOpen, setIsGenresOpen] = useState(false);
  const [isTypesOpen, setIsTypesOpen] = useState(false);
  const { user } = useAuth();
  const { titleLanguage, setTitleLanguage } = useTitleLanguage();

  const handleLinkClick = (filters: Partial<FilterState> & { list?: 'watchlist' | 'favorites' | 'continue-watching' }, title: string) => {
    onNavigate(filters, title);
    onClose();
  };
  
  const handleHomeClick = () => {
    onHomeClick();
    onClose();
  };
  
  const handleLogout = () => {
    logout();
    onClose();
  };
  
  const handleRandomClick = () => {
    if (isRandomLoading) return;
    onRandomAnime();
    onClose();
  };

  const NavItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, isActive?: boolean, disabled?: boolean }> = ({ icon, label, onClick, isActive, disabled }) => (
    <li>
      <button 
        onClick={onClick} 
        disabled={disabled}
        className={`w-full flex items-center gap-4 p-3 rounded-lg text-left transition-colors ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {disabled ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-400"></div> : icon}
        <span className="font-semibold">{label}</span>
      </button>
    </li>
  );
  
  const typeItems = [
    { label: 'Movies', filters: { formats: [MediaFormat.MOVIE] }, title: 'Movies' },
    { label: 'TV Series', filters: { formats: [MediaFormat.TV, MediaFormat.TV_SHORT] }, title: 'TV Series' },
    { label: 'OVAs', filters: { formats: [MediaFormat.OVA] }, title: 'OVAs' },
    { label: 'ONAs', filters: { formats: [MediaFormat.ONA] }, title: 'ONAs' },
    { label: 'Specials', filters: { formats: [MediaFormat.SPECIAL] }, title: 'Specials' },
  ];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="sidebar-title" className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-lg" onClick={onClose} />
      
      {/* Sidebar */}
      <nav className={`relative w-72 h-full bg-gray-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <h2 id="sidebar-title" className="sr-only">Main Menu</h2>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <svg width="105" height="24" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6923 4.5L2.84615 27.5H30.5385L16.6923 4.5Z" stroke="#22d3ee" strokeWidth="2"/>
              <path d="M16.6923 15.5L11.7692 23.5H21.6154L16.6923 15.5Z" fill="white"/>
              <text x="40" y="23" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="900" fill="#22d3ee">
                  Ani<tspan fill="white">GloK</tspan>
              </text>
          </svg>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50" aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          <ul className="space-y-2">
            <NavItem icon={<HomeIcon />} label="Home" onClick={handleHomeClick} isActive={isHome} />
            <NavItem icon={<TrendingIcon />} label="Trending" onClick={() => handleLinkClick({ sort: MediaSort.TRENDING_DESC }, "Trending Anime")} />
            <NavItem icon={<ScheduleIcon />} label="Schedule" onClick={onScheduleClick} />
            <NavItem icon={<RandomIcon />} label="Random" onClick={handleRandomClick} disabled={isRandomLoading} />
          </ul>
          
          <hr className="border-gray-800 my-4" />
          
          <ul className="space-y-2">
            <NavItem icon={<ListIcon />} label="My List" onClick={() => handleLinkClick({ list: 'watchlist' }, 'My Watchlist')} />
            <NavItem icon={<HeartIcon />} label="Favorites" onClick={() => handleLinkClick({ list: 'favorites' }, 'My Favorites')} />
            <NavItem icon={<HistoryIcon />} label="Continue Watching" onClick={() => handleLinkClick({ list: 'continue-watching' }, 'Continue Watching')} />
            {user && <NavItem icon={<SettingsIcon />} label="Profile" onClick={onProfileClick} />}
          </ul>

          <hr className="border-gray-800 my-4" />

          <div>
              <ul className="space-y-1">
                  <li><button onClick={() => handleLinkClick({ statuses: [MediaStatus.RELEASING], sort: MediaSort.START_DATE_DESC }, 'New Releases')} className="w-full text-left p-3 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors font-semibold">New Releases</button></li>
                  <li><button onClick={() => handleLinkClick({ statuses: [MediaStatus.RELEASING], sort: MediaSort.TRENDING_DESC }, 'Latest Updates')} className="w-full text-left p-3 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors font-semibold">Latest Updates</button></li>
                  <li><button onClick={() => handleLinkClick({ statuses: [MediaStatus.RELEASING], sort: MediaSort.POPULARITY_DESC }, 'Ongoing')} className="w-full text-left p-3 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors font-semibold">Ongoing</button></li>
                  <li><button onClick={() => handleLinkClick({ statuses: [MediaStatus.FINISHED], sort: MediaSort.START_DATE_DESC }, 'Recently Finished')} className="w-full text-left p-3 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors font-semibold">Recently Finished</button></li>
              </ul>
          </div>
          
          <div className="mt-2">
            <button onClick={() => setIsTypesOpen(prev => !prev)} className="w-full flex items-center justify-between p-3 rounded-lg text-left text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors">
              <span className="font-semibold">Types</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isTypesOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isTypesOpen && (
              <div className="mt-2 pl-4 max-h-60 overflow-y-auto animate-fade-in-fast pr-2">
                <ul className="space-y-2">
                  {typeItems.map(item => (
                    <li key={item.label}>
                      <button onClick={() => handleLinkClick(item.filters, item.title)} className="text-gray-400 hover:text-cyan-400 w-full text-left transition-colors">
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-2">
            <button onClick={() => setIsGenresOpen(prev => !prev)} className="w-full flex items-center justify-between p-3 rounded-lg text-left text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors">
              <span className="font-semibold">Genres</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isGenresOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isGenresOpen && (
              <div className="mt-2 pl-4 max-h-60 overflow-y-auto animate-fade-in-fast pr-2">
                <ul className="space-y-2">
                  {allGenres.map(genre => (
                    <li key={genre}>
                      <button onClick={() => handleLinkClick({ genres: [genre] }, `${genre} Anime`)} className="text-gray-400 hover:text-cyan-400 w-full text-left transition-colors">
                        {genre}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-800 rounded-full p-1 flex items-center text-sm font-bold">
              <button onClick={() => setTitleLanguage('english')} className={`px-4 py-1 rounded-full ${titleLanguage === 'english' ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>EN</button>
              <button onClick={() => setTitleLanguage('romaji')} className={`px-4 py-1 rounded-full ${titleLanguage === 'romaji' ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>JP</button>
            </div>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL || DEFAULT_AVATAR_URL} alt="User Avatar" className="w-10 h-10 rounded-full object-cover" />
              <div className="overflow-hidden">
                <p className="font-semibold text-white truncate">{user.displayName || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="ml-auto text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50" aria-label="Logout">
                <LogoutIcon />
              </button>
            </div>
          ) : (
            <button onClick={onLoginClick} className="w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-cyan-500/90 hover:bg-cyan-500 text-white font-bold transition-colors">
              <LoginIcon />
              <span>Login</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;