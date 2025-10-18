
import React from 'react';

interface HeaderProps {
  onSearch: (term: string) => void;
  onHomeClick: () => void;
  onScheduleClick: () => void;
  searchTerm: string;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onHomeClick, onScheduleClick, searchTerm }) => {
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
          <nav className="hidden md:flex items-center gap-4">
            <button onClick={onHomeClick} className="text-gray-300 hover:text-white transition-colors font-semibold">Home</button>
            <button onClick={onScheduleClick} className="text-gray-300 hover:text-white transition-colors font-semibold">Schedule</button>
          </nav>
          <div className="relative">
            <input
              type="text"
              placeholder="Search anime..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="bg-gray-800 text-white rounded-full py-2 pl-10 pr-4 w-48 md:w-64 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;