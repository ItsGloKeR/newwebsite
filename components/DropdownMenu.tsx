import React, { useState } from 'react';
import { MediaFormat, MediaSort, MediaStatus } from '../types';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterClick: () => void;
  onNavigate: (filters: any, title: string) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ isOpen, onClose, onFilterClick, onNavigate }) => {
  const [isTypesOpen, setIsTypesOpen] = useState(false);
  const [isGenresOpen, setIsGenresOpen] = useState(false);
  
  if (!isOpen) return null;

  const handleLinkClick = (filters: any, title: string) => {
    onNavigate(filters, title);
    onClose();
  };

  const typeItems = [
    { label: 'Movies', filters: { formats: [MediaFormat.MOVIE] }, title: 'Movies' },
    { label: 'TV Series', filters: { formats: [MediaFormat.TV, MediaFormat.TV_SHORT] }, title: 'TV Series' },
    { label: 'OVAs', filters: { formats: [MediaFormat.OVA] }, title: 'OVAs' },
    { label: 'ONAs', filters: { formats: [MediaFormat.ONA] }, title: 'ONAs' },
    { label: 'Specials', filters: { formats: [MediaFormat.SPECIAL] }, title: 'Specials' },
  ];
  
  const genreItems = [
    { label: 'Action', filters: { genres: ['Action'] }, title: 'Action Anime' },
    { label: 'Adventure', filters: { genres: ['Adventure'] }, title: 'Adventure Anime' },
    { label: 'Comedy', filters: { genres: ['Comedy'] }, title: 'Comedy Anime' },
    { label: 'Drama', filters: { genres: ['Drama'] }, title: 'Drama Anime' },
    { label: 'Ecchi', filters: { genres: ['Ecchi'] }, title: 'Ecchi Anime' },
    { label: 'Fantasy', filters: { genres: ['Fantasy'] }, title: 'Fantasy Anime' },
    { label: 'Horror', filters: { genres: ['Horror'] }, title: 'Horror Anime' },
    { label: 'Mahou Shoujo', filters: { genres: ['Mahou Shoujo'] }, title: 'Mahou Shoujo Anime' },
    { label: 'Mecha', filters: { genres: ['Mecha'] }, title: 'Mecha Anime' },
    { label: 'Music', filters: { genres: ['Music'] }, title: 'Music Anime' },
    { label: 'Mystery', filters: { genres: ['Mystery'] }, title: 'Mystery Anime' },
    { label: 'Psychological', filters: { genres: ['Psychological'] }, title: 'Psychological Anime' },
    { label: 'Romance', filters: { genres: ['Romance'] }, title: 'Romance Anime' },
    { label: 'Sci-Fi', filters: { genres: ['Sci-Fi'] }, title: 'Sci-Fi Anime' },
    { label: 'Slice of Life', filters: { genres: ['Slice of Life'] }, title: 'Slice of Life Anime' },
    { label: 'Sports', filters: { genres: ['Sports'] }, title: 'Sports Anime' },
    { label: 'Supernatural', filters: { genres: ['Supernatural'] }, title: 'Supernatural Anime' },
    { label: 'Thriller', filters: { genres: ['Thriller'] }, title: 'Thriller Anime' },
  ];

  const renderAccordionItem = (label: string, isOpen: boolean, onToggle: () => void, items: {label: string, filters: any, title: string}[]) => (
     <li>
        <button onClick={onToggle} className="text-white font-bold text-lg w-full text-left hover:text-cyan-400 transition-colors flex justify-between items-center">
            <span>{label}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
        {isOpen && (
            <ul className="mt-2 space-y-2 pl-4 animate-fade-in-fast">
            {items.map(item => (
                <li key={item.label}>
                <button onClick={() => handleLinkClick(item.filters, item.title)} className="text-gray-300 hover:text-cyan-400 transition-colors">
                    {item.label}
                </button>
                </li>
            ))}
            </ul>
        )}
    </li>
  );

  return (
    <div 
      className="absolute top-full left-4 mt-2 w-64 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 animate-fade-in-fast z-50"
    >
      <ul className="space-y-4">
        <li>
          <button onClick={() => handleLinkClick({ list: 'watchlist' }, 'My Watchlist')} className="text-white font-bold text-lg w-full text-left hover:text-cyan-400 transition-colors">
            MY LIST
          </button>
        </li>
        <li>
          <button onClick={() => handleLinkClick({ list: 'favorites' }, 'My Favorites')} className="text-white font-bold text-lg w-full text-left hover:text-cyan-400 transition-colors">
            FAVORITES
          </button>
        </li>
        <hr className="border-gray-700" />
        {renderAccordionItem('GENRES', isGenresOpen, () => setIsGenresOpen(!isGenresOpen), genreItems)}
        {renderAccordionItem('TYPES', isTypesOpen, () => setIsTypesOpen(!isTypesOpen), typeItems)}
         <li>
          <button onClick={() => handleLinkClick({ statuses: [MediaStatus.RELEASING], sort: MediaSort.START_DATE_DESC }, 'New Releases')} className="text-white font-bold text-lg w-full text-left hover:text-cyan-400 transition-colors">
            NEW RELEASES
          </button>
        </li>
        <li>
          <button onClick={() => handleLinkClick({ statuses: [MediaStatus.RELEASING], sort: MediaSort.TRENDING_DESC }, 'Latest Updates')} className="text-white font-bold text-lg w-full text-left hover:text-cyan-400 transition-colors">
            UPDATES
          </button>
        </li>
        <li>
          <button onClick={() => handleLinkClick({ statuses: [MediaStatus.RELEASING], sort: MediaSort.POPULARITY_DESC }, 'Ongoing Anime')} className="text-white font-bold text-lg w-full text-left hover:text-cyan-400 transition-colors">
            ONGOING
          </button>
        </li>
        <li>
          <button onClick={() => handleLinkClick({ statuses: [MediaStatus.FINISHED], sort: MediaSort.START_DATE_DESC }, 'Recently Finished')} className="text-white font-bold text-lg w-full text-left hover:text-cyan-400 transition-colors">
            RECENT
          </button>
        </li>
      </ul>
    </div>
  );
};

export default DropdownMenu;