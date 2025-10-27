import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Anime, StreamSource, StreamLanguage, RelatedAnime, RecommendedAnime, ZenshinMapping, HiAnimeInfo } from '../types';
import { useAdmin } from '../contexts/AdminContext';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { getZenshinMappings, getHiAnimeInfo } from '../services/anilistService';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';
import { useTooltip } from '../contexts/TooltipContext';
import { progressTracker } from '../utils/progressTracking';
import Logo from './Logo';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';
import CustomVideoPlayer from './CustomVideoPlayer';


// Player control icons
const PrevIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const NextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const FullscreenEnterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2.5a.75.75 0 01.75.75v.5h2.5a.75.75 0 010 1.5h-3.25a.75.75 0 01-.75-.75V3.25a.75.75 0 01.75-.75zM7.5 10a.75.75 0 01.75-.75h.5V6.75a.75.75 0 011.5 0v3.25a.75.75 0 01-.75.75H6.75a.75.75 0 010-1.5h.75zM10 12.5a.75.75 0 01.75.75v.5h2.5a.75.75 0 010 1.5h-3.25a.75.75 0 01-.75-.75V13.25a.75.75 0 01.75-.75zM7.5 10a.75.75 0 00-.75.75v.5H4.25a.75.75 0 000 1.5h3.25a.75.75 0 00.75-.75V10.75a.75.75 0 00-.75-.75z" clipRule="evenodd" transform="rotate(45 10 10)" /></svg>;
const FullscreenExitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 17.5a.75.75 0 01-.75-.75v-.5H6.75a.75.75 0 010-1.5h3.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0v-.75zM12.5 10a.75.75 0 01-.75.75h-.5v2.5a.75.75 0 01-1.5 0v-3.25a.75.75 0 01.75-.75h3.25a.75.75 0 010 1.5h-.75zM10 7.5a.75.75 0 01-.75-.75v-.5H6.75a.75.75 0 010-1.5h3.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0v-.75zM12.5 10a.75.75 0 00.75-.75v-.5h2.5a.75.75 0 000-1.5h-3.25a.75.75 0 00-.75.75v3.25a.75.75 0 001.5 0v-.75z" clipRule="evenodd" transform="rotate(45 10 10)" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;
const ReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ListIconSvg = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const PrevIconButton = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const NextIconButton = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
const LatestIconButton = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M15 5H5a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1zm-1 8H6V7h8v6z" /><path d="M18 7h-1V6a1 1 0 00-1-1H4a1 1 0 000 2h1v8H4a1 1 0 000 2h11a1 1 0 001-1v-1h1a1 1 0 000-2z" /></svg>;


const DiscoverCard: React.FC<{ anime: RecommendedAnime | RelatedAnime, onSelect: () => void }> = ({ anime, onSelect }) => {
    const { titleLanguage } = useTitleLanguage();
    const { showTooltip, hideTooltip } = useTooltip();
    const cardRef = useRef<HTMLDivElement>(null);
    const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
    const episodeText = anime.episodes ? `${anime.episodes} Eps` : null;
    const relationType = (anime as RelatedAnime).relationType;

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
                isAdult: anime.isAdult,
            };
            showTooltip(partialAnime, cardRef.current.getBoundingClientRect(), { showWatchButton: true });
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
            </div>
             <div className="pt-3">
                <h3 className="text-white text-sm font-bold truncate group-hover:text-cyan-400 transition-colors" title={title}>{title}</h3>
                <div className="flex items-center gap-3 text-gray-400 text-xs mt-1">
                    {anime.format && <span className="font-semibold">{anime.format.replace(/_/g, ' ')}</span>}
                    {anime.year > 0 && <span className="font-semibold">{anime.year}</span>}
                    {episodeText && <span className="font-semibold">{episodeText}</span>}
                </div>
                 {relationType && (
                    <p className="text-cyan-400 text-xs mt-1 capitalize font-semibold">
                        {relationType.toLowerCase().replace(/_/g, ' ')}
                    </p>
                )}
            </div>
        </div>
    );
};

