import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Anime } from '../types';
import GenrePill from './GenrePill';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

interface AnimeTooltipProps {
    anime: Partial<Anime> & { anilistId: number; englishTitle: string; romajiTitle: string };
    rect: DOMRect;
    onWatchNow: (anime: Partial<Anime>) => void;
    onDetails: (anime: Partial<Anime>) => void;
    onClose: () => void;
    onMouseEnter: () => void;
    watchlist: number[];
    toggleWatchlist: (animeId: number) => void;
    showWatchButton: boolean;
}

const TOOLTIP_WIDTH = 300;
const TOOLTIP_MARGIN = 16;

const AnimeTooltip: React.FC<AnimeTooltipProps> = ({ anime, rect, onWatchNow, onDetails, onClose, onMouseEnter, watchlist, toggleWatchlist, showWatchButton }) => {
    const { titleLanguage } = useTitleLanguage();
    const [style, setStyle] = useState({});
    const [isVisible, setIsVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
    const isInList = watchlist.includes(anime.anilistId);

    const description = useMemo(() => {
        if (!anime.description) return null;
        return anime.description.length > 150 
            ? `${anime.description.substring(0, 150)}...` 
            : anime.description;
    }, [anime.description]);

    const episodeText = useMemo(() => {
        if (anime.status === 'RELEASING' && anime.totalEpisodes) return `${anime.episodes || '?'}/${anime.totalEpisodes} Eps`;
        if (anime.episodes) return `${anime.episodes} Eps`;
        if (anime.totalEpisodes) return `${anime.totalEpisodes} Eps`;
        return null;
    }, [anime.episodes, anime.totalEpisodes, anime.status]);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (rect && tooltipRef.current) {
            const tooltipHeight = tooltipRef.current.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let top = rect.top;
            let left: number | null = null;
            let transformOrigin = '';

            if (rect.right + TOOLTIP_WIDTH + TOOLTIP_MARGIN < viewportWidth) {
                left = rect.right + TOOLTIP_MARGIN;
                transformOrigin = 'left center';
            } else if (rect.left - TOOLTIP_WIDTH - TOOLTIP_MARGIN > 0) {
                left = rect.left - TOOLTIP_WIDTH - TOOLTIP_MARGIN;
                transformOrigin = 'right center';
            } else {
                left = rect.right + TOOLTIP_MARGIN;
                transformOrigin = 'left center';
            }

            if (top + tooltipHeight > viewportHeight - TOOLTIP_MARGIN) {
                top = viewportHeight - tooltipHeight - TOOLTIP_MARGIN;
            }
            if (top < TOOLTIP_MARGIN) {
                top = TOOLTIP_MARGIN;
            }

            setStyle({ 
                top: `${top}px`, 
                left: left !== null ? `${left}px` : 'auto',
                transformOrigin,
            });
        }
    }, [rect]);
    
    const handleToggleWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleWatchlist(anime.anilistId);
    };

    return (
        <div
            ref={tooltipRef}
            style={style}
            className={`fixed z-50 w-[300px] bg-gray-900/80 backdrop-blur-lg rounded-lg shadow-2xl p-4 text-white transition-all duration-200 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            onMouseLeave={onClose}
            onMouseEnter={onMouseEnter}
        >
            <h3 className="text-lg font-bold truncate mb-2">{title}</h3>
            
            <div className="flex items-center gap-3 text-sm text-gray-300 mb-3 flex-wrap">
                {anime.rating > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-yellow-400">
                        <StarIcon className="w-4 h-4" />
                        {anime.rating / 10}
                    </span>
                )}
                {episodeText && <span className="font-semibold">{episodeText}</span>}
                {anime.format && <span className="font-semibold">{anime.format}</span>}
                 {anime.year > 0 && <span className="font-semibold">{anime.year}</span>}
            </div>

            {anime.genres && anime.genres.length > 0 && (
                <div className="mb-3">
                    <GenrePill genre={anime.genres[0]} />
                </div>
            )}
            
            {description && <p className="text-sm text-gray-400 leading-relaxed line-clamp-4 mb-4">{description}</p>}
            
            <div className="flex items-center gap-2 mt-4">
                {showWatchButton && (
                    <button
                        onClick={() => onWatchNow(anime)}
                        className="flex-grow bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        Watch
                    </button>
                )}
                <button
                    onClick={() => onDetails(anime)}
                    className="flex-grow bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    Details
                </button>
                 <button 
                    onClick={handleToggleWatchlist} 
                    className={`flex-shrink-0 p-2 rounded-md transition-colors ${isInList ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                    aria-label={isInList ? 'In your list' : 'Add to your list'}
                >
                    {isInList ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AnimeTooltip;