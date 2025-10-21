import React, { useState } from 'react';
import { MediaSort, FilterState, MediaFormat, MediaStatus } from '../types';

// Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const TrendingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const ScheduleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LoginIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (filters: Partial<FilterState> & { list?: 'watchlist' | 'favorites' | 'continueWatching' }, title: string) => void;
  onHomeClick: () => void;
  onScheduleClick: () => void;
  onLoginClick: () => void;
  allGenres: string[];
  isHome: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, onHomeClick, onScheduleClick, onLoginClick, allGenres, isHome }) => {
  const [isGenresOpen, setIsGenresOpen] = useState(false);
  const [isTypesOpen, setIsTypesOpen] = useState(false);

  const handleLinkClick = (filters: Partial<FilterState> & { list?: 'watchlist' | 'favorites' | 'continueWatching' }, title: string) => {
    onNavigate(filters, title);
    onClose();
  };
  
  const handleHomeClick = () => {
    onHomeClick();
    onClose();
  };

  const NavItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, isActive?: boolean }> = ({ icon, label, onClick, isActive }) => (
    <li>
      <button onClick={onClick} className={`w-full flex items-center gap-4 p-3 rounded-lg text-left transition-colors ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}>
        {icon}
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
          </ul>
          
          <hr className="border-gray-800 my-4" />
          
          <ul className="space-y-2">
            <NavItem icon={<ListIcon />} label="My List" onClick={() => handleLinkClick({ list: 'watchlist' }, 'My Watchlist')} />
            <NavItem icon={<HeartIcon />} label="Favorites" onClick={() => handleLinkClick({ list: 'favorites' }, 'My Favorites')} />
            <NavItem icon={<HistoryIcon />} label="Continue Watching" onClick={() => handleLinkClick({ list: 'continueWatching' as any }, 'Continue Watching')} />
            <NavItem icon={<SettingsIcon />} label="Settings" onClick={() => {}} />
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
          <button onClick={onLoginClick} className="w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-cyan-500/90 hover:bg-cyan-500 text-white font-bold transition-colors">
            <LoginIcon />
            <span>Login</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;