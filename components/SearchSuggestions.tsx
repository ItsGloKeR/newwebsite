import React from 'react';
import { SearchSuggestion } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onSuggestionClick: (anime: { anilistId: number }) => void;
  isLoading: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ suggestions, onSuggestionClick, isLoading }) => {
  let content;
  if (isLoading) {
    content = (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  } else if (suggestions.length > 0) {
    content = (
      <ul>
        {suggestions.map(anime => (
          <li
            key={anime.anilistId}
            onMouseDown={() => onSuggestionClick({ anilistId: anime.anilistId })} // Use onMouseDown to fire before input's onBlur
            className="flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <img 
              src={anime.coverImage} 
              alt={anime.title} 
              className="w-10 h-14 object-cover rounded-md mr-4 flex-shrink-0" 
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
            <div className="overflow-hidden">
              <p className="text-white font-semibold truncate">{anime.title}</p>
              <p className="text-gray-400 text-sm">{anime.year}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  } else {
    content = (
      <p className="text-gray-400 text-center p-4">No results found.</p>
    );
  }

  return (
    <div className="absolute top-full mt-2 w-full bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50 animate-fade-in-fast">
      {content}
    </div>
  );
};

export default SearchSuggestions;
