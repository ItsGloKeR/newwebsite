import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Anime, StreamSource, StreamLanguage, RelatedAnime, RecommendedAnime, ZenshinMapping, HiAnimeInfo, MediaStatus, MediaSort } from '../types';
import { useAdmin } from '../contexts/AdminContext';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { getZenshinMappings, getHiAnimeInfo, getFillerEpisodes } from '../services/anilistService';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';
import { useTooltip } from '../contexts/TooltipContext';
import { progressTracker } from '../utils/progressTracking';
import Logo from './Logo';
import CustomVideoPlayer from './CustomVideoPlayer';
import EngagingLoader from './EngagingLoader';
import VerticalAnimeList from './VerticalAnimeList';
import FirebaseComments from './FirebaseComments';

declare global {
  interface Window {
    theAnimeCommunityConfig: any;
    theAnimeCommunity?: {
      reload: () => void;
    };
  }
}

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
};

// Player control icons
const PrevIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const NextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const FullscreenOverlayEnterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8V3h5m13 5V3h-5M8 21H3v-5m13 5h5v-5" /></svg>;
const FullscreenOverlayExitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3H3v5m5 13v-5H3m13 5h5v-5m-5-13v5h5" /></svg>;
const FullscreenBarEnterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8V3h5m13 5V3h-5M8 21H3v-5m13 5h5v-5" /></svg>;
const FullscreenBarExitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3H3v5m5 13v-5H3m13 5h5v-5m-5-13v5h5" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;
const ReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ListIconSvg = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const PrevIconButton = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const NextIconButton = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
const LatestIconButton = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M15 5H5a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1zm-1 8H6V7h8v6z" /><path d="M18 7h-1V6a1 1 0 00-1-1H4a1 1 0 000 2h1v8H4a1 1 0 000 2h11a1 1 0 001-1v-1h1a1 1 0 000-2z" /></svg>;

const RadarPulse: React.FC<{ onClick: (e: React.MouseEvent<SVGSVGElement>) => void }> = ({ onClick }) => (
  <div
    className="absolute bottom-[calc(0.5rem-0.5cm)] left-[calc(0.5rem+1cm)] w-16 h-16 text-white drop-shadow-lg animate-fade-in z-30"
    aria-label="Unmute player"
    role="button"
  >
    <svg onClick={onClick} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-auto cursor-pointer">
        <style>{`
            .radar-circle-pulse {
                transform-origin: center;
                animation: radar-pulse 2.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
            }
            .radar-circle-pulse-2 { animation-delay: 0.8s; }
            @keyframes radar-pulse {
                0% { transform: scale(0.3); opacity: 0; }
                50% { opacity: 0.7; }
                100% { transform: scale(1); opacity: 0; }
            }
        `}</style>
        <circle cx="50" cy="50" r="8" fill="currentColor" />
        <circle className="radar-circle-pulse" cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" />
        <circle className="radar-circle-pulse radar-circle-pulse-2" cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" />
    </svg>
  </div>
);

const SourceIndicator: React.FC<{ status: number | 'loading' | 'timeout' | undefined }> = ({ status }) => {
    if (status === 'loading') {
        return <div className="absolute top-1.5 right-1.5 h-3 w-3 animate-spin rounded-full border-2 border-b-cyan-400 border-gray-600"></div>;
    }
    
    let colorClass: string;
    let title: string;

    if (status === 'timeout') {
        colorClass = 'border-t-red-500';
        title = 'Source failed to load or timed out';
    } else if (typeof status === 'number') {
        if (status < 4000) {
            colorClass = 'border-t-green-500';
            title = `Fast response (~${Math.round(status/1000)}s)`;
        } else if (status < 10000) {
            colorClass = 'border-t-yellow-500';
            title = `Average response (~${Math.round(status/1000)}s)`;
        } else {
            colorClass = 'border-t-orange-500';
            title = `Slow response (~${Math.round(status/1000)}s)`;
        }
    } else {
        return null;
    }

    return (
        <div 
            className={`absolute top-0 right-0 h-0 w-0 border-t-8 border-l-8 border-l-transparent ${colorClass}`}
            title={title}
        >
        </div>
    );
};


const mapDiscoverToAnime = (item: RelatedAnime | RecommendedAnime): Anime => ({
    anilistId: item.id,
    englishTitle: item.englishTitle,
    romajiTitle: item.romajiTitle,
    coverImage: item.coverImage,
    isAdult: item.isAdult,
    episodes: item.episodes,
    totalEpisodes: item.episodes,
    format: item.format,
    year: item.year,
    malId: undefined,
    description: '',
    coverImageColor: undefined,
    bannerImage: '',
    genres: [],
    duration: null,
    rating: 0,
    status: 'FINISHED',
    studios: [],
    staff: [],
    characters: [],
    relations: [],
    recommendations: [],
});

