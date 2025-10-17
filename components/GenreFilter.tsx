
import React from 'react';
import { GENRES } from '../constants';

interface GenreFilterProps {
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
}

const GenreFilter: React.FC<GenreFilterProps> = ({ selectedGenres, onGenreToggle }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-4">Filter by Genre</h3>
      <div className="flex flex-wrap gap-2">
        {GENRES.map(genre => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <button
              key={genre}
              onClick={() => onGenreToggle(genre)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                isSelected
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreFilter;
