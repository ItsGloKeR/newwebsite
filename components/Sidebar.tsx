
import React from 'react';
import { GENRES } from '../constants';

interface SidebarProps {
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
  onHomeClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedGenres, onGenreToggle, onHomeClick }) => {
  return (
    <aside className="w-64 bg-gray-900 p-4 flex-shrink-0 hidden md:block">
      <h1 
        className="text-3xl font-black text-white cursor-pointer mb-8"
        onClick={onHomeClick}
      >
        <span className="text-cyan-400">Ani</span>Stream
      </h1>
      <h2 className="text-xl font-bold text-white mb-4">Genres</h2>
      <nav>
        <ul>
          {GENRES.map(genre => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <li key={genre} className="mb-2">
                <button
                  onClick={() => onGenreToggle(genre)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    isSelected
                      ? 'bg-cyan-500 text-white font-semibold'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