const smallIconProps = { className: "h-5 w-5 text-cyan-400" };
const RelatedIcon = <svg {...smallIconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const RecommendedIcon = <svg {...smallIconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008 18.5a4 4 0 002.844-1.252l.05-.025a2 2 0 001.106-1.79v-5.43c0-1.042-.79-1.92-1.833-2.167C9.332 7.98 8.667 7.98 8.167 8.167 7.124 8.413 6 9.29 6 10.333zM10 1.5a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-3 0v-6A1.5 1.5 0 0110 1.5zM14 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 0016 18.5a4 4 0 002.844-1.252l.05-.025a2 2 0 001.106-1.79v-5.43c0-1.042-.79-1.92-1.833-2.167-.5-.187-1.167-.187-1.667 0C14.79 8.413 14 9.29 14 10.333z" /></svg>;
const AiringIcon = <svg {...smallIconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.99 2.05c.53 0 1.04 .08 1.54 .23l-1.28 1.28A5.95 5.95 0 004.28 7.5l-1.28 1.28A7.94 7.94 0 019.99 2.05zM2.06 9.99a7.94 7.94 0 016.71-7.71l-1.28 1.28A5.95 5.95 0 003.5 12.5l-1.28 1.28A7.94 7.94 0 012.06 10zM10 4a6 6 0 100 12 6 6 0 000-12zM10 14a4 4 0 110-8 4 4 0 010 8z" /></svg>;

type PlayerStatus = 'loading' | 'loaded' | 'error' | 'idle';

const EpisodeSelector: React.FC<{
    episodeCount: number;
    currentEpisode: number;
    onEpisodeChange: (ep: number) => void;
    zenshinData: ZenshinMapping | null | undefined;
    fillerEpisodes: number[];
    animeStatus: string;
    animeTotalEpisodes: number | null;
}> = ({ episodeCount, currentEpisode, onEpisodeChange, zenshinData, fillerEpisodes, animeStatus, animeTotalEpisodes }) => {
    const [episodeView, setEpisodeView] = useState<'list' | 'grid'>('list');
    const [episodeSearch, setEpisodeSearch] = useState('');
    const [episodeSearchError, setEpisodeSearchError] = useState<string | null>(null);
    const [isRangeSelectorOpen, setIsRangeSelectorOpen] = useState(false);
    const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
    const rangeSelectorRef = useRef<HTMLDivElement>(null);
    const activeEpisodeListItemRef = useRef<HTMLLIElement>(null);
    const activeEpisodeButtonRef = useRef<HTMLButtonElement>(null);

    const episodeRanges = useMemo(() => {
        if (!episodeCount || episodeCount <= 100) return [];
        const ranges = [];
        for (let i = 0; i < episodeCount; i += 100) {
            ranges.push({ start: i + 1, end: Math.min(i + 100, episodeCount) });
        }
        return ranges;
    }, [episodeCount]);

    const episodes = useMemo(() => Array.from({ length: episodeCount }, (_, i) => i + 1), [episodeCount]);
    const filteredEpisodes = useMemo(() => selectedRange ? episodes.slice(selectedRange.start - 1, selectedRange.end) : episodes, [episodes, selectedRange]);

    useEffect(() => {
        if (episodeCount > 100) {
            setEpisodeView('grid');
        } else {
            setEpisodeView('list');
        }
    }, [episodeCount]);

    useEffect(() => {
        if (episodeRanges.length > 0) {
            const currentRange = episodeRanges.find(r => currentEpisode >= r.start && currentEpisode <= r.end);
            setSelectedRange(currentRange || episodeRanges[0]);
        } else {
            setSelectedRange(null);
        }
    }, [currentEpisode, episodeRanges]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (rangeSelectorRef.current && !rangeSelectorRef.current.contains(e.target as Node)) {
                setIsRangeSelectorOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (episodeView === 'list' && activeEpisodeListItemRef.current) {
                activeEpisodeListItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else if (episodeView === 'grid' && activeEpisodeButtonRef.current) {
                activeEpisodeButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [episodeView, currentEpisode, selectedRange]);
    
    const handleEpisodeSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const epNum = parseInt(episodeSearch, 10);
        if (isNaN(epNum) || epNum < 1) { setEpisodeSearchError("Invalid number."); return; }
        if (epNum > episodeCount) {
            if (animeStatus === 'RELEASING' && animeTotalEpisodes && epNum <= animeTotalEpisodes) {
                setEpisodeSearchError(`Not released yet.`);
            } else {
                setEpisodeSearchError(`Max ep: ${episodeCount}.`);
            }
            return;
        }
        onEpisodeChange(epNum);
        setEpisodeSearch('');
        setEpisodeSearchError(null);
    };

    return (
        <div className="bg-gray-900/80 p-4 rounded-lg shadow-lg flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    <span>Episodes</span>
                </h3>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-700/80 rounded-md border border-gray-600/50 h-8">
                        {episodeRanges.length > 0 && selectedRange ? (
                            <div className="relative border-r border-gray-600/50 h-full" ref={rangeSelectorRef}>
                                <button onClick={() => setIsRangeSelectorOpen(p => !p)} className="flex items-center justify-between gap-1.5 h-full text-gray-300 rounded-l-md px-3 text-xs font-semibold hover:bg-gray-600 transition-colors w-28">
                                    <span>{`${selectedRange.start}-${selectedRange.end}`}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                                {isRangeSelectorOpen && ( <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 animate-fade-in-fast"><ul>{episodeRanges.map((range, i) => <li key={i}><button onClick={() => { setSelectedRange(range); setIsRangeSelectorOpen(false); }} className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-sm ${range.start === selectedRange?.start ? 'text-cyan-400' : ''}`}>{`${range.start} - ${range.end}`}</button></li>)}</ul></div> )}
                            </div>
                        ) : null}
                        <form onSubmit={handleEpisodeSearch} className="relative h-full flex items-center">
                            <div className={`absolute inset-0 flex items-center justify-center gap-1.5 text-gray-400 pointer-events-none transition-opacity ${episodeSearch ? 'opacity-0' : 'opacity-100'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                <span className="text-xs">Find episode...</span>
                            </div>
                            <input
                                type="number"
                                value={episodeSearch}
                                onChange={e => { setEpisodeSearch(e.target.value); setEpisodeSearchError(null); }}
                                placeholder=""
                                className={`bg-transparent text-white h-full px-2 w-32 text-sm focus:outline-none text-center ${episodeRanges.length > 0 && selectedRange ? 'rounded-r-md' : 'rounded-md'}`}
                            />
                            {episodeSearchError && <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">{episodeSearchError}</p>}
                        </form>
                    </div>
                    <button onClick={() => setEpisodeView(p => p === 'list' ? 'grid' : 'list')} className="bg-gray-700/80 rounded-md text-gray-300 hover:bg-gray-600 transition-colors h-8 w-8 flex items-center justify-center" aria-label={episodeView === 'list' ? "Switch to grid view" : "Switch to list view"}>
                        {episodeView === 'list' ? <GridIcon /> : <ListIconSvg />}
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto -mr-2 pr-2 max-h-[580px]">
                {episodeView === 'list' ? (
                    <ul className="space-y-1">
                        {filteredEpisodes.map(ep => {
                            const zenshinEp = zenshinData?.episodes?.[ep];
                            const epTitle = zenshinEp?.title?.en || `Episode ${ep}`;
                            const isActive = ep === currentEpisode;
                            const isFillerFromZenshin = zenshinEp?.isFiller;
                            const isFillerFromApi = fillerEpisodes.includes(ep);
                            const isFiller = isFillerFromApi || isFillerFromZenshin;
                            return (
                                <li key={ep} ref={isActive ? activeEpisodeListItemRef : null}>
                                    <button
                                        onClick={() => onEpisodeChange(ep)}
                                        className={`w-full p-2.5 rounded-md transition-colors text-left flex items-center justify-between group relative ${
                                            isActive
                                                ? 'bg-cyan-500/20'
                                                : isFiller
                                                ? 'bg-amber-800/40 hover:bg-amber-700/50'
                                                : 'text-gray-300 hover:bg-gray-700/50'
                                        }`}
                                    >
                                        {isActive && <div className="absolute left-0 h-3/4 w-1 bg-blue-500 rounded-r-full"></div>}
                                        <div className="flex items-center gap-4">
                                            <span className={`font-semibold w-8 text-center ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>{ep}</span>
                                            <span className={`font-semibold truncate ${isActive ? 'text-cyan-300' : isFiller ? 'text-amber-200' : 'text-white'}`}>{epTitle}</span>
                                        </div>
                                        {isActive && (
                                            <span className="text-blue-400">
                                                <PlayIcon />
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {filteredEpisodes.map(ep => {
                            const zenshinEp = zenshinData?.episodes?.[ep];
                            const isFillerFromZenshin = zenshinEp?.isFiller;
                            const isFillerFromApi = fillerEpisodes.includes(ep);
                            const isFiller = isFillerFromApi || isFillerFromZenshin;
                            const isActive = ep === currentEpisode;
                            return (
                            <button
                                key={ep}
                                ref={isActive ? activeEpisodeButtonRef : null}
                                onClick={() => onEpisodeChange(ep)}
                                className={`py-2 px-1 flex items-center justify-center font-bold rounded transition-colors text-xs ${
                                    isActive 
                                    ? 'bg-cyan-500 text-white' 
                                    : isFiller
                                    ? 'bg-amber-800/40 text-amber-200 hover:bg-amber-700/50'
                                    : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {ep}
                            </button>
                        )})}
                    </div>
                )}
            </div>
        </div>
    );
};


const AnimePlayer: React.FC<{
  anime: Anime;
  currentEpisode: number;
  currentSource: StreamSource;
  currentLanguage: StreamLanguage;
  onEpisodeChange: (episode: number) => void;
  onSourceChange: (source: StreamSource) => void;
  onLanguageChange: (language: StreamLanguage) => void;
  onBack: () => void;
  onSelectRelated: (anime: { anilistId: number }) => void;
  onSelectRecommended: (anime: { anilistId: number }) => void;
  onViewMore: (filters: Partial<{ animeList: (RelatedAnime | RecommendedAnime)[]; statuses: MediaStatus[]; sort: MediaSort; }>, title: string) => void;
  onReportIssue: () => void;
  topAiring: Anime[];
}> = ({
  anime,
  currentEpisode,
  currentSource,
  currentLanguage,
  onEpisodeChange,
  onSourceChange,
  onLanguageChange,
  onBack,
  onSelectRelated,
  onSelectRecommended,
  onViewMore,
  onReportIssue,
  topAiring,
}) => {
  const { getStreamUrl } = useAdmin();
  const { titleLanguage } = useTitleLanguage();
  const [zenshinData, setZenshinData] = useState<ZenshinMapping | null | undefined>();
  const [hiAnimeInfo, setHiAnimeInfo] = useState<HiAnimeInfo | null | undefined>();
  const [isAiringNotificationVisible, setIsAiringNotificationVisible] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<{ src: string; label: string; srclang: string; default?: boolean; kind?: string }[]>([]);
  const [resumeNotification, setResumeNotification] = useState<string | null>(null);
  const lastWatchedEp = useMemo(() => progressTracker.getMediaData(anime.anilistId)?.last_episode_watched, [anime.anilistId]);
  const [fillerEpisodes, setFillerEpisodes] = useState<number[]>([]);
  
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [showUnmuteOverlay, setShowUnmuteOverlay] = useState(false);
  const unmuteTimersRef = useRef<{ show: number | null; hide: number | null }>({ show: null, hide: null });

  const [sourceLoadTimes, setSourceLoadTimes] = useState<Partial<Record<StreamSource, number | 'loading' | 'timeout'>>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const testRunRef = useRef<string | null>(null);
  const episodeSourceTestRunRef = useRef<number>(0);

  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [loadingMessage, setLoadingMessage] = useState('');
  const loadTimeoutRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  const sources = [ { id: StreamSource.Vidsrc, label: 'Src 1' }, { id: StreamSource.HiAnime, label: 'Src 2' }, { id: StreamSource.Vidnest, label: 'Src 3' }, { id: StreamSource.HiAnimeV2, label: 'Src 4' }, { id: StreamSource.AnimePahe, label: 'Src 5' }, { id: StreamSource.VidsrcIcu, label: 'Src 6' }, { id: StreamSource.SlayKnight, label: 'Src 7' } ];
  
  const handleLoadSuccess = useCallback(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    
    const sourcesWithDelay: StreamSource[] = [StreamSource.Vidnest, StreamSource.AnimePahe, StreamSource.VidsrcIcu];

    if (sourcesWithDelay.includes(currentSource)) {
        setTimeout(() => {
            setPlayerStatus('loaded');
        }, 4000);
    } else {
        setPlayerStatus('loaded');
    }
  }, [currentSource]);

  const handleLoadError = useCallback(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setPlayerStatus('error');
    console.error("Player failed to load stream.");
  }, []);

  const handleCancelLoad = useCallback(() => {
    setPlayerStatus('loaded'); // Force the player to be shown
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
  }, []);

  const handleRetrySource = useCallback(() => {
    const currentIndex = sources.findIndex(s => s.id === currentSource);
    const nextIndex = (currentIndex + 1) % sources.length;
    const nextSource = sources[nextIndex].id;
    onSourceChange(nextSource);
  }, [currentSource, onSourceChange, sources]);

  const episodeCount = useMemo(() => {
    if (anime.status === 'RELEASING') {
        return anime.episodes || 1;
    }
    return anime.totalEpisodes || anime.episodes || 1;
  }, [anime]);

  const hasRelations = anime.relations && anime.relations.length > 0;
  const hasRecommendations = anime.recommendations && anime.recommendations.length > 0;
  const hasTopAiring = topAiring && topAiring.length > 0;

  useEffect(() => {
    // Clear any existing timers when source/episode changes
    if (unmuteTimersRef.current.show) clearTimeout(unmuteTimersRef.current.show);
    if (unmuteTimersRef.current.hide) clearTimeout(unmuteTimersRef.current.hide);
    setShowUnmuteOverlay(false);

    // Apply only to source 1 (Vidsrc), which is often muted by browsers by default
    if (currentSource === StreamSource.Vidsrc) {
      unmuteTimersRef.current.show = window.setTimeout(() => {
        setShowUnmuteOverlay(true);
      }, 3000); // Show after 3 seconds

      unmuteTimersRef.current.hide = window.setTimeout(() => {
        setShowUnmuteOverlay(false);
      }, 6000); // Hide after 3 more seconds (6s total)
    }

    return () => {
      if (unmuteTimersRef.current.show) clearTimeout(unmuteTimersRef.current.show);
      if (unmuteTimersRef.current.hide) clearTimeout(unmuteTimersRef.current.hide);
    };
  }, [currentSource, currentEpisode]);

  const handleUnmuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unmuteTimersRef.current.hide) clearTimeout(unmuteTimersRef.current.hide);
    setShowUnmuteOverlay(false);
    // Programmatically unmuting iframe content is not possible due to browser security policies.
    // This overlay acts as a prompt for the user to interact with the player.
  };

  useEffect(() => {
    const currentTestRun = episodeSourceTestRunRef.current;
    const runKey = `${anime.anilistId}-${currentEpisode}-${currentLanguage}`;

    if (zenshinData === undefined || hiAnimeInfo === undefined || testRunRef.current === runKey) {
        return;
    }
    
    testRunRef.current = runKey;
    episodeSourceTestRunRef.current += 1; // Invalidate previous runs

    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);
    
    const sourcesToTest: StreamSource[] = [
        StreamSource.HiAnime,
        StreamSource.Vidsrc,
        StreamSource.Vidnest,
        StreamSource.HiAnimeV2,
        StreamSource.AnimePahe,
        StreamSource.VidsrcIcu,
        StreamSource.SlayKnight,
    ];

    setSourceLoadTimes({});

    const timers = sourcesToTest.map((source, index) => {
        return setTimeout(async () => {
            if (currentTestRun !== episodeSourceTestRunRef.current -1 || !testContainer.isConnected) {
                return;
            }
            
            setSourceLoadTimes(prev => ({ ...prev, [source]: 'loading' }));
            const startTime = performance.now();

            // Special handling for HiAnimeV2
            if (source === StreamSource.HiAnimeV2) {
                if (!hiAnimeInfo || !hiAnimeInfo.episodesList) {
                    setSourceLoadTimes(prev => ({ ...prev, [source]: undefined }));
                    return;
                }
                const hianimeEpisode = hiAnimeInfo.episodesList.find(ep => ep.number === currentEpisode);
                if (!hianimeEpisode) {
                    setSourceLoadTimes(prev => ({ ...prev, [source]: undefined }));
                    return;
                }

                const hianimeId = hiAnimeInfo.id;
                const hianimeEpId = hianimeEpisode.episodeId;
                const streamType = currentLanguage === StreamLanguage.Dub ? 'dub' : 'sub';
                
                const compositeId = `${hianimeId}?ep=${hianimeEpId}`;
                const apiUrl = `https://cors-anywhere-6mov.onrender.com/https://hianime-api-n.onrender.com/api/stream?id=${encodeURIComponent(compositeId)}&server=hd-2&type=${streamType}`;

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
                    
                    const response = await fetch(apiUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.results?.streamingLink?.link?.file) {
                            const endTime = performance.now();
                            if (currentTestRun === episodeSourceTestRunRef.current - 1) {
                                setSourceLoadTimes(prev => ({ ...prev, [source]: Math.round(endTime - startTime) }));
                            }
                        } else {
                            throw new Error('No stream link found');
                        }
                    } else {
                        throw new Error(`API status ${response.status}`);
                    }
                } catch (error) {
                     if (currentTestRun === episodeSourceTestRunRef.current - 1) {
                        setSourceLoadTimes(prev => ({ ...prev, [source]: 'timeout' }));
                    }
                }
                return; // End special handling for HiAnimeV2
            }

            const url = getStreamUrl({
                animeId: anime.anilistId,
                malId: anime.malId,
                episode: currentEpisode,
                source: source,
                language: currentLanguage,
                zenshinData,
                hiAnimeInfo,
                animeFormat: anime.format
            });

            if (url.includes('about:blank')) {
                setSourceLoadTimes(prev => ({ ...prev, [source]: undefined }));
                return;
            }

            const iframe = document.createElement('iframe');
            iframe.setAttribute('sandbox', 'allow-scripts');
            
            const timeoutId = setTimeout(() => {
                iframe.src = 'about:blank';
                if (testContainer.contains(iframe)) testContainer.removeChild(iframe);
                if (currentTestRun === episodeSourceTestRunRef.current -1) {
                    setSourceLoadTimes(prev => ({ ...prev, [source]: 'timeout' }));
                }
            }, 20000);

            iframe.onload = () => {
                clearTimeout(timeoutId);
                const endTime = performance.now();
                if (currentTestRun === episodeSourceTestRunRef.current -1) {
                    setSourceLoadTimes(prev => ({ ...prev, [source]: Math.round(endTime - startTime) }));
                }
                if (testContainer.contains(iframe)) testContainer.removeChild(iframe);
            };

            iframe.onerror = () => {
                clearTimeout(timeoutId);
                if (currentTestRun === episodeSourceTestRunRef.current -1) {
                    setSourceLoadTimes(prev => ({ ...prev, [source]: 'timeout' }));
                }
                if (testContainer.contains(iframe)) testContainer.removeChild(iframe);
            };
            
            iframe.src = url;
            testContainer.appendChild(iframe);
        }, index * 300);
    });

    return () => {
        timers.forEach(clearTimeout);
        if (document.body.contains(testContainer)) {
            document.body.removeChild(testContainer);
        }
    };
  }, [anime.anilistId, currentEpisode, currentLanguage, getStreamUrl, zenshinData, hiAnimeInfo, anime.malId, anime.format]);

  // --- Overlay and Fullscreen Logic ---
  
  const hideOverlay = useCallback(() => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    setIsOverlayVisible(false);
  }, []);

  const showOverlay = useCallback(() => {
    setIsOverlayVisible(true);
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = window.setTimeout(() => setIsOverlayVisible(false), 3500);
  }, []);
  
  useEffect(() => {
    const handlePlayerEvent = (data: any) => {
        const eventName = data.name || data.event;
        if ((eventName === 'timeupdate' || eventName === 'time') && data.currentTime && data.duration) {
            const timeLeft = data.duration - data.currentTime;
            if (timeLeft < 30 && timeLeft > 3) showOverlay(false);
        }
    };
    progressTracker.addEventListener(handlePlayerEvent);
    return () => progressTracker.removeEventListener(handlePlayerEvent);
  }, [showOverlay]);
  
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMouseMove = () => showOverlay();
    if (isFullscreen) document.addEventListener('mousemove', handleMouseMove);
    else document.removeEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isFullscreen, showOverlay]);

  const handleFullscreen = () => {
    if (playerWrapperRef.current) {
        if (!document.fullscreenElement) playerWrapperRef.current.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
        else document.exitFullscreen();
    }
  };

  const handlePrevEpisode = () => { if (currentEpisode > 1) onEpisodeChange(currentEpisode - 1); };
  const handleNextEpisode = () => { if (currentEpisode < episodeCount) onEpisodeChange(currentEpisode + 1); };

  // --- End Overlay Logic ---

  useEffect(() => {
    if (lastWatchedEp && currentEpisode === lastWatchedEp && lastWatchedEp > 1) {
        setResumeNotification(`Resuming from Episode ${currentEpisode}`);
        const timer = setTimeout(() => setResumeNotification(null), 4000);
        return () => clearTimeout(timer);
    }
  }, [anime.anilistId, currentEpisode, lastWatchedEp]);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const [zenshin, hianime] = await Promise.all([getZenshinMappings(anime.anilistId), getHiAnimeInfo(anime.anilistId)]);
        setZenshinData(zenshin);
        setHiAnimeInfo(hianime);
      } catch (error) {
        console.error("Failed to fetch mappings:", error);
        setZenshinData(null);
        setHiAnimeInfo(null);
      }
    };
    const fetchFillerData = async () => {
      if (anime?.romajiTitle) {
        try {
          setFillerEpisodes([]); // Reset for new anime
          const fillers = await getFillerEpisodes(anime.romajiTitle);
          setFillerEpisodes(fillers);
        } catch (error) {
          console.error("Failed to fetch filler data:", error);
        }
      }
    };
    fetchMappings();
    fetchFillerData();
  }, [anime.anilistId, anime.romajiTitle]);
  
  useEffect(() => {
    setPlayerStatus('loading');
    setLoadingMessage(`Loading Episode ${currentEpisode}...`);
    setSubtitles([]);

    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    loadTimeoutRef.current = window.setTimeout(() => {
        setPlayerStatus('error');
    }, 20000); // 20-second timeout

    const handleStreamUrl = async () => {
        if (currentSource === StreamSource.HiAnimeV2) {
            try {
                if (!hiAnimeInfo || !hiAnimeInfo.episodesList) {
                    setStreamUrl('about:blank#hianime-info-loading');
                    return;
                }

                const hianimeEpisode = hiAnimeInfo.episodesList.find(ep => ep.number === currentEpisode);
                if (!hianimeEpisode) {
                    setStreamUrl('about:blank#hianime-episode-not-found');
                    return;
                }

                const hianimeId = hiAnimeInfo.id;
                const hianimeEpId = hianimeEpisode.episodeId;
                const streamType = currentLanguage === StreamLanguage.Dub ? 'dub' : 'sub';
                
                const compositeId = `${hianimeId}?ep=${hianimeEpId}`;
                const apiUrl = `https://cors-anywhere-6mov.onrender.com/https://hianime-api-n.onrender.com/api/stream?id=${encodeURIComponent(compositeId)}&server=hd-2&type=${streamType}`;

                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`API returned status ${response.status}`);
                
                const data = await response.json();

                if (data.success && data.results?.streamingLink?.link?.file) {
                    const finalUrl = `https://deno-m3u8-proxy-1.onrender.com/m3u8-proxy?url=${data.results.streamingLink.link.file}`;
                    setStreamUrl(finalUrl);

                    const subs = data.results?.streamingLink?.tracks || [];
                    const englishSubs = subs.find((s: any) => s.label === 'English' && s.kind === 'captions');

                    setSubtitles(subs
                        .filter((sub: any) => sub.kind === 'captions')
                        .map((sub: any) => ({
                            src: `https://cors-anywhere-6mov.onrender.com/${sub.file}`,
                            label: sub.label || 'Subtitle',
                            srclang: sub.label ? sub.label.substring(0, 2).toLowerCase() : 'en',
                            default: !!englishSubs && sub.file === englishSubs.file,
                            kind: 'subtitles',
                    })));
                } else {
                    throw new Error('Streaming link not found in API response');
                }
            } catch (error) {
                console.error("Error fetching HiAnimeV2 stream:", error);
                setStreamUrl('about:blank#stream-fetch-error');
                handleLoadError();
            }

        } else {
            // Existing logic for other sources
            const url = getStreamUrl({ animeId: anime.anilistId, malId: anime.malId, episode: currentEpisode, source: currentSource, language: currentLanguage, zenshinData, hiAnimeInfo, animeFormat: anime.format });
            setStreamUrl(url);
        }
    };
    
    // This setTimeout provides a small delay to allow state to settle before fetching.
    const timer = setTimeout(handleStreamUrl, 50);
    
    return () => {
      clearTimeout(timer)
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
}, [anime.anilistId, anime.malId, anime.format, currentEpisode, currentSource, currentLanguage, getStreamUrl, zenshinData, hiAnimeInfo, refreshKey, handleLoadError]);

  useEffect(() => {
    if (anime && currentEpisode > 0) progressTracker.setLastWatchedEpisode(anime, currentEpisode);
    hideOverlay();
  }, [anime, currentEpisode, hideOverlay]);

  const nextAiringDate = useMemo(() => {
    if (!anime.nextAiringEpisode) return null;
    const date = new Date(anime.nextAiringEpisode.airingAt * 1000);
    const { timeUntilAiring } = anime.nextAiringEpisode;
    const days = Math.floor(timeUntilAiring / 86400);
    const hours = Math.floor((timeUntilAiring % 86400) / 3600);
    const minutes = Math.floor((timeUntilAiring % 3600) / 60);
    return {
        formattedDate: date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        countdown: `(${days}d ${hours}h ${minutes}m)`
    };
  }, [anime.nextAiringEpisode]);

  const handleReportIssue = () => {
    onReportIssue();
  };
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const playerAllowString = useMemo(() => {
    const permissions = ['accelerometer', 'autoplay', 'clipboard-write', 'encrypted-media', 'gyroscope'];
    if (currentSource !== StreamSource.HiAnime && currentSource !== StreamSource.HiAnimeV2) permissions.push('picture-in-picture');
    return permissions.join('; ');
  }, [currentSource]);

  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
  const currentZenshinEpisode = zenshinData?.episodes?.[currentEpisode];
  const episodeTitle = currentZenshinEpisode?.title?.en || `Episode ${currentEpisode}`;
  
  const languages = [ { id: StreamLanguage.Sub, label: 'SUB' }, { id: StreamLanguage.Dub, label: 'DUB' }, { id: StreamLanguage.Hindi, label: 'HINDI' } ];
  const sourcesWithoutLanguageControl: StreamSource[] = [];
  const sourcesDisablingHindi: StreamSource[] = [StreamSource.Vidsrc, StreamSource.VidsrcIcu, StreamSource.HiAnime, StreamSource.HiAnimeV2];

  const DetailsComponent = () => (
    <div className="mt-8">
        <div className="bg-gray-900/80 p-4 rounded-lg shadow-lg flex flex-col md:flex-row gap-6">
            <img src={anime.coverImage} alt={title} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }} className="w-full md:w-48 h-auto object-cover rounded-lg aspect-[2/3] self-center" />
            <div className="flex-grow flex flex-col">
                <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg mb-1">{title}</h2>
                <p className="text-md text-cyan-400 font-semibold mb-3">{episodeTitle}</p>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">{currentZenshinEpisode?.overview || anime.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                <div><span className="font-bold text-gray-300">Type:</span> <span className="text-gray-400">{anime.format}</span></div>
                <div><span className="font-bold text-gray-300">Studios:</span> <span className="text-gray-400">{anime.studios.join(', ')}</span></div>
                <div><span className="font-bold text-gray-300">Aired:</span> <span className="text-gray-400">{anime.year}</span></div>
                <div><span className="font-bold text-gray-300">Status:</span> <span className="text-gray-400 capitalize">{anime.status.toLowerCase().replace(/_/g, ' ')}</span></div>
                <div><span className="font-bold text-gray-300">Duration:</span> <span className="text-gray-400">{anime.duration || 'N/A'} min</span></div>
                <div><span className="font-bold text-gray-300">Genres:</span> <span className="text-gray-400">{anime.genres.join(', ')}</span></div>
                </div>
                
                <button 
                onClick={onBack} 
                className="group mt-auto flex items-center justify-center gap-2 w-full sm:w-auto text-cyan-400 hover:text-cyan-300 font-semibold transition-colors bg-gray-800/50 hover:bg-gray-700/80 px-3 py-1.5 rounded-lg text-sm"
                aria-label="View full details"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <span>View Full Details</span>
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <main className="min-h-screen text-white animate-fade-in">
       <div className="container mx-auto max-w-screen-2xl px-4 pt-4 pb-2">
            <nav aria-label="Breadcrumb" className="text-sm text-gray-400">
                <ol className="list-none p-0 inline-flex items-center flex-wrap">
                    <li className="flex items-center">
                        <a href="/#/" className="hover:text-cyan-400 transition-colors">Home</a>
                         <svg className="h-1.5 w-1.5 mx-2 text-gray-500" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                    </li>
                    <li className="flex items-center">
                        <a href={`/#/anime/${anime.anilistId}`} className="hover:text-cyan-400 transition-colors truncate max-w-[200px] sm:max-w-xs md:max-w-md">{title}</a>
                         <svg className="h-1.5 w-1.5 mx-2 text-gray-500" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                    </li>
                    <li aria-current="page" className="flex items-center">
                        <span className="text-gray-500 truncate max-w-[200px] sm:max-w-none">{episodeTitle}</span>
                    </li>
                </ol>
            </nav>
        </div>
      <div className="container mx-auto max-w-screen-2xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div>
                    <div 
                        ref={playerWrapperRef}
                        className="aspect-video bg-black rounded-t-lg shadow-xl overflow-hidden relative"
                        onMouseMove={showOverlay}
                        onMouseLeave={hideOverlay}
                    >
                      <EngagingLoader status={playerStatus} message={loadingMessage} onRetry={handleRetrySource} onCancel={handleCancelLoad} />
                      
                      {currentSource === StreamSource.HiAnimeV2 && streamUrl && !streamUrl.includes('about:blank') ? (
                          <CustomVideoPlayer
                              src={streamUrl}
                              subtitles={subtitles}
                              onLoadedData={handleLoadSuccess}
                              onError={handleLoadError}
                          />
                      ) : (
                        <iframe
                          key={`${streamUrl}-${refreshKey}`}
                          src={streamUrl || 'about:blank'}
                          title={`${title} - Episode ${currentEpisode}`}
                          allow={playerAllowString}
                          sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-presentation"
                          allowFullScreen
                          className="w-full h-full border-0"
                          scrolling="no"
                          onLoad={handleLoadSuccess}
                          onError={handleLoadError}
                        ></iframe>
                      )}
                      
                      {showUnmuteOverlay && (
                        <>
                          <div
                            onClick={handleUnmuteClick}
                            className={`absolute -translate-x-1/2 z-30 cursor-pointer animate-fade-in ${currentSource === StreamSource.Vidsrc ? 'bottom-[calc(5.92rem+1.1cm)] left-[4.87rem]' : 'bottom-[5.92rem] left-[4.87rem]'}`}
                            style={currentSource === StreamSource.Vidsrc ? { pointerEvents: 'none' } : {}}
                            role="button"
                            aria-label="Unmute player"
                          >
                            <div className="bg-cyan-500/80 backdrop-blur-sm text-white font-bold py-2 px-4 rounded-lg text-base transform transition-transform hover:scale-105 shadow-lg flex items-center gap-2 animate-pulse">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              Unmute
                            </div>
                          </div>
                           <RadarPulse onClick={handleUnmuteClick} />
                        </>
                      )}

                       {resumeNotification && (
                        <div className="absolute top-4 right-4 z-30 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-fast pointer-events-none">
                            <p className="font-semibold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                {resumeNotification}
                            </p>
                        </div>
                      )}
                        <div className={`absolute top-4 ${currentSource === StreamSource.SlayKnight ? 'left-4' : 'right-4'} z-20 opacity-70 pointer-events-none`}>
                            <Logo />
                        </div>
                       
                        {/* The visible controls part of the overlay. It is on top of the click handler and has pointer-events-none so clicks fall through to the handler, except for the buttons. */}
                       <div 
                        className={`absolute inset-0 z-30 transition-opacity duration-300 pointer-events-none ${isOverlayVisible ? 'opacity-100' : 'opacity-0'}`}
                       >
                            <div className="absolute inset-0 flex items-center justify-between px-4">
                                <button
                                    onClick={handlePrevEpisode}
                                    disabled={currentEpisode <= 1}
                                    className="p-2 md:p-3 bg-black/50 rounded-full hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
                                    aria-label="Previous Episode"
                                ><PrevIcon /></button>
                                <button
                                    onClick={handleNextEpisode}
                                    disabled={currentEpisode >= episodeCount}
                                    className="p-2 md:p-3 bg-black/50 rounded-full hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
                                    aria-label="Next Episode"
                                ><NextIcon /></button>
                            </div>
                            {(currentSource !== StreamSource.Vidsrc && currentSource !== StreamSource.HiAnimeV2) && (
                            <button
                                onClick={handleFullscreen}
                                className="absolute bottom-1.5 right-1.5 p-2 md:p-3 bg-gray-900/50 backdrop-blur-sm rounded-full text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors pointer-events-auto"
                                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                            >
                                {isFullscreen ? <FullscreenOverlayExitIcon /> : <FullscreenOverlayEnterIcon />}
                            </button>
                            )}
                        </div>
                    </div>
                    <div className="bg-gray-900/80 p-2 rounded-b-lg flex items-center justify-between gap-x-1 sm:gap-x-1.5 gap-y-2 flex-wrap shadow-lg">
                        {/* Left Buttons */}
                        <div className="flex items-center gap-x-1 sm:gap-x-1.5">
                            <button onClick={handlePrevEpisode} title="Previous Episode" className="p-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentEpisode <= 1}>
                                <PrevIconButton />
                            </button>
                            <button onClick={() => onEpisodeChange(episodeCount)} title="Latest Episode" className="p-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentEpisode === episodeCount}>
                                <LatestIconButton />
                            </button>
                            <button onClick={handleNextEpisode} title="Next Episode" className="p-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentEpisode >= episodeCount}>
                                <NextIconButton />
                            </button>
                            <button onClick={handleRefresh} className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold px-2 py-1 rounded-md transition-colors">
                                <RefreshIcon /> <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                        
                        {/* Right Buttons */}
                        <div className="flex items-center gap-x-1 sm:gap-x-1.5">
                            <button onClick={handleReportIssue} className="flex-shrink-0 flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-900/50 hover:bg-yellow-800/50 font-semibold px-2 py-1 rounded-md transition-colors">
                                <ReportIcon /> <span className="hidden sm:inline">Report Issue</span>
                            </button>
                            <button
                                onClick={handleFullscreen}
                                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold px-2 py-1 rounded-md transition-colors"
                                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                            >
                                {isFullscreen ? <FullscreenBarExitIcon /> : <FullscreenBarEnterIcon />}
                                <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-gray-900/80 p-4 rounded-lg shadow-lg my-4">
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 mb-3">
                          <div className="flex items-center gap-2">
                              {sources.map(source => (
                                  <button
                                    key={source.id}
                                    onClick={() => onSourceChange(source.id)}
                                    className={`relative overflow-hidden px-4 py-1.5 text-sm font-bold rounded-md transition-colors flex items-center ${
                                        currentSource === source.id ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                  >
                                      {source.label}
                                      <SourceIndicator status={sourceLoadTimes[source.id]} />
                                  </button>
                              ))}
                          </div>
                          <div className="h-6 w-px bg-gray-700 hidden sm:block"></div>
                          <div className="flex items-center gap-2">
                              {sourcesWithoutLanguageControl.includes(currentSource) ? (
                                  <div className="px-4 py-1.5 text-sm text-gray-400"> No subtitle options for this source. </div>
                              ) : (
                                  languages.map(lang => {
                                      const isLangDisabled = (currentSource === StreamSource.AnimePahe && (lang.id === StreamLanguage.Dub || lang.id === StreamLanguage.Hindi)) || (sourcesDisablingHindi.includes(currentSource) && lang.id === StreamLanguage.Hindi) || (currentSource === StreamSource.VidsrcIcu && lang.id === StreamLanguage.Sub);
                                      return ( <button key={lang.id} onClick={() => !isLangDisabled && onLanguageChange(lang.id)} disabled={isLangDisabled} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${currentLanguage === lang.id ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-300'} ${isLangDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}>{lang.label}</button> )
                                  })
                              )}
                          </div>
                      </div>
                      
                      <div className="text-xs text-center bg-gray-800/70 p-2 rounded-md text-gray-400"> Video not playing? Try selecting a different source (e.g., Src 2) or language (SUB/DUB) above. </div>

                      {isAiringNotificationVisible && anime.status === 'RELEASING' && nextAiringDate && (
                        <div className="-mx-4 -mb-4 mt-4 px-4 pt-3 pb-3 bg-cyan-500/10 border-t border-cyan-500/20 rounded-b-lg animate-fade-in">
                            <div className="relative text-cyan-200 text-sm flex justify-center items-center gap-2">
                                <div className="flex items-center gap-2 text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                    <p className="font-semibold">Next episode ({anime.nextAiringEpisode?.episode}) airs around: {nextAiringDate.formattedDate} <span className="text-cyan-300/80">{nextAiringDate.countdown}</span></p>
                                </div>
                                <button 
                                    onClick={() => setIsAiringNotificationVisible(false)} 
                                    className="absolute top-1/2 -translate-y-1/2 right-0 text-cyan-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 flex-shrink-0"
                                    aria-label="Dismiss airing notification"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                      )}
                    </div>
                </div>
                <div className="lg:hidden mt-8">
                     <EpisodeSelector 
                        episodeCount={episodeCount}
                        currentEpisode={currentEpisode}
                        onEpisodeChange={onEpisodeChange}
                        zenshinData={zenshinData}
                        fillerEpisodes={fillerEpisodes}
                        animeStatus={anime.status}
                        animeTotalEpisodes={anime.totalEpisodes}
                    />
                </div>
                <DetailsComponent />
                 <div className="mt-8">
                    <FirebaseComments animeId={anime.anilistId} episodeNumber={currentEpisode} animeTitle={title} />
                </div>
            </div>

            <div className="lg:col-span-1">
                <div>
                    <div className="hidden lg:block">
                        <EpisodeSelector 
                            episodeCount={episodeCount}
                            currentEpisode={currentEpisode}
                            onEpisodeChange={onEpisodeChange}
                            zenshinData={zenshinData}
                            fillerEpisodes={fillerEpisodes}
                            animeStatus={anime.status}
                            animeTotalEpisodes={anime.totalEpisodes}
                        />
                    </div>
                     <div className="flex flex-col gap-8 mt-8">
                        {hasRelations && (
                            <VerticalAnimeList 
                                title="Related Anime"
                                animeList={anime.relations.map(mapDiscoverToAnime)}
                                onSelectAnime={(selectedAnime) => onSelectRelated({ anilistId: selectedAnime.anilistId })}
                                onViewMore={() => onViewMore({ animeList: anime.relations }, 'Related Anime')}
                                icon={RelatedIcon}
                                showRank={false}
                            />
                        )}
                        {hasRecommendations && (
                            <VerticalAnimeList 
                                title="You Might Also Like"
                                animeList={anime.recommendations.map(mapDiscoverToAnime)}
                                onSelectAnime={(selectedAnime) => onSelectRecommended({ anilistId: selectedAnime.anilistId })}
                                onViewMore={() => onViewMore({ animeList: anime.recommendations }, 'Recommended For You')}
                                icon={RecommendedIcon}
                                showRank={false}
                            />
                        )}
                        {!hasRelations && !hasRecommendations && hasTopAiring && (
                             <VerticalAnimeList 
                                title="Top Airing" 
                                animeList={topAiring} 
                                onSelectAnime={(selectedAnime) => onSelectRelated({ anilistId: selectedAnime.anilistId })}
                                onViewMore={() => onViewMore({ statuses: [MediaStatus.RELEASING], sort: MediaSort.POPULARITY_DESC }, "Top Airing Anime")}
                                icon={<AiringIcon />}
                                showRank={true}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
};

export default React.memo(AnimePlayer);