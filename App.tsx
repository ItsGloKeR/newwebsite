import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Anime, StreamSource, StreamLanguage, SearchSuggestion, FilterState, MediaSort, AiringSchedule, MediaStatus, MediaSeason, EnrichedAiringSchedule, MediaFormat, PageInfo } from './types';
import { getHomePageData, getAnimeDetails, getGenreCollection, getSearchSuggestions, discoverAnime, getLatestEpisodes, getMultipleAnimeDetails, getRandomAnime, getAiringSchedule, setDataSaverMode } from './services/anilistService';
import { addSearchTermToHistory } from './services/cacheService';
import { getLastPlayerSettings, setLastPlayerSettings, getLastWatchedEpisode } from './services/userPreferenceService';
import Header from './components/Header';
import Hero from './components/Hero';
import AnimeCarousel from './components/AnimeCarousel';
import AnimeGrid from './components/AnimeGrid';
import LoadingSpinner from './components/LoadingSpinner';
import Footer from './components/Footer';
import BackToTopButton from './components/BackToTopButton';
import VerticalAnimeList from './components/VerticalAnimeList';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { TitleLanguageProvider } from './contexts/TitleLanguageContext';
import { UserDataProvider, useUserData } from './contexts/UserDataContext';
import { DataSaverProvider, useDataSaver } from './contexts/DataSaverContext';
import { TooltipProvider } from './contexts/TooltipContext';
import isEqual from 'lodash.isequal';
import HomePageSkeleton from './components/HomePageSkeleton';
import { progressTracker } from './utils/progressTracking';
import { PLACEHOLDER_IMAGE_URL } from './constants';
import { useDebounce } from './hooks/useDebounce';
import AnimeDetailPageSkeleton from './components/AnimeDetailPageSkeleton';
import Sidebar from './components/Sidebar';
import FilterBar from './components/GenreFilter'; // Re-using GenreFilter file for FilterBar
import Pagination from './components/SidebarMenu'; // Re-using SidebarMenu file for Pagination

const LandingPage = React.lazy(() => import('./components/LandingPage'));
const AnimeDetailPage = React.lazy(() => import('./components/AnimeDetailPage'));
const AnimePlayer = React.lazy(() => import('./components/AnimePlayer'));
const SchedulePage = React.lazy(() => import('./components/SchedulePage'));
const AdminModal = React.lazy(() => import('./components/AdminModal'));
const InfoModal = React.lazy(() => import('./components/InfoModal'));
const ReportPage = React.lazy(() => import('./components/ReportPage'));


type View = 'home' | 'details' | 'player' | 'report';

const initialFilters: FilterState = {
    search: '',
    genres: [],
    year: '',
    season: undefined,
    formats: [],
    statuses: [],
    sort: MediaSort.POPULARITY_DESC,
    scoreRange: [0, 100],
    page: 1,
};

const SESSION_STORAGE_KEY = 'aniGlokSession';