const SourceIndicator = ({ status }: { status: number | 'loading' | 'timeout' | undefined }) => {
    const baseClasses = "absolute top-0 right-0 w-3 h-3";

    if (status === 'loading') {
        return <div className={`${baseClasses} bg-gray-500 animate-pulse`} style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />;
    }
    if (status === 'timeout') {
        return <div className={baseClasses} style={{ backgroundColor: '#ef4444', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />; // red-500
    }
    if (typeof status === 'number') {
        let color = '#4ade80'; // green-400 for fast
        if (status > 12000) {
            color = '#facc15'; // yellow-400 for slow
        } else if (status > 5000) {
            color = '#3b82f6'; // blue-500 for average
        }
        return <div className={baseClasses} style={{ backgroundColor: color, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />;
    }
    return null;
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
  onViewMore: (filters: { animeList: (RelatedAnime | RecommendedAnime)[] }, title: string) => void;
  onReportIssue: () => void;
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
}) => {
  const { getStreamUrl } = useAdmin();
  const { titleLanguage } = useTitleLanguage();
  const [zenshinData, setZenshinData] = useState<ZenshinMapping | null | undefined>();
  const [hiAnimeInfo, setHiAnimeInfo] = useState<HiAnimeInfo | null | undefined>();
  const [isAiringNotificationVisible, setIsAiringNotificationVisible] = useState(true);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [episodeSearchError, setEpisodeSearchError] = useState<string | null>(null);
  const [isRangeSelectorOpen, setIsRangeSelectorOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const rangeSelectorRef = useRef<HTMLDivElement>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<{ src: string; label: string; srclang: string; default?: boolean; kind?: string }[]>([]);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [resumeNotification, setResumeNotification] = useState<string | null>(null);
  const lastWatchedEp = useMemo(() => progressTracker.getMediaData(anime.anilistId)?.last_episode_watched, [anime.anilistId]);
  
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [episodeView, setEpisodeView] = useState<'list' | 'grid'>('list');

  const relatedScrollContainerRef = useRef<HTMLDivElement>(null);
  const recsScrollContainerRef = useRef<HTMLDivElement>(null);
  const [showRelatedScrollButtons, setShowRelatedScrollButtons] = useState(false);
  const [showRecsScrollButtons, setShowRecsScrollButtons] = useState(false);

  const { showNotification } = useNotification(); 
  const [sourceLoadTimes, setSourceLoadTimes] = useState<Partial<Record<StreamSource, number | 'loading' | 'timeout'>>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const testRunRef = useRef<string | null>(null);
  const episodeSourceTestRunRef = useRef<number>(0);

  const episodeCount = useMemo(() => {
    if (anime.status === 'RELEASING') {
        return anime.episodes || 1;
    }
    return anime.totalEpisodes || anime.episodes || 1;
  }, [anime]);

  useEffect(() => {
    if (episodeCount > 100) {
        setEpisodeView('grid');
    } else {
        setEpisodeView('list');
    }
  }, [episodeCount]);

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


  useEffect(() => {
    const createOverflowChecker = (ref: React.RefObject<HTMLDivElement>, setter: React.Dispatch<React.SetStateAction<boolean>>) => () => {
        if (ref.current) {
            setter(ref.current.scrollWidth > ref.current.clientWidth);
        }
    };
    const checkRelatedOverflow = createOverflowChecker(relatedScrollContainerRef, setShowRelatedScrollButtons);
    const checkRecsOverflow = createOverflowChecker(recsScrollContainerRef, setShowRecsScrollButtons);
    
    const timerRelated = setTimeout(checkRelatedOverflow, 100);
    const timerRecs = setTimeout(checkRecsOverflow, 100);
    window.addEventListener('resize', checkRelatedOverflow);
    window.addEventListener('resize', checkRecsOverflow);
    return () => {
        clearTimeout(timerRelated);
        clearTimeout(timerRecs);
        window.removeEventListener('resize', checkRelatedOverflow);
        window.removeEventListener('resize', checkRecsOverflow);
    };
}, [anime.relations, anime.recommendations]);

const createScroller = (ref: React.RefObject<HTMLDivElement>) => (direction: 'left' | 'right') => {
    if (ref.current) {
        const scrollAmount = ref.current.clientWidth * 0.8;
        ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
};

const scrollRelated = createScroller(relatedScrollContainerRef);
const scrollRecs = createScroller(recsScrollContainerRef);


  // --- Overlay and Fullscreen Logic ---
  
  const hideOverlay = useCallback(() => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    setIsOverlayVisible(false);
  }, []);

  const showOverlay = useCallback((autoHide = true) => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    setIsOverlayVisible(true);
    if (autoHide) {
      inactivityTimeoutRef.current = window.setTimeout(() => setIsOverlayVisible(false), 3500);
    }
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
        const [zenshin, hianime] = await Promise.all([ getZenshinMappings(anime.anilistId), getHiAnimeInfo(anime.anilistId) ]);
        setZenshinData(zenshin);
        setHiAnimeInfo(hianime);
    };
    fetchMappings();
  }, [anime.anilistId]);
  
  useEffect(() => {
    setIsPlayerLoading(true);
    setStreamUrl(null);
    setSubtitles([]);

    const handleStreamUrl = async () => {
        if (currentSource === StreamSource.HiAnimeV2) {
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

            try {
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
                showNotification('Failed to load Source 6 stream.', 'error');
                setStreamUrl('about:blank#stream-fetch-error');
                setIsPlayerLoading(false);
            }

        } else {
            // Existing logic for other sources
            const url = getStreamUrl({ animeId: anime.anilistId, malId: anime.malId, episode: currentEpisode, source: currentSource, language: currentLanguage, zenshinData, hiAnimeInfo, animeFormat: anime.format });
            setStreamUrl(url);
        }
    };
    
    // This setTimeout provides a small delay to allow state to settle before fetching.
    const timer = setTimeout(handleStreamUrl, 50);
    
    return () => clearTimeout(timer);
}, [anime.anilistId, anime.malId, anime.format, currentEpisode, currentSource, currentLanguage, getStreamUrl, zenshinData, hiAnimeInfo, refreshKey, showNotification]);


  useEffect(() => {
    if (anime && currentEpisode > 0) progressTracker.setLastWatchedEpisode(anime, currentEpisode);
    hideOverlay(); setEpisodeSearchError(null);
  }, [anime, currentEpisode, hideOverlay]);

  const episodeRanges = useMemo(() => {
      if (!episodeCount || episodeCount <= 100) return [];
      const ranges = [];
      for (let i = 0; i < episodeCount; i += 100) {
          ranges.push({ start: i + 1, end: Math.min(i + 100, episodeCount) });
      }
      return ranges;
  }, [episodeCount]);

  useEffect(() => {
      if (episodeRanges.length > 0) {
          const currentRange = episodeRanges.find(r => currentEpisode >= r.start && currentEpisode <= r.end);
          setSelectedRange(currentRange || episodeRanges[0]);
      } else setSelectedRange(null);
  }, [currentEpisode, episodeRanges]);

  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          if (rangeSelectorRef.current && !rangeSelectorRef.current.contains(e.target as Node)) setIsRangeSelectorOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleEpisodeSearch = (e: React.FormEvent) => {
      e.preventDefault();
      const epNum = parseInt(episodeSearch, 10);
      if (isNaN(epNum) || epNum < 1) { setEpisodeSearchError("Invalid number."); return; }
      if (epNum > episodeCount) {
          if (anime.status === 'RELEASING' && anime.totalEpisodes && epNum <= anime.totalEpisodes) setEpisodeSearchError(`Not released yet.`);
          else setEpisodeSearchError(`Max ep: ${episodeCount}.`);
          return;
      }
      onEpisodeChange(epNum);
      setEpisodeSearch(''); setEpisodeSearchError(null);
  };

  const handleReportIssue = () => {
    onReportIssue(); showNotification('Thank you for your feedback! We will look into it!', 'success', 3000); 
  };
  
  const handleRefresh = () => {
    setIsPlayerLoading(true); setRefreshKey(prev => prev + 1); showNotification('Refreshing player...', 'info', 1500);
  };

  const playerAllowString = useMemo(() => {
    const permissions = ['accelerometer', 'autoplay', 'clipboard-write', 'encrypted-media', 'gyroscope'];
    if (currentSource !== StreamSource.HiAnime && currentSource !== StreamSource.HiAnimeV2) permissions.push('picture-in-picture');
    return permissions.join('; ');
  }, [currentSource]);

  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
  const currentZenshinEpisode = zenshinData?.episodes?.[currentEpisode];
  const episodeTitle = currentZenshinEpisode?.title?.en || `Episode ${currentEpisode}`;
  const episodes = Array.from({ length: episodeCount }, (_, i) => i + 1);
  const filteredEpisodes = useMemo(() => selectedRange ? episodes.slice(selectedRange.start - 1, selectedRange.end) : episodes, [episodes, selectedRange]);

  const sources = [ { id: StreamSource.Vidsrc, label: 'Src 1' }, { id: StreamSource.HiAnime, label: 'Src 2' }, { id: StreamSource.Vidnest, label: 'Src 3' }, { id: StreamSource.HiAnimeV2, label: 'Src 4' }, { id: StreamSource.AnimePahe, label: 'Src 5' }, { id: StreamSource.VidsrcIcu, label: 'Src 6' } ];
  const languages = [ { id: StreamLanguage.Sub, label: 'SUB' }, { id: StreamLanguage.Dub, label: 'DUB' }, { id: StreamLanguage.Hindi, label: 'HINDI' } ];
  const sourcesWithoutLanguageControl: StreamSource[] = [];

  const DetailsComponent = () => (
    <div className="mt-8 lg:mt-4">
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

  const EpisodeSelector = () => (
    <div className="bg-gray-900/80 p-4 rounded-lg shadow-lg flex flex-col h-full">
        <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 mb-4 flex-shrink-0">
             <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                <span>List of episodes:</span>
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
                        const isFiller = zenshinEp?.isFiller;
                        return (
                            <li key={ep}>
                                <button
                                    onClick={() => onEpisodeChange(ep)}
                                    className={`w-full p-2.5 rounded-md transition-colors text-left flex items-center justify-between group relative ${
                                        isActive
                                            ? 'bg-cyan-500/20'
                                            : isFiller
                                            ? 'bg-yellow-900/50 hover:bg-yellow-800/50'
                                            : 'text-gray-300 hover:bg-gray-700/50'
                                    }`}
                                >
                                    {isActive && <div className="absolute left-0 h-3/4 w-1 bg-blue-500 rounded-r-full"></div>}
                                    <div className="flex items-center gap-4">
                                        <span className={`font-semibold w-8 text-center ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>{ep}</span>
                                        <span className={`font-semibold truncate ${isActive ? 'text-cyan-300' : isFiller ? 'text-yellow-300' : 'text-white'}`}>{epTitle}</span>
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
                        const isFiller = zenshinEp?.isFiller;
                        return (
                        <button
                            key={ep}
                            onClick={() => onEpisodeChange(ep)}
                            className={`py-2 px-1 flex items-center justify-center font-bold rounded transition-colors text-xs ${
                                ep === currentEpisode 
                                ? 'bg-cyan-500 text-white' 
                                : isFiller
                                ? 'bg-yellow-800/60 text-yellow-200 hover:bg-yellow-700/60'
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
                        onMouseMove={() => showOverlay()}
                        onMouseLeave={hideOverlay}
                    >
                      {isPlayerLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                            <div className="text-center">
                                <LoadingSpinner />
                                {(streamUrl?.includes('#hianime-info-loading') || currentSource === StreamSource.HiAnimeV2) && <p className="text-gray-400 text-sm mt-4">Preparing HiAnime stream...</p>}
                            </div>
                        </div>
                      )}
                      {currentSource === StreamSource.HiAnimeV2 && streamUrl && !streamUrl.includes('about:blank') ? (
                          <CustomVideoPlayer
                              src={streamUrl}
                              subtitles={subtitles}
                              onLoad={() => setIsPlayerLoading(false)}
                          />
                      ) : (
                        <iframe
                          key={`${streamUrl}-${refreshKey}`}
                          src={streamUrl || 'about:blank'}
                          onLoad={(e) => { if (e.currentTarget.src !== 'about:blank' && !e.currentTarget.src.includes('about:blank#')) setIsPlayerLoading(false); }}
                          title={`${title} - Episode ${currentEpisode}`}
                          allow={playerAllowString}
                          sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-presentation"
                          allowFullScreen
                          className="w-full h-full border-0"
                          scrolling="no"
                        ></iframe>
                      )}
                      
                       {resumeNotification && (
                        <div className="absolute top-4 right-4 z-30 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-fast pointer-events-none">
                            <p className="font-semibold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                {resumeNotification}
                            </p>
                        </div>
                      )}
                       <div className={`absolute inset-0 z-20 transition-opacity duration-300 pointer-events-none ${isOverlayVisible ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="absolute top-4 right-4 pointer-events-auto opacity-70">
                                <Logo />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-between px-4">
                                <button
                                    onClick={handlePrevEpisode}
                                    disabled={currentEpisode <= 1}
                                    className="p-3 bg-black/50 rounded-full hover:bg-black/80 transition-colors pointer-events-auto disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label="Previous Episode"
                                ><PrevIcon /></button>
                                <button
                                    onClick={handleNextEpisode}
                                    disabled={currentEpisode >= episodeCount}
                                    className="p-3 bg-black/50 rounded-full hover:bg-black/80 transition-colors pointer-events-auto disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label="Next Episode"
                                ><NextIcon /></button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900/80 p-2 rounded-b-lg flex items-center justify-center gap-x-1 sm:gap-x-1.5 gap-y-2 flex-wrap shadow-lg">
                        <button onClick={handlePrevEpisode} title="Previous Episode" className="p-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentEpisode <= 1}>
                            <PrevIconButton />
                        </button>
                         <button onClick={() => onEpisodeChange(episodeCount)} title="Latest Episode" className="p-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentEpisode === episodeCount}>
                            <LatestIconButton />
                        </button>
                        <button onClick={handleNextEpisode} title="Next Episode" className="p-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentEpisode >= episodeCount}>
                            <NextIconButton />
                        </button>
                        <div className="h-5 w-px bg-gray-700 hidden sm:block"></div>
                        <button onClick={handleFullscreen} className="flex items-center gap-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold px-2 py-1 rounded-md transition-colors" aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
                            <span className={`sm:hidden ${!isFullscreen ? 'animate-pulse' : ''}`}>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                        </button>
                         <button onClick={handleRefresh} className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 font-semibold px-2 py-1 rounded-md transition-colors">
                            <RefreshIcon /> <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button onClick={handleReportIssue} className="flex-shrink-0 flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-900/50 hover:bg-yellow-800/50 font-semibold px-2 py-1 rounded-md transition-colors">
                            <ReportIcon /> <span className="hidden sm:inline">Report Issue</span>
                        </button>
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
                                      const isLangDisabled = (currentSource === StreamSource.AnimePahe && (lang.id === StreamLanguage.Dub || lang.id === StreamLanguage.Hindi)) || ((currentSource === StreamSource.Vidsrc || currentSource === StreamSource.VidsrcIcu) && lang.id === StreamLanguage.Hindi) || (currentSource === StreamSource.HiAnime && lang.id === StreamLanguage.Hindi) || (currentSource === StreamSource.HiAnimeV2 && lang.id === StreamLanguage.Hindi);
                                      return ( <button key={lang.id} onClick={() => !isLangDisabled && onLanguageChange(lang.id)} disabled={isLangDisabled} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${currentLanguage === lang.id ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-300'} ${isLangDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}>{lang.label}</button> )
                                  })
                              )}
                          </div>
                      </div>
                      
                      <div className="text-xs text-center bg-gray-800/70 p-2 rounded-md text-gray-400"> Video not playing? Try selecting a different source (e.g., Src 2) or language (SUB/DUB) above. </div>
                    </div>
                    {isAiringNotificationVisible && anime.status === 'RELEASING' && nextAiringDate && (
                      <div className="bg-cyan-900/50 border border-cyan-700/50 text-cyan-200 text-sm p-2 rounded-lg flex justify-between items-start gap-2 animate-fade-in mt-4">
                        <div className="flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                          <p className="font-semibold">Next episode ({anime.nextAiringEpisode?.episode}) airs around: {nextAiringDate.formattedDate} <span className="text-cyan-300/80">{nextAiringDate.countdown}</span></p>
                        </div>
                        <button onClick={() => setIsAiringNotificationVisible(false)} className="text-cyan-200 hover:text-white transition-colors p-1 rounded-full hover:bg-cyan-800/50 flex-shrink-0 -mt-1 -mr-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-20 z-10 mt-8 lg:mt-0">
                    <EpisodeSelector />
                </div>
            </div>
        </div>
        <DetailsComponent />
        {anime.relations && anime.relations.length > 0 && (
            <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-white border-l-4 border-cyan-400 pl-3">Related Anime</h3>
                    <button
                        onClick={() => onViewMore({ animeList: anime.relations }, 'Related Anime')}
                        className="group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm"
                    >
                        <span>View All</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
                <div className="relative">
                    {showRelatedScrollButtons && (
                        <>
                            <button onClick={() => scrollRelated('left')} className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block" aria-label="Scroll Left"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => scrollRelated('right')} className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block" aria-label="Scroll Right"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                        </>
                    )}
                    <div ref={relatedScrollContainerRef} className="flex gap-4 overflow-x-auto carousel-scrollbar pb-2">
                        {anime.relations.map(rel => (<DiscoverCard key={`${rel.id}-${rel.relationType}`} anime={rel} onSelect={() => onSelectRelated({ anilistId: rel.id })} />))}
                    </div>
                </div>
            </div>
        )}
        {anime.recommendations && anime.recommendations.length > 0 && (
            <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-white border-l-4 border-cyan-400 pl-3">You Might Also Like</h3>
                    <button
                        onClick={() => onViewMore({ animeList: anime.recommendations }, 'You Might Also Like')}
                        className="group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm"
                    >
                        <span>View All</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
                <div className="relative">
                    {showRecsScrollButtons && (
                        <>
                            <button onClick={() => scrollRecs('left')} className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block" aria-label="Scroll Left"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => scrollRecs('right')} className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block" aria-label="Scroll Right"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                        </>
                    )}
                    <div ref={recsScrollContainerRef} className="flex gap-4 overflow-x-auto carousel-scrollbar pb-2">
                        {anime.recommendations.map(rec => (<DiscoverCard key={rec.id} anime={rec} onSelect={() => onSelectRecommended({ anilistId: rec.id })} />))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </main>
  );
};

export default AnimePlayer;