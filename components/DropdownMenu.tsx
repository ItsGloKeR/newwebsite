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
  
  if (!isOpen) return null;

  const handleLinkClick = (filters: any, title: string) => {
    onNavigate(filters, title);
    onClose();
  };

  const handleGenreClick = () => {
    onFilterClick();
    onClose();
  };

  const typeItems = [
    { label: 'Movies', filters: { formats: [MediaFormat.MOVIE] }, title: 'Movies' },
    { label: 'TV Series', filters: { formats: [MediaFormat.TV, MediaFormat.TV_SHORT] }, title: 'TV Series' },
    { label: 'OVAs', filters: { formats: [MediaFormat.OVA] }, title: 'OVAs' },
    { label: 'ONAs', filters: { formats: [MediaFormat.ONA] }, title: 'ONAs' },
    { label: 'Specials', filters: { formats: [MediaFormat.SPECIAL] }, title: 'Specials' },
  ];

  return (
    <div 
      className="absolute top-full left-4 mt-2 w-64 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 animate-fade-in-fast z-50"
    >
      <ul className="space-y-4">
        <li>
          <button onClick={handleGenreClick} className="text-white font-bold text-lg w-full text-left hover:text-cyan-400 transition-colors">
            GENRES
          </button>
        </li>
        <li>
            <button onClick={() => setIsTypesOpen(!isTypesOpen)} className="text-white font-bold text-lg w-full text-left hover:text-cyan-400 transition-colors flex justify-between items-center">
                <span>TYPES</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isTypesOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isTypesOpen && (
                <ul className="mt-2 space-y-2 pl-4 animate-fade-in-fast">
                {typeItems.map(item => (
                    <li key={item.label}>
                    <button onClick={() => handleLinkClick(item.filters, item.title)} className="text-gray-300 hover:text-cyan-400 transition-colors">
                        {item.label}
                    </button>
                    </li>
                ))}
                </ul>
            )}
        </li>
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