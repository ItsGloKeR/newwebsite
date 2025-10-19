import React from 'react';
import { SearchSuggestion } from '../types';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';

interface SearchSuggestionsProps {
  suggestions?: SearchSuggestion[];
  history?: string[];
  isLoading?: boolean;
  onSuggestionClick?: (anime: { anilistId: number }) => void;
  onHistoryClick?: (term: string) => void;
  onRemoveHistoryItem?: (term: string) => void;
  onClearHistory?: () => void;
  onViewAllClick?: () => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ 
  suggestions, 
  history,
  isLoading, 
  onSuggestionClick,
  onHistoryClick,
  onRemoveHistoryItem,
  onClearHistory,
  onViewAllClick 
}) => {
  const { titleLanguage } = useTitleLanguage();

  const renderHistory = () => (
    <>
      <div className="flex justify-between items-center px-3 pt-3 pb-2">
        <h3 className="text-sm font-bold text-gray-400">Recent Searches</h3>
        {onClearHistory && (
          <button onClick={onClearHistory} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
            Clear
          </button>
        )}
      </div>
      <ul>
        {history?.map(term => (
          <li
            key={term}
            onMouseDown={() => onHistoryClick?.(term)}
            className="flex items-center justify-between p-3 hover:bg-gray-700 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-4 overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white font-semibold truncate">{term}</p>
            </div>
            {onRemoveHistoryItem && (
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemoveHistoryItem(term);
                    }} 
                    className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Remove ${term} from history`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );

  const renderSuggestions = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cyan-400"></div>
        </div>
      );
    } 
    
    if (suggestions && suggestions.length > 0) {
      return (
        <>
          <ul>
            {suggestions.map(anime => {
              const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
              return (
                <li
                  key={anime.anilistId}
                  onMouseDown={() => onSuggestionClick?.({ anilistId: anime.anilistId })}
                  className="flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <img 
                    src={anime.coverImage} 
                    alt={title} 
                    className="w-10 h-14 object-cover rounded-md mr-4 flex-shrink-0" 
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
                  />
                  <div className="overflow-hidden">
                    <p className="text-white font-semibold truncate flex items-center gap-2">
                      {title}
                      {anime.isAdult && <span className="flex-shrink-0 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">18+</span>}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {anime.year} {anime.episodes ? `· ${anime.episodes} Episodes` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
          {onViewAllClick && (
            <div className="border-t border-gray-700 p-2">
              <button
                  onMouseDown={onViewAllClick}
                  className="w-full text-center text-cyan-400 font-semibold hover:bg-gray-700 rounded-md p-2 transition-colors"
              >
                  View All Results
              </button>
            </div>
          )}
        </>
      );
    }
    
    return (
      <p className="text-gray-400 text-center p-4">No results found.</p>
    );
  };

  return (
    <div className="absolute top-full mt-2 w-full bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50 animate-fade-in-fast">
      {history ? renderHistory() : renderSuggestions()}
    </div>
  );
};

export default SearchSuggestions;