const SchedulePreview: React.FC<{ schedule: AiringSchedule[]; onSelectAnime: (anime: { anilistId: number }) => void; onShowMore: () => void }> = ({ schedule, onSelectAnime, onShowMore }) => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todaysSchedule = useMemo(() => {
        return schedule
            .filter(item => {
                const itemDate = new Date(item.airingAt * 1000);
                return itemDate.getTime() >= startOfDay.getTime() && itemDate.getTime() <= endOfDay.getTime();
            })
            .sort((a, b) => a.airingAt - b.airingAt);
    }, [schedule, startOfDay, endOfDay]);


    return (
        <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-display tracking-wide uppercase">
                    <span className="text-cyan-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                    </span>
                    <span>Airing Today</span>
                </h2>
                <button 
                    onClick={onShowMore} 
                    className="group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm md:text-base whitespace-nowrap"
                >
                    <span>View Full Schedule</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
                 {todaysSchedule.length > 0 ? (
                    todaysSchedule.slice(0, 5).map(item => (
                        <div 
                            key={item.id}
                            onClick={() => onSelectAnime({ anilistId: item.media.id })}
                            className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-b-0 cursor-pointer group rounded-lg"
                        >
                            <span className="text-cyan-400 font-mono text-sm w-16 text-center">{new Date(item.airingAt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                            <img src={item.media.coverImage.extraLarge} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }} alt={item.media.title.english || item.media.title.romaji} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                            <div className="flex-grow overflow-hidden">
                                <p className="text-white font-semibold truncate group-hover:text-cyan-400 transition-colors">{item.media.title.english || item.media.title.romaji}</p>
                                <p className="text-gray-400 text-xs">Episode {item.episode}</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 mr-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No more episodes scheduled for today.
                    </div>
                )}
            </div>
        </section>
    );
};

const FullPageSpinner: React.FC = () => (
    <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
    </div>
);

const AppContent: React.FC = () => {
    const [showLanding, setShowLanding] = useState(true);
    const [view, setView] = useState<View>('home');
    const [trending, setTrending] = useState<Anime[]>([]);
    const [popular, setPopular] = useState<Anime[]>([]);
    const [topAiring, setTopAiring] = useState<Anime[]>([]);
    const [topRated, setTopRated] = useState<Anime[]>([]);
    const [topUpcoming, setTopUpcoming] = useState<Anime[]>([]);
    const [popularThisSeason, setPopularThisSeason] = useState<Anime[]>([]);
    const [latestEpisodes, setLatestEpisodes] = useState<EnrichedAiringSchedule[]>([]);
    const [searchResults, setSearchResults] = useState<Anime[]>([]);
    const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
    const [allGenres, setAllGenres] = useState<string[]>([]);
    const [continueWatching, setContinueWatching] = useState<Anime[]>([]);
    const [scheduleList, setScheduleList] = useState<AiringSchedule[]>([]);
    
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
    const [playerState, setPlayerState] = useState({
        anime: null as Anime | null,
        episode: 1,
        source: StreamSource.AnimePahe,
        language: StreamLanguage.Sub,
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [isListView, setIsListView] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [currentSeason, setCurrentSeason] = useState<MediaSeason | null>(null);
    const [currentYear, setCurrentYear] = useState<number | null>(null);
    const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);
    const [isBannerInView, setIsBannerInView] = useState(true);
    const [isScheduleVisible, setIsScheduleVisible] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDiscoverViewForced, setIsDiscoverViewForced] = useState(false);
    const [isFullSearchView, setIsFullSearchView] = useState(false);
    const [discoverListTitle, setDiscoverListTitle] = useState('');

    const debouncedSuggestionsTerm = useDebounce(searchTerm, 300);
    const { overrides } = useAdmin();
    const { watchlist, favorites } = useUserData();
    const { isDataSaverActive } = useDataSaver();

    const hideTooltip = () => window.dispatchEvent(new CustomEvent('hideTooltip'));

    useEffect(() => {
        setDataSaverMode(isDataSaverActive);
    }, [isDataSaverActive]);

    const isDiscoveryView = useMemo(() => {
        return !isEqual({ ...filters, page: 1 }, { ...initialFilters, page: 1 }) || isListView || isDiscoverViewForced;
    }, [filters, isListView, isDiscoverViewForced]);
    
    const showFilterBar = isDiscoveryView && isFullSearchView;

    useEffect(() => {
        if (sessionStorage.getItem('hasVisitedAniGloK') === 'true') {
            setShowLanding(false);
        }
    }, []);

    useEffect(() => {
        if (isSidebarOpen) {
            document.body.classList.add('sidebar-open');
        } else {
            document.body.classList.remove('sidebar-open');
        }
    }, [isSidebarOpen]);

    const handleEnterApp = (searchTerm?: string) => {
        sessionStorage.setItem('hasVisitedAniGloK', 'true');
        setShowLanding(false);
        if (searchTerm) {
            setFilters({ ...initialFilters, search: searchTerm, page: 1 });
            addSearchTermToHistory(searchTerm);
            setIsFullSearchView(true);
            setIsDiscoverViewForced(true);
            setView('home');
        }
    };
    
    const handleGoToLanding = () => {
        setShowLanding(true);
    };

    const applyOverrides = useCallback((anime: Anime): Anime => {
        if (!anime) return anime;
        const overriddenTitle = overrides.anime[anime.anilistId]?.title;
        return overriddenTitle ? { ...anime, englishTitle: overriddenTitle } : anime;
    }, [overrides.anime]);
    
    const enrichAnimeWithProgress = useCallback((animeList: Anime[]): Anime[] => {
        const allProgress = progressTracker.getAllMediaData();
        return animeList.map(anime => {
            const progressData = allProgress[anime.anilistId];
            if (progressData?.progress?.watched && progressData?.progress?.duration) {
            const percentage = (progressData.progress.watched / progressData.progress.duration) * 100;
            return { ...anime, progress: percentage };
            }
            return { ...anime, progress: 0 };
        });
    }, []);

    const enrichScheduleWithProgress = useCallback((scheduleList: AiringSchedule[]): EnrichedAiringSchedule[] => {
        const allProgress = progressTracker.getAllMediaData();
        return scheduleList.map(schedule => {
            const progressData = allProgress[schedule.media.id];
            if (progressData?.progress?.watched && progressData?.progress?.duration) {
                const percentage = (progressData.progress.watched / progressData.progress.duration) * 100;
                return { ...schedule, progress: percentage };
            }
            return schedule;
        });
    }, []);


    const applyOverridesToList = useCallback((list: Anime[]): Anime[] => {
        return list.map(applyOverrides);
    }, [applyOverrides]);

    const refreshDataWithProgress = useCallback(() => {
        setTrending(prev => enrichAnimeWithProgress(prev));
        setPopular(prev => enrichAnimeWithProgress(prev));
        setTopAiring(prev => enrichAnimeWithProgress(prev));
        setTopRated(prev => enrichAnimeWithProgress(prev));
        setTopUpcoming(prev => enrichAnimeWithProgress(prev));
        setPopularThisSeason(prev => enrichAnimeWithProgress(prev));
        setSearchResults(prev => enrichAnimeWithProgress(prev));
        setLatestEpisodes(prev => enrichScheduleWithProgress(prev));
        setContinueWatching(prev => enrichAnimeWithProgress(prev));

        if (selectedAnime) {
            const progressData = progressTracker.getMediaData(selectedAnime.anilistId);
            let updatedAnime = { ...selectedAnime };
            if (progressData?.progress?.watched && progressData?.progress?.duration) {
                const percentage = (progressData.progress.watched / progressData.progress.duration) * 100;
                updatedAnime.progress = percentage;
            }
            setSelectedAnime(updatedAnime);
        }
    }, [enrichAnimeWithProgress, enrichScheduleWithProgress, selectedAnime]);
    
    const handleSelectAnime = async (anime: Anime | { anilistId: number }) => {
        hideTooltip();
        setIsLoading(true);
        setIsBannerInView(true);
        setView('details');
        window.scrollTo(0, 0);
        try {
            const fullDetails = await getAnimeDetails(anime.anilistId);
            const allProgress = progressTracker.getAllMediaData();

            if (fullDetails.relations) {
                fullDetails.relations = fullDetails.relations.map(rel => {
                    const progressData = allProgress[rel.id];
                    if (progressData?.progress?.watched && progressData?.progress?.duration) {
                        return { ...rel, progress: (progressData.progress.watched / progressData.progress.duration) * 100 };
                    }
                    return rel;
                });
            }
            if (fullDetails.recommendations) {
                fullDetails.recommendations = fullDetails.recommendations.map(rec => {
                    const progressData = allProgress[rec.id];
                    if (progressData?.progress?.watched && progressData?.progress?.duration) {
                        return { ...rec, progress: (progressData.progress.watched / progressData.progress.duration) * 100 };
                    }
                    return rec;
                });
            }
            setSelectedAnime(enrichAnimeWithProgress([applyOverrides(fullDetails)])[0]);
        } catch (error) {
            console.error("Failed to get anime details:", error);
            setSelectedAnime(null);
            setView('home');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleWatchNow = (anime: Anime | Partial<Anime>, episode?: number) => {
        hideTooltip();
        progressTracker.addToHistory(anime as Anime);
        const lastSettings = getLastPlayerSettings();
        let startEpisode = episode;
        if (!startEpisode) {
            const progressData = progressTracker.getMediaData(anime.anilistId);
            const lastWatchedFromProgress = progressData ? parseInt(progressData.last_episode_watched, 10) : null;
            const lastSelectedEpisode = getLastWatchedEpisode(anime.anilistId);
            startEpisode = Math.max(lastWatchedFromProgress || 1, lastSelectedEpisode || 1);
        }

        setPlayerState({
            anime: applyOverrides(anime as Anime),
            episode: startEpisode,
            source: lastSettings.source,
            language: lastSettings.language,
        });
        setView('player');
        window.scrollTo(0, 0);
        const fetchLatestDetails = async () => {
            try {
                const fullDetails = await getAnimeDetails(anime.anilistId);
                setPlayerState(prev => {
                    if (prev.anime?.anilistId === fullDetails.anilistId) {
                        return { ...prev, anime: applyOverrides(fullDetails) };
                    }
                    return prev;
                });
            } catch (error) {
                console.warn(
                    "Could not fetch full/fresh details for the player. Using existing data as a fallback.",
                    error
                );
            }
        };
        fetchLatestDetails();
    };

    const handleSourceChange = (source: StreamSource) => {
        setPlayerState(prev => {
            setLastPlayerSettings(source, prev.language);
            return { ...prev, source };
        });
    };

    const handleLanguageChange = (language: StreamLanguage) => {
        setPlayerState(prev => {
            setLastPlayerSettings(prev.source, language);
            return { ...prev, language };
        });
    };

    useEffect(() => {
        progressTracker.init();
        const handleProgressUpdate = () => refreshDataWithProgress();
        window.addEventListener('progressUpdated', handleProgressUpdate);
        return () => window.removeEventListener('progressUpdated', handleProgressUpdate);
    }, [refreshDataWithProgress]);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const savedSessionJSON = localStorage.getItem(SESSION_STORAGE_KEY);
                if (!savedSessionJSON) return;
                const savedSession = JSON.parse(savedSessionJSON);
                const now = Date.now();
                if (savedSession.timestamp && now - savedSession.timestamp < 5000) {
                    if (savedSession.view === 'details' && savedSession.animeId) {
                        await handleSelectAnime({ anilistId: savedSession.animeId });
                    } else if (savedSession.view === 'player' && savedSession.animeId) {
                        try {
                            const animeForPlayer = await getAnimeDetails(savedSession.animeId);
                            handleWatchNow(animeForPlayer, savedSession.episode || 1);
                        } catch (error) {
                            console.error("Failed to fetch anime details for session restore:", error);
                            setView('home');
                        }
                    }
                } else {
                    localStorage.removeItem(SESSION_STORAGE_KEY);
                }
            } catch (error) {
                console.error("Failed to restore session:", error);
                localStorage.removeItem(SESSION_STORAGE_KEY);
            }
        };
        if (!showLanding) {
            restoreSession();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showLanding]);

    useEffect(() => {
        try {
            if (view === 'details' && selectedAnime) {
                const session = { view: 'details', animeId: selectedAnime.anilistId, timestamp: Date.now() };
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
            } else if (view === 'player' && playerState.anime) {
                const session = { view: 'player', animeId: playerState.anime.anilistId, episode: playerState.episode, timestamp: Date.now() };
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
            } else if (view === 'home') {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Failed to save session:", error);
        }
    }, [view, selectedAnime, playerState.anime, playerState.episode]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [{ trending, popular, topAiring, topRated, topUpcoming, popularThisSeason, currentSeason, currentYear }, genres, latest, schedules] = await Promise.all([
                    getHomePageData(),
                    getGenreCollection(),
                    getLatestEpisodes(),
                    getAiringSchedule()
                ]);
                setTrending(enrichAnimeWithProgress(applyOverridesToList(trending)));
                setPopular(enrichAnimeWithProgress(applyOverridesToList(popular)));
                setTopAiring(enrichAnimeWithProgress(applyOverridesToList(topAiring)));
                setTopRated(enrichAnimeWithProgress(applyOverridesToList(topRated)));
                setTopUpcoming(enrichAnimeWithProgress(applyOverridesToList(topUpcoming)));
                setPopularThisSeason(enrichAnimeWithProgress(applyOverridesToList(popularThisSeason)));
                setAllGenres(genres);
                setLatestEpisodes(enrichScheduleWithProgress(latest));
                setScheduleList(schedules);
                setCurrentSeason(currentSeason);
                setCurrentYear(currentYear);
            } catch (error) {
                console.error("Failed to fetch home page data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (view === 'home' && !showLanding) {
          fetchInitialData();
        }
    }, [applyOverridesToList, enrichAnimeWithProgress, enrichScheduleWithProgress, view, showLanding]);

    useEffect(() => {
        setTrending(applyOverridesToList);
        setPopular(applyOverridesToList);
        setTopAiring(applyOverridesToList);
        setTopRated(applyOverridesToList);
        setTopUpcoming(applyOverridesToList);
        setPopularThisSeason(applyOverridesToList);
        setSearchResults(applyOverridesToList);
        if (selectedAnime) {
            setSelectedAnime(applyOverrides);
        }
    }, [overrides, applyOverridesToList, applyOverrides, selectedAnime]);

    useEffect(() => {
        const loadContinueWatching = async () => {
            const progressData = progressTracker.getAllMediaData();
            const inProgress = Object.values(progressData)
                .filter(p => {
                    if (p.progress?.duration > 0) {
                        const percentage = (p.progress.watched / p.progress.duration) * 100;
                        return percentage < 95;
                    }
                    return true;
                })
                .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
            if (inProgress.length === 0) {
                setContinueWatching([]);
                return;
            }
            const ids = inProgress.map(p => p.id);
            const animeDetails = await getMultipleAnimeDetails(ids);
            const animeDetailsMap = new Map(animeDetails.map(a => [a.anilistId, a]));
            const sortedAnimeDetails = inProgress
                .map(p => animeDetailsMap.get(p.id))
                .filter((a): a is Anime => !!a)
                .filter(a => !a.genres.includes("Hentai") && !a.isAdult);
            const enrichedList = enrichAnimeWithProgress(applyOverridesToList(sortedAnimeDetails));
            setContinueWatching(enrichedList);
        };
        if (!showLanding) {
            loadContinueWatching();
        }
        window.addEventListener('progressUpdated', loadContinueWatching);
        return () => window.removeEventListener('progressUpdated', loadContinueWatching);
    }, [applyOverridesToList, enrichAnimeWithProgress, showLanding]);
    
    const debouncedFilters = useDebounce(filters, 500);

    useEffect(() => {
        if (!isDiscoveryView) {
            setSearchResults([]);
            setPageInfo(null);
            return;
        }
        const performSearch = async () => {
            setIsDiscoverLoading(true);
            try {
                const { results, pageInfo: newPageInfo } = await discoverAnime(debouncedFilters);
                setSearchResults(enrichAnimeWithProgress(applyOverridesToList(results)));
                setPageInfo(newPageInfo);
            } catch (error) {
                console.error("Failed to discover anime:", error);
                setSearchResults([]);
                setPageInfo(null);
            } finally {
                setIsDiscoverLoading(false);
            }
        };
        performSearch();
    }, [debouncedFilters, isDiscoveryView, applyOverridesToList, enrichAnimeWithProgress]);
    
    useEffect(() => {
        if (debouncedSuggestionsTerm.trim() === '') {
            setSearchSuggestions([]);
            return;
        }
        const fetchSuggestions = async () => {
            setIsSuggestionsLoading(true);
            try {
                const results = await getSearchSuggestions(debouncedSuggestionsTerm);
                setSearchSuggestions(results);
            } catch (error) {
                console.error("Failed to fetch search suggestions:", error);
            } finally {
                setIsSuggestionsLoading(false);
            }
        };
        fetchSuggestions();
    }, [debouncedSuggestionsTerm]);

    const handleRandomAnime = async () => {
        hideTooltip();
        setIsLoading(true);
        try {
            const randomAnime = await getRandomAnime();
            if (randomAnime) handleSelectAnime(randomAnime);
        } catch (error) {
            console.error("Failed to get random anime:", error);
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleSearchInputChange = (term: string) => setSearchTerm(term);

    const handleSearchSubmit = () => {
        hideTooltip();
        const termToSubmit = searchTerm.trim();
        if (termToSubmit === '') return;
        addSearchTermToHistory(termToSubmit);
        setFilters({ ...initialFilters, search: termToSubmit, page: 1 });
        setIsListView(false);
        setIsFullSearchView(true);
        setIsDiscoverViewForced(true);
        setView('home');
        setSearchTerm('');
        setSearchSuggestions([]);
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) activeElement.blur();
    };

    const handleSuggestionClick = (anime: { anilistId: number }) => {
        hideTooltip();
        setSearchTerm(''); 
        setFilters(initialFilters);
        setSearchSuggestions([]);
        handleSelectAnime(anime);
    };
    
    const handleContinueWatching = (anime: Anime) => {
        const progressData = progressTracker.getMediaData(anime.anilistId);
        if (!progressData) {
            handleWatchNow(anime, 1);
            return;
        }
        const lastEpisode = parseInt(progressData.last_episode_watched, 10) || 1;
        handleWatchNow(anime, lastEpisode);
    };

    const handleRemoveFromContinueWatching = (animeId: number) => progressTracker.removeFromHistory(animeId);

    const handleBackToDetails = () => {
        if (playerState.anime) {
            setSelectedAnime(playerState.anime);
            setIsBannerInView(true);
            setView('details');
        } else {
            setView('home');
        }
    };
    
    const handleBackFromDetails = () => {
        setSelectedAnime(null);
        setIsBannerInView(true);
        setView('home');
    };

    const handleGoToReport = () => {
        setView('report');
        window.scrollTo(0, 0);
    };

    const handleBackFromReport = () => {
        setView('player');
    };
    
    const handleGoToAppHome = () => {
        hideTooltip();
        setSearchTerm('');
        setFilters(initialFilters);
        setSearchResults([]);
        setPageInfo(null);
        setSelectedAnime(null);
        setIsBannerInView(true);
        setIsListView(false);
        setIsDiscoverViewForced(false);
        setIsFullSearchView(false);
        setDiscoverListTitle('');
        setView('home');
    };

    const handleLoginClick = () => {
        hideTooltip();
        setIsLoginModalOpen(true);
    };
    
    const handleOpenDiscoverView = () => {
        hideTooltip();
        setFilters(prev => ({ ...prev, search: '', page: 1 }));
        setIsListView(false);
        setIsFullSearchView(true);
        setIsDiscoverViewForced(true);
        setView('home');
        window.scrollTo(0, 0);
    };

    const handleViewMore = async (partialFilters: Partial<FilterState> & { list?: 'watchlist' | 'favorites' }, title: string) => {
        hideTooltip();
        setDiscoverListTitle(title);
        setIsFullSearchView(false);

        if (partialFilters.list) {
            setIsDiscoverLoading(true);
            setFilters({ ...initialFilters, page: 1 });
            setPageInfo(null);
            setIsListView(true);
            setView('home');
            window.scrollTo(0, 0);

            const ids = partialFilters.list === 'watchlist' ? watchlist : favorites;
            if (ids.length > 0) {
                const results = await getMultipleAnimeDetails(ids);
                setSearchResults(enrichAnimeWithProgress(applyOverridesToList(results)));
            } else {
                setSearchResults([]);
            }
            setIsDiscoverLoading(false);
        } else {
            setSearchTerm('');
            setFilters({ ...initialFilters, ...partialFilters, page: 1 });
            setIsListView(false);
            setIsDiscoverViewForced(true);
            setIsFullSearchView(false);
            setView('home');
            window.scrollTo(0, 0);
        }
    };

    const handleFilterBarChange = (newFilters: FilterState) => {
        if (!isFullSearchView) setIsFullSearchView(true);
        // Reset page to 1 on any filter change except pagination itself
        const hasFilterChanged = !isEqual(
            { ...filters, page: 1 }, 
            { ...newFilters, page: 1 }
        );
        setFilters(hasFilterChanged ? { ...newFilters, page: 1 } : newFilters);
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
        window.scrollTo(0, 0);
    };

    const latestEpisodesAsAnime = useMemo(() => latestEpisodes.map(schedule => ({
        anilistId: schedule.media.id,
        englishTitle: schedule.media.title.english || schedule.media.title.romaji,
        romajiTitle: schedule.media.title.romaji || schedule.media.title.english,
        coverImage: schedule.media.coverImage.extraLarge,
        isAdult: schedule.media.isAdult,
        episodes: schedule.episode,
        totalEpisodes: schedule.media.episodes || null,
        description: (schedule.media as any).description || '', 
        bannerImage: '', 
        genres: schedule.media.genres || [], 
        duration: null, 
        year: (schedule.media as any).seasonYear || 0,
        rating: 0, 
        status: 'RELEASING', 
        format: (schedule.media as any).format || '', 
        studios: [], 
        staff: [], 
        characters: [], 
        relations: [], 
        recommendations: [],
        progress: schedule.progress,
    })), [latestEpisodes]);
    
    const iconProps = { className: "h-7 w-7" };
    const smallIconProps = { className: "h-5 w-5 text-cyan-400" };

    const ContinueWatchingIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
    const TrendingIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.84 3.49a1 1 0 011.118 1.666l-2.863 4.312a1 1 0 00.325 1.488l4.463 2.231a1 1 0 01.554 1.326l-2.04 4.081a1 1 0 01-1.78-.9l1.297-2.592-3.125-1.562a3 3 0 01-.975-4.464L12.84 3.49zM6.86 3.49a1 1 0 011.118 1.666l-2.863 4.312a1 1 0 00.325 1.488l4.463 2.231a1 1 0 01.554 1.326l-2.04 4.081a1 1 0 01-1.78-.9l1.297-2.592-3.125-1.562a3 3 0 01-.975-4.464L6.86 3.49z" clipRule="evenodd" /></svg>;
    const LatestEpisodeIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 4a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm10 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
    const PopularIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M11 2a1 1 0 10-2 0v1a1 1 0 102 0V2zM5 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm3 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm-3 4a1 1 0 100 2h8a1 1 0 100-2H5z" /><path fillRule="evenodd" d="M3 5a3 3 0 013-3h8a3 3 0 013 3v12a1 1 0 11-2 0V5a1 1 0 00-1-1H6a1 1 0 00-1 1v12a1 1 0 11-2 0V5z" clipRule="evenodd" /></svg>;
    const UpcomingIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
    const SeasonIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1H3a1 1 0 000 2h1v1a1 1 0 001 1h12a1 1 0 001-1V6h1a1 1 0 100-2h-1V3a1 1 0 00-1-1H5zM4 9a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm2 3a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
    const AiringIcon = <svg {...smallIconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.99 2.05c.53 0 1.04 .08 1.54 .23l-1.28 1.28A5.95 5.95 0 004.28 7.5l-1.28 1.28A7.94 7.94 0 019.99 2.05zM2.06 9.99a7.94 7.94 0 016.71-7.71l-1.28 1.28A5.95 5.95 0 003.5 12.5l-1.28 1.28A7.94 7.94 0 012.06 10zM10 4a6 6 0 100 12 6 6 0 000-12zM10 14a4 4 0 110-8 4 4 0 010 8z" /></svg>;
    const RatedIcon = <svg {...smallIconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;

    const renderHomePage = () => {
        if (isDiscoveryView) {
            let title = '';
            if (showFilterBar) {
                if(filters.search) {
                    title = `Search results for: "${filters.search}"`;
                } else {
                    title = 'Filtered Results';
                }
            } else {
                title = discoverListTitle;
            }
            if (isListView) { // watchlist/favorites are special cases of list view
                title = discoverListTitle;
            }

            return (
                <main className="container mx-auto max-w-screen-2xl p-4 md:p-8">
                    {showFilterBar && (
                        <FilterBar
                            filters={filters}
                            onFiltersChange={handleFilterBarChange}
                            allGenres={allGenres}
                            onReset={() => setFilters(initialFilters)}
                        />
                    )}
                    <AnimeGrid
                        title={title}
                        resultsCount={isListView ? searchResults.length : pageInfo?.total}
                        animeList={searchResults}
                        onSelectAnime={handleSelectAnime}
                        isLoading={isDiscoverLoading}
                        onBackClick={handleGoToAppHome}
                    />
                    {pageInfo && pageInfo.lastPage > 1 && !isDiscoverLoading && (
                        <Pagination
                            currentPage={pageInfo.currentPage}
                            totalPages={pageInfo.lastPage}
                            onPageChange={handlePageChange}
                        />
                    )}
                </main>
            );
        }

        return (
            <main>
                <Hero animes={trending} onWatchNow={handleWatchNow} onDetails={handleSelectAnime} onBannerChange={setHeroBannerUrl} setInView={setIsBannerInView} />
                <div className="container mx-auto max-w-screen-2xl p-4 md:p-8">
                    {continueWatching.length > 0 && (
                        <div className="mb-12">
                            <AnimeCarousel 
                                title="Continue Watching"
                                icon={ContinueWatchingIcon}
                                animeList={continueWatching} 
                                onSelectAnime={handleContinueWatching}
                                showRank={false}
                                onRemoveItem={handleRemoveFromContinueWatching}
                            />
                        </div>
                    )}
                    <div className="mb-4">
                        <AnimeCarousel 
                            title="Trending" 
                            icon={TrendingIcon}
                            animeList={trending} 
                            onSelectAnime={handleSelectAnime}
                            onViewMore={() => handleViewMore({ sort: MediaSort.TRENDING_DESC }, "Trending Anime")}
                        />
                    </div>
                </div>

                <div className="container mx-auto max-w-screen-2xl p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 flex flex-col gap-12">
                             <AnimeCarousel
                                title="Latest Episodes"
                                icon={LatestEpisodeIcon}
                                animeList={latestEpisodesAsAnime}
                                onSelectAnime={handleSelectAnime}
                                onViewMore={() => handleViewMore({ statuses: [MediaStatus.RELEASING], sort: MediaSort.TRENDING_DESC }, "Recently Released Anime")}
                                showRank={false}
                                cardSize="small"
                            />
                            <AnimeCarousel 
                                title="All Time Popular"
                                icon={PopularIcon}
                                animeList={popular}
                                onSelectAnime={handleSelectAnime}
                                onViewMore={() => handleViewMore({ sort: MediaSort.POPULARITY_DESC }, "All Time Popular Anime")}
                                showRank={false}
                            />
                            <AnimeCarousel 
                                title="Top Upcoming" 
                                icon={UpcomingIcon}
                                animeList={topUpcoming} 
                                onSelectAnime={handleSelectAnime}
                                showRank={false}
                                onViewMore={() => handleViewMore({ statuses: [MediaStatus.NOT_YET_RELEASED], sort: MediaSort.POPULARITY_DESC }, "Top Upcoming Anime")}
                                cardSize="small"
                            />
                            <div className="mt-4">
                                <AnimeCarousel 
                                    title="Popular This Season"
                                    icon={SeasonIcon}
                                    animeList={popularThisSeason} 
                                    onSelectAnime={handleSelectAnime}
                                    showRank={false}
                                    onViewMore={() => handleViewMore({ season: currentSeason!, year: String(currentYear!), sort: MediaSort.POPULARITY_DESC }, "Popular This Season")}
                                    cardSize="small"
                                />
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="flex flex-col gap-8">
                                <VerticalAnimeList 
                                    title="Top Airing" 
                                    animeList={topAiring} 
                                    onSelectAnime={handleSelectAnime}
                                    onViewMore={() => handleViewMore({ statuses: [MediaStatus.RELEASING], sort: MediaSort.POPULARITY_DESC }, "Top Airing Anime")}
                                    icon={AiringIcon}
                                    showRank={true}
                                />
                                <VerticalAnimeList 
                                    title="Top Rated" 
                                    animeList={topRated} 
                                    onSelectAnime={handleSelectAnime}
                                    onViewMore={() => handleViewMore({ sort: MediaSort.SCORE_DESC }, "Top Rated Anime")}
                                    icon={RatedIcon}
                                    showRank={true}
                                />
                            </div>
                        </div>
                    </div>
                                        
                    <div className="mt-16">
                        {isScheduleVisible ? (
                            <Suspense fallback={<FullPageSpinner />}>
                                <SchedulePage 
                                    schedule={scheduleList}
                                    onSelectAnime={handleSelectAnime} 
                                    onClose={() => setIsScheduleVisible(false)}
                                />
                            </Suspense>
                        ) : (
                            <SchedulePreview 
                                schedule={scheduleList}
                                onSelectAnime={handleSelectAnime}
                                onShowMore={() => setIsScheduleVisible(true)}
                            />
                        )}
                    </div>
                </div>
            </main>
        );
    };

    const renderContent = () => {
        let content;
        switch(view) {
            case 'report':
                content = <ReportPage onBack={handleBackFromReport} />;
                break;
            case 'player':
                content = <AnimePlayer
                    anime={playerState.anime!}
                    currentEpisode={playerState.episode}
                    currentSource={playerState.source}
                    currentLanguage={playerState.language}
                    onEpisodeChange={(ep) => setPlayerState(prev => ({...prev, episode: ep}))}
                    onSourceChange={handleSourceChange}
                    onLanguageChange={handleLanguageChange}
                    onBack={handleBackToDetails}
                    onSelectRecommended={handleSelectAnime}
                    onSelectRelated={handleSelectAnime}
                    onReportIssue={handleGoToReport}
                    topAiring={topAiring}
                />;
                break;
            case 'details':
                if (isLoading) {
                    content = <AnimeDetailPageSkeleton />;
                } else if (selectedAnime) {
                    content = <AnimeDetailPage 
                        anime={selectedAnime}
                        onWatchNow={handleWatchNow}
                        onBack={handleBackFromDetails}
                        onSelectRelated={(id) => handleSelectAnime({anilistId: id})}
                        setInView={setIsBannerInView}
                    />;
                }
                break;
            case 'home':
            default:
                if (isLoading && trending.length === 0 && !isDiscoveryView) {
                    content = <HomePageSkeleton />;
                } else {
                    content = renderHomePage();
                }
                break;
        }
        return <div key={view} className="animate-page-fade-in">{content}</div>;
    };
    
    if (showLanding) {
        return <Suspense fallback={<FullPageSpinner />}><LandingPage onEnter={handleEnterApp} onLogoClick={handleGoToLanding} onNavigate={handleViewMore} /></Suspense>;
    }

    return (
        <div className="bg-gray-950 min-h-screen">
            {/* Background Elements */}
            <div aria-hidden="true" className="fixed inset-0 z-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(34, 211, 238, 0.3), transparent 60%), radial-gradient(circle at bottom left, rgba(8, 145, 178, 0.3), transparent 60%)' }}></div>
            <div aria-hidden="true" className="fixed inset-0 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="relative z-10">
                 <TooltipProvider onDetails={handleSelectAnime} onWatchNow={handleWatchNow}>
                    <Header 
                        onSearch={handleSearchInputChange} 
                        onHomeClick={handleGoToAppHome}
                        onLogoClick={handleGoToAppHome}
                        onMenuClick={() => setIsSidebarOpen(true)} 
                        onFilterClick={handleOpenDiscoverView}
                        onRandomAnime={handleRandomAnime}
                        onLoginClick={handleLoginClick} 
                        onSearchSubmit={handleSearchSubmit}
                        searchTerm={searchTerm} 
                        suggestions={searchSuggestions}
                        onSuggestionClick={handleSuggestionClick}
                        isSuggestionsLoading={isSuggestionsLoading}
                        onNavigate={handleViewMore}
                        isBannerInView={isBannerInView}
                    />
                    <Sidebar 
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        onNavigate={handleViewMore}
                        onHomeClick={handleGoToAppHome}
                        onScheduleClick={() => { hideTooltip(); setIsScheduleVisible(true); handleGoToAppHome(); setIsSidebarOpen(false); }}
                        onLoginClick={() => { handleLoginClick(); setIsSidebarOpen(false); }}
                        allGenres={allGenres}
                        isHome={view === 'home' && !isDiscoveryView}
                    />
                    <Suspense fallback={<FullPageSpinner />}>
                        {renderContent()}
                    </Suspense>
                    <Footer onAdminClick={() => setIsAdminModalOpen(true)} onNavigate={handleViewMore} onLogoClick={handleGoToLanding} isDataSaverActive={isDataSaverActive} />
                    <BackToTopButton />

                    <Suspense fallback={null}>
                        {isAdminModalOpen && <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />}
                        {isLoginModalOpen && <InfoModal 
                            isOpen={isLoginModalOpen}
                            onClose={() => setIsLoginModalOpen(false)}
                            title="Login"
                        >
                            <div className="space-y-4">
                                <p className="text-center text-sm bg-yellow-900/50 text-yellow-300 p-2 rounded-md">
                                    This is a demonstration UI. The login feature is not implemented yet but will be available soon.
                                </p>
                                <div>
                                    <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="username">Username</label>
                                    <input
                                        id="username"
                                        type="text"
                                        placeholder="demouser"
                                        className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="password">Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <button type="submit" disabled className="w-full bg-cyan-700 text-white/50 font-bold py-2 px-4 rounded cursor-not-allowed">
                                    Login
                                </button>
                            </div>
                        </InfoModal>}
                    </Suspense>
                </TooltipProvider>
            </div>
        </div>
    );
};

const App: React.FC = () => (
    <AdminProvider>
        <TitleLanguageProvider>
            <UserDataProvider>
                <DataSaverProvider>
                    <AppContent />
                </DataSaverProvider>
            </UserDataProvider>
        </TitleLanguageProvider>
    </AdminProvider>
);

export default App;