import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Anime, StreamSource, StreamLanguage, RelatedAnime, RecommendedAnime, ZenshinMapping } from '../types';
import { useAdmin } from '../contexts/AdminContext';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { getZenshinMappings } from '../services/anilistService';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';
import VerticalAnimeList from './VerticalAnimeList';
import { useTooltip } from '../contexts/TooltipContext';
import { setLastWatchedEpisode } from '../services/userPreferenceService';
import LoadingSpinner from './LoadingSpinner';


const RecommendationCard: React.FC<{ anime: RecommendedAnime, onSelect: () => void }> = ({ anime, onSelect }) => {
    const { titleLanguage } = useTitleLanguage();
    const { showTooltip, hideTooltip } = useTooltip();
    const cardRef = useRef<HTMLDivElement>(null);
    const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
    const episodeText = anime.episodes ? `${anime.episodes} Eps` : null;

    const handleMouseEnter = () => {
        if (cardRef.current) {
            const partialAnime = {
                anilistId: anime.id,
                englishTitle: anime.englishTitle,
                romajiTitle: anime.romajiTitle,
                coverImage: anime.coverImage,
                episodes: anime.episodes,
                totalEpisodes: anime.episodes,
                format: anime.format,
                year: anime.year,
            };
            showTooltip(partialAnime, cardRef.current.getBoundingClientRect());
        }
    };

    return (
        <div 
            ref={cardRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={hideTooltip}
            className="flex-shrink-0 w-40 cursor-pointer group" 
            onClick={onSelect}
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-cyan-500/30">
                <img
                    src={anime.coverImage}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
                />
                 {anime.progress > 0 && anime.progress < 95 && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-500/50 z-20">
                        <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${anime.progress}%` }}
                        ></div>
                    </div>
                )}
            </div>
             <div className="pt-3">
                <h3 className="text-white text-sm font-bold truncate group-hover:text-cyan-400 transition-colors" title={title}>{title}</h3>
                <div className="flex items-center gap-3 text-gray-400 text-xs mt-1">
                    {anime.format && <span className="font-semibold">{anime.format.replace(/_/g, ' ')}</span>}
                    {anime.year > 0 && <span className="font-semibold">{anime.year}</span>}
                    {episodeText && <span className="font-semibold">{episodeText}</span>}
                </div>
            </div>
        </div>
    );
};

const RelatedAnimeCard: React.FC<{ anime: RelatedAnime, onSelect: () => void }> = ({ anime, onSelect }) => {
    const { titleLanguage } = useTitleLanguage();
    const { showTooltip, hideTooltip } = useTooltip();
    const cardRef = useRef<HTMLDivElement>(null);
    const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
    const episodeText = anime.episodes ? `${anime.episodes} Eps` : null;

     const handleMouseEnter = () => {
        if (cardRef.current) {
            const partialAnime = {
                anilistId: anime.id,
                englishTitle: anime.englishTitle,
                romajiTitle: anime.romajiTitle,
                coverImage: anime.coverImage,
                episodes: anime.episodes,
                totalEpisodes: anime.episodes,
                format: anime.format,
                year: anime.year,
            };
            showTooltip(partialAnime, cardRef.current.getBoundingClientRect());
        }
    };

    return (
    <div 
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hideTooltip}
        className="w-full cursor-pointer group" 
        onClick={onSelect}
    >
        <div className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-800/60 transition-colors">
            <img 
                src={anime.coverImage} 
                alt={title} 
                className="w-20 h-28 object-cover rounded-md flex-shrink-0 shadow-md transform transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
            <div className="overflow-hidden">
                <h3 className="text-white text-sm font-bold line-clamp-2 group-hover:text-cyan-400 transition-colors" title={title}>{title}</h3>
                 <div className="flex flex-col gap-1 text-gray-400 text-xs mt-2">
                    {anime.format && <span className="font-semibold">{anime.format.replace(/_/g, ' ')}</span>}
                    {anime.year > 0 && <span className="font-semibold">{anime.year}</span>}
                    {episodeText && <span className="font-semibold">{episodeText}</span>}
                </div>
                <p className="text-cyan-400 text-xs mt-2 capitalize font-semibold">{anime.relationType.toLowerCase().replace(/_/g, ' ')}</p>
            </div>
        </div>
    </div>
)};

const AiringIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.99 2.05c.53 0 1.04 .08 1.54 .23l-1.28 1.28A5.95 5.95 0 004.28 7.5l-1.28 1.28A7.94 7.94 0 019.99 2.05zM2.06 9.99a7.94 7.94 0 016.71-7.71l-1.28 1.28A5.95 5.95 0 003.5 12.5l-1.28 1.28A7.94 7.94 0 012.06 10zM10 4a6 6 0 100 12 6 6 0 000-12zM10 14a4 4 0 110-8 4 4 0 010 8z" />
    </svg>
);


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
  onReportIssue,
  topAiring,
}) => {
  const { getStreamUrl } = useAdmin();
  const { titleLanguage } = useTitleLanguage();
  const episodeCount = anime.episodes || 1;
  const [zenshinData, setZenshinData] = useState<ZenshinMapping | null>(null);
  const [isZenshinLoading, setIsZenshinLoading] = useState(true);
  const [isAiringNotificationVisible, setIsAiringNotificationVisible] = useState(true);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [isRangeSelectorOpen, setIsRangeSelectorOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const rangeSelectorRef = useRef<HTMLDivElement>(null);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [resumeNotification, setResumeNotification] = useState<string | null>(null);

  useEffect(() => {
    // This effect shows a notification when resuming an episode.
    // It runs only when the player is first loaded for an anime.
    if (currentEpisode > 1) {
        setResumeNotification(`Resuming from Episode ${currentEpisode}`);

        const timer = setTimeout(() => {
            setResumeNotification(null);
        }, 4000); // Display for 4 seconds

        return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime.anilistId]);

  useEffect(() => {
    const fetchMappings = async () => {
        setIsZenshinLoading(true);
        try {
            const data = await getZenshinMappings(anime.anilistId);
            setZenshinData(data);
        } catch (error) {
            console.error("Failed to fetch zenshin mappings", error);
            setZenshinData(null); // Ensure it's null on error
        } finally {
            setIsZenshinLoading(false);
        }
    };
    fetchMappings();
  }, [anime.anilistId]);

  useEffect(() => {
    if (anime && currentEpisode > 0) {
      setLastWatchedEpisode(anime.anilistId, currentEpisode);
    }
  }, [anime, currentEpisode]);

  const episodeRanges = useMemo(() => {
      if (!episodeCount || episodeCount <= 100) return [];
      const ranges = [];
      for (let i = 0; i < episodeCount; i += 100) {
          const start = i + 1;
          const end = Math.min(i + 100, episodeCount);
          ranges.push({ start, end });
      }
      return ranges;
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

  const streamUrl = useMemo(() => {
    if (isZenshinLoading) {
      return 'about:blank';
    }
    return getStreamUrl({
        animeId: anime.anilistId, malId: anime.malId, episode: currentEpisode, source: currentSource, language: currentLanguage, zenshinData, animeFormat: anime.format
    });
  }, [anime, currentEpisode, currentSource, currentLanguage, getStreamUrl, zenshinData, isZenshinLoading]);

  useEffect(() => {
    setIsPlayerLoading(true);
  }, [streamUrl]);

  const nextAiringDate = useMemo(() => {
    if (!anime.nextAiringEpisode) return null;
    const date = new Date(anime.nextAiringEpisode.airingAt * 1000);
    const timeUntil = anime.nextAiringEpisode.timeUntilAiring;
    const days = Math.floor(timeUntil / 86400);
    const hours = Math.floor((timeUntil % 86400) / 3600);
    const minutes = Math.floor((timeUntil % 3600) / 60);
    const countdown = `(${days} days, ${hours} hours, ${minutes} minutes)`;
    const formattedDate = date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
    return { formattedDate, countdown };
  }, [anime.nextAiringEpisode]);

  const handleEpisodeSearch = (e: React.FormEvent) => {
      e.preventDefault();
      const epNum = parseInt(episodeSearch, 10);
      if (!isNaN(epNum) && epNum >= 1 && epNum <= episodeCount) {
          onEpisodeChange(epNum);
          setEpisodeSearch('');
      }
  };

  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
  const currentZenshinEpisode = zenshinData?.episodes?.[currentEpisode];
  const episodeTitle = currentZenshinEpisode?.title?.en || `Episode ${currentEpisode}`;
  const episodes = Array.from({ length: episodeCount }, (_, i) => i + 1);
  const filteredEpisodes = useMemo(() => {
      if (!selectedRange) return episodes;
      return episodes.slice(selectedRange.start - 1, selectedRange.end);
  }, [episodes, selectedRange]);

  const sources = [
    { id: StreamSource.AnimePahe, label: 'Src 1' },
    { id: StreamSource.Vidnest, label: 'Src 2' },
  ];
  
  const languages = [
    { id: StreamLanguage.Sub, label: 'SUB' },
    { id: StreamLanguage.Dub, label: 'DUB' },
    { id: StreamLanguage.Hindi, label: 'HINDI' },
  ];
  
  const StarRating = ({ score }: { score: number }) => {
    const rating = score / 10;
    const stars = [];
    for (let i = 1; i <= 10; i++) {
        if (i <= rating) {
            stars.push(<svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>);
        } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
            stars.push(<svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292zM10 12.243l-1.484 1.082.284-1.727-1.255-.913 1.734-.15L10 8.043l.72 1.492 1.734.15-1.255.913.284 1.727L10 12.243z"/></svg>);
        } else {
            stars.push(<svg key={i} className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>);
        }
    }
    return <div className="flex">{stars}</div>;
  };

  return (
    <main className="min-h-screen text-white animate-fade-in">
      <div className="container mx-auto max-w-screen-2xl p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <button 
                onClick={onBack} 
                className="mb-6 group flex items-center gap-2 text-gray-300 hover:text-white font-semibold transition-colors bg-gray-800/50 hover:bg-gray-700/80 px-4 py-2 rounded-full shadow-lg"
                aria-label="Go back to details"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to details</span>
            </button>
            
            <div className="mb-4 bg-gray-900/50 p-4 rounded-lg">
              <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">{title}</h2>
              <p className="text-md text-cyan-400 font-semibold mt-1">{episodeTitle}</p>
              <p className="text-gray-400 text-sm mt-2 line-clamp-2">{currentZenshinEpisode?.overview}</p>
            </div>

            <div className="aspect-video bg-black rounded-lg shadow-xl overflow-hidden mb-4 relative">
              {(isPlayerLoading || isZenshinLoading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                      <LoadingSpinner />
                  </div>
              )}
              <iframe
                key={streamUrl}
                src={streamUrl}
                title={`${title} - Episode ${currentEpisode}`}
                onLoad={() => setIsPlayerLoading(false)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-presentation allow-fullscreen"
                allowFullScreen
                className="w-full h-full border-0"
              ></iframe>
               {resumeNotification && (
                <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-fast">
                    <p className="font-semibold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {resumeNotification}
                    </p>
                </div>
              )}
            </div>

            <div className="bg-gray-900/80 p-4 rounded-lg shadow-lg mb-4">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-3">
                  <div className="flex items-center gap-x-6 gap-y-3 flex-wrap">
                      <div className="flex items-center gap-2">
                          {sources.map(source => (
                              <button key={source.id} onClick={() => onSourceChange(source.id)} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${currentSource === source.id ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{source.label}</button>
                          ))}
                      </div>
                      <div className="h-6 w-px bg-gray-700"></div>
                      <div className="flex items-center gap-2">
                          {languages.map(lang => {
                              const isLangDisabled = currentSource === StreamSource.AnimePahe && (lang.id === StreamLanguage.Dub || lang.id === StreamLanguage.Hindi);
                              return (
                                <button 
                                    key={lang.id} 
                                    onClick={() => !isLangDisabled && onLanguageChange(lang.id)}
                                    disabled={isLangDisabled}
                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${currentLanguage === lang.id ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-300'} ${isLangDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                                >
                                    {lang.label}
                                </button>
                              )
                          })}
                      </div>
                  </div>
                  <button onClick={onReportIssue} className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/50 hover:bg-yellow-800/50 font-semibold px-4 py-1.5 rounded-md transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      Report Issue
                  </button>
              </div>
              
              <div className="text-xs text-center bg-gray-800/70 p-2 rounded-md text-gray-400">
                  Video not playing? Try selecting a different source (e.g., Src 2) or language (SUB/DUB) above.
              </div>

              {isAiringNotificationVisible && anime.status === 'RELEASING' && nextAiringDate && (
                <div className="bg-cyan-900/50 border border-cyan-700/50 text-cyan-200 text-sm p-3 rounded-lg flex justify-between items-start gap-3 animate-fade-in mt-3">
                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    <p className="font-semibold">Next episode ({anime.nextAiringEpisode?.episode}) airs around: {nextAiringDate.formattedDate} <span className="text-cyan-300/80">{nextAiringDate.countdown}</span></p>
                  </div>
                  <button onClick={() => setIsAiringNotificationVisible(false)} className="text-cyan-200 hover:text-white transition-colors p-1 rounded-full hover:bg-cyan-800/50 flex-shrink-0 -mt-1 -mr-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              )}
            </div>
            
            <div className="bg-gray-900/80 p-4 rounded-lg shadow-lg">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-y-4 gap-x-2">
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={rangeSelectorRef}>
                            {episodeRanges.length > 0 && selectedRange && (
                                <button onClick={() => setIsRangeSelectorOpen(p => !p)} className="flex items-center justify-between gap-1.5 bg-gray-700/80 text-gray-300 rounded-md py-1.5 px-3 text-sm font-semibold hover:bg-gray-600 transition-colors min-w-[130px]">
                                    <span>{`${String(selectedRange.start).padStart(3, '0')}-${selectedRange.end}`}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                            )}
                            {isRangeSelectorOpen && ( <div className="absolute bottom-full mb-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 animate-fade-in-fast"><ul>{episodeRanges.map((range, i) => <li key={i}><button onClick={() => { setSelectedRange(range); setIsRangeSelectorOpen(false); }} className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-sm ${range.start === selectedRange?.start ? 'text-cyan-400' : ''}`}>{`${String(range.start).padStart(3, '0')} - ${range.end}`}</button></li>)}</ul></div> )}
                        </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => onEpisodeChange(Math.max(1, currentEpisode - 1))} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md font-semibold text-sm transition-colors flex items-center gap-1" disabled={currentEpisode <= 1}>
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                Prev
                            </button>
                            <button onClick={() => onEpisodeChange(episodeCount)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md font-semibold text-sm transition-colors" disabled={currentEpisode === episodeCount}>Latest</button>
                            <button onClick={() => onEpisodeChange(Math.min(episodeCount, currentEpisode + 1))} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md font-semibold text-sm transition-colors flex items-center gap-1" disabled={currentEpisode >= episodeCount}>
                                Next
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                   </div>
                   <form onSubmit={handleEpisodeSearch} className="relative">
                       <button type="submit" className="absolute inset-y-0 left-0 flex items-center pl-3" aria-label="Search episode">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <input 
                            type="number" 
                            value={episodeSearch} 
                            onChange={e => setEpisodeSearch(e.target.value)} 
                            placeholder="Find Ep..." 
                            className="bg-gray-700/80 text-white rounded-md py-1.5 pl-9 pr-3 w-36 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                    </form>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1 pt-4 border-t border-gray-700/50">
                    {filteredEpisodes.map(ep => (
                    <button key={ep} onClick={() => onEpisodeChange(ep)} className={`py-2 px-1 flex items-center justify-center font-bold rounded transition-colors text-xs ${ep === currentEpisode ? 'bg-cyan-500 text-white' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'}`}>{ep}</button>
                    ))}
                </div>
            </div>

            <div className="mt-8">
              <div className="bg-gray-900/80 p-4 rounded-lg shadow-lg flex flex-col md:flex-row gap-6">
                <img 
                  src={anime.coverImage} 
                  alt={title}
                  onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
                  className="w-full md:w-48 h-auto object-cover rounded-lg aspect-[2/3] self-center"
                />
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-cyan-400 pl-3">Details</h3>
                  <p className="text-gray-400 text-sm mt-2 mb-4 line-clamp-6">{anime.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div><span className="font-bold text-gray-300">Type:</span> <span className="text-gray-400">{anime.format}</span></div>
                    <div><span className="font-bold text-gray-300">Studios:</span> <span className="text-gray-400">{anime.studios.join(', ')}</span></div>
                    <div><span className="font-bold text-gray-300">Aired:</span> <span className="text-gray-400">{anime.year}</span></div>
                    <div><span className="font-bold text-gray-300">Status:</span> <span className="text-gray-400 capitalize">{anime.status.toLowerCase().replace(/_/g, ' ')}</span></div>
                    <div><span className="font-bold text-gray-300">Duration:</span> <span className="text-gray-400">{anime.duration || 'N/A'} min</span></div>
                    <div><span className="font-bold text-gray-300">Genres:</span> <span className="text-gray-400">{anime.genres.join(', ')}</span></div>
                  </div>
                </div>
                {anime.rating > 0 && (
                  <div className="flex-shrink-0 bg-gray-900/50 p-4 rounded-lg flex flex-col items-center justify-center gap-2 self-start text-center">
                      <p className="text-3xl font-bold text-white">
                          {(anime.rating / 10).toFixed(2)}
                          <span className="text-xl text-gray-400"> / 10</span>
                      </p>
                      <StarRating score={anime.rating} />
                      <p className="text-xs text-gray-500 mt-1">Avg. Score</p>
                      <div className="mt-4 pt-4 border-t border-gray-700/50 w-full">
                          <p className="text-sm font-semibold text-gray-300 mb-2">Rate this anime?</p>
                          <div className="flex justify-center gap-4">
                              <button className="p-2 rounded-full bg-gray-700/60 hover:bg-green-500 hover:text-white transition-colors" aria-label="Like">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.758a1 1 0 00.97-1.22l-1.93-6.114A1 1 0 0012.627 9H9.5a1 1 0 00-1 1v.5a.5.5 0 01-1 0V10a1 1 0 00-1-1H6z" />
                                  </svg>
                              </button>
                              <button className="p-2 rounded-full bg-gray-700/60 hover:bg-red-500 hover:text-white transition-colors" aria-label="Dislike">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1h-6.758a1 1 0 00-.97 1.22l1.93 6.114A1 1 0 008.373 11H10.5a1 1 0 001-1v-.5a.5.5 0 011 0V10a1 1 0 001 1h1z" />
                                  </svg>
                              </button>
                          </div>
                      </div>
                  </div>
                )}
              </div>
            </div>

            {anime.recommendations && anime.recommendations.length > 0 && (
              <div className="mt-8">
                  <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-cyan-400 pl-3">You Might Also Like</h3>
                  <div className="flex gap-4 overflow-x-auto carousel-scrollbar pb-2">
                      {anime.recommendations.map(rec => (
                          <RecommendationCard key={rec.id} anime={rec} onSelect={() => onSelectRecommended({ anilistId: rec.id })} />
                      ))}
                  </div>
              </div>
            )}
        </div>

        <div className="lg:col-span-1">
            <div className="sticky top-20 flex flex-col gap-8">
                {anime.relations && anime.relations.length > 0 && (
                    <div className="bg-gray-900/80 p-4 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-white mb-3 border-l-4 border-cyan-400 pl-3">Related Anime</h3>
                        <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
                            {anime.relations.map(rel => (
                                <RelatedAnimeCard key={`${rel.id}-${rel.relationType}`} anime={rel} onSelect={() => onSelectRelated({ anilistId: rel.id })} />
                            ))}
                        </div>
                    </div>
                )}
                {topAiring && topAiring.length > 0 && (!anime.relations || anime.relations.length < 4) && (
                    <VerticalAnimeList
                        title="Top Airing"
                        animeList={topAiring}
                        onSelectAnime={(selectedAnime) => onSelectRelated({ anilistId: selectedAnime.anilistId })}
                        icon={<AiringIcon />}
                        showRank={true}
                    />
                )}
            </div>
        </div>
      </div>
    </main>
  );
};

export default AnimePlayer;