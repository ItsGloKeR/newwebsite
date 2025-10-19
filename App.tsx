import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Anime, StreamSource, StreamLanguage, SearchSuggestion, FilterState, MediaSort, AiringSchedule, MediaStatus, MediaSeason, EnrichedAiringSchedule } from './types';
import { getHomePageData, getAnimeDetails, getGenreCollection, getSearchSuggestions, discoverAnime, getLatestEpisodes, getMultipleAnimeDetails, getRandomAnime } from './services/anilistService';
import Header from './components/Header';
import Hero from './components/Hero';
import AnimeCarousel from './components/AnimeCarousel';
import AnimeGrid from './components/AnimeGrid';
import AnimeDetailPage from './components/AnimeDetailPage';
import AnimePlayer from './components/AnimePlayer';
import LoadingSpinner from './components/LoadingSpinner';
import Footer from './components/Footer';
import BackToTopButton from './components/BackToTopButton';
import SchedulePage from './components/SchedulePage';
import VerticalAnimeList from './components/VerticalAnimeList';
import AdminModal from './components/AdminModal';
import FilterModal from './components/FilterModal';
import InfoModal from './components/InfoModal';
import { useDebounce } from './hooks/useDebounce';
import { initialTrending, initialPopular, initialTopAiring } from './static/initialData';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { TitleLanguageProvider } from './contexts/TitleLanguageContext';
import isEqual from 'lodash.isequal';
import HomePageSkeleton from './components/HomePageSkeleton';
import { progressTracker } from './utils/progressTracking';

type View = 'home' | 'details' | 'player';

const initialFilters: FilterState = {
    genres: [],
    year: '',
    season: undefined,
    formats: [],
    statuses: [],
    sort: MediaSort.POPULARITY_DESC,
};

const AppContent: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [trending, setTrending] = useState<Anime[]>(initialTrending);
    const [popular, setPopular] = useState<Anime[]>(initialPopular);
    const [topAiring, setTopAiring] = useState<Anime[]>(initialTopAiring);
    const [topRated, setTopRated] = useState<Anime[]>([]);
    const [topUpcoming, setTopUpcoming] = useState<Anime[]>([]);
    const [popularThisSeason, setPopularThisSeason] = useState<Anime[]>([]);
    const [latestEpisodes, setLatestEpisodes] = useState<EnrichedAiringSchedule[]>([]);
    const [searchResults, setSearchResults] = useState<Anime[]>([]);
    const [allGenres, setAllGenres] = useState<string[]>([]);
    const [continueWatching, setContinueWatching] = useState<Anime[]>([]);
    
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
    const [discoveryTitle, setDiscoveryTitle] = useState('Filtered Results');
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [currentSeason, setCurrentSeason] = useState<MediaSeason | null>(null);
    const [currentYear, setCurrentYear] = useState<number | null>(null);
    const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);
    const [isBannerInView, setIsBannerInView] = useState(true);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const debouncedSuggestionsTerm = useDebounce(searchTerm, 300);
    const { overrides } = useAdmin();

    const isDiscoveryView = useMemo(() => {
        return debouncedSearchTerm.trim() !== '' || !isEqual(filters, initialFilters);
    }, [debouncedSearchTerm, filters]);

    const applyOverrides = useCallback((anime: Anime): Anime => {
        if (!anime) return anime;
        const overriddenTitle = overrides.anime[anime.anilistId]?.title;
        // The title override is just for the english title for simplicity in admin panel
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
    
    // Initialize tracker and listen for progress updates
    useEffect(() => {
        progressTracker.init();
        
        const handleProgressUpdate = () => {
            refreshDataWithProgress();
        };

        window.addEventListener('progressUpdated', handleProgressUpdate);
        return () => {
            window.removeEventListener('progressUpdated', handleProgressUpdate);
        };
    }, [refreshDataWithProgress]);


    // Fetch initial data for the home page
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [{ trending, popular, topAiring, topRated, topUpcoming, popularThisSeason, currentSeason, currentYear }, genres, latest] = await Promise.all([
                    getHomePageData(),
                    getGenreCollection(),
                    getLatestEpisodes(),
                ]);
                setTrending(enrichAnimeWithProgress(applyOverridesToList(trending)));
                setPopular(enrichAnimeWithProgress(applyOverridesToList(popular)));
                setTopAiring(enrichAnimeWithProgress(applyOverridesToList(topAiring)));
                setTopRated(enrichAnimeWithProgress(applyOverridesToList(topRated)));
                setTopUpcoming(enrichAnimeWithProgress(applyOverridesToList(topUpcoming)));
                setPopularThisSeason(enrichAnimeWithProgress(applyOverridesToList(popularThisSeason)));
                setAllGenres(genres);
                setLatestEpisodes(enrichScheduleWithProgress(latest));
                setCurrentSeason(currentSeason);
                setCurrentYear(currentYear);
            } catch (error) {
                console.error("Failed to fetch home page data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [applyOverridesToList, enrichAnimeWithProgress, enrichScheduleWithProgress]);

    // Re-apply overrides if they change
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

    // Load Continue Watching list
    useEffect(() => {
        const loadContinueWatching = async () => {
            const progressData = progressTracker.getAllMediaData();
            
            const inProgress = Object.values(progressData)
                .filter(p => {
                    if (p.progress?.duration > 0) {
                        const percentage = (p.progress.watched / p.progress.duration) * 100;
                        return percentage < 95; // Only show items that are not completed
                    }
                    return true; // Show items that haven't started playing yet
                })
                .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

            if (inProgress.length === 0) {
                setContinueWatching([]);
                return;
            }

            const ids = inProgress.map(p => p.id);
            const animeDetails = await getMultipleAnimeDetails(ids);
            
            // Create a map for quick lookup
            const animeDetailsMap = new Map(animeDetails.map(a => [a.anilistId, a]));

            // Re-sort based on the sorted `inProgress` list and enrich data
            const sortedAnimeDetails = inProgress
                .map(p => animeDetailsMap.get(p.id))
                .filter((a): a is Anime => !!a); // Filter out any anime that failed to fetch

            const enrichedList = enrichAnimeWithProgress(applyOverridesToList(sortedAnimeDetails));
            
            setContinueWatching(enrichedList);
        };

        loadContinueWatching();

        window.addEventListener('progressUpdated', loadContinueWatching);
        return () => {
            window.removeEventListener('progressUpdated', loadContinueWatching);
        };
    }, [applyOverridesToList, enrichAnimeWithProgress]);


    // Perform discovery search when term or filters change
    useEffect(() => {
        if (!isDiscoveryView) {
            setSearchResults([]);
            return;
        }

        const performSearch = async () => {
            setIsDiscoverLoading(true);
            try {
                const results = await discoverAnime(debouncedSearchTerm, filters);
                setSearchResults(enrichAnimeWithProgress(applyOverridesToList(results)));
            } catch (error) {
                console.error("Failed to discover anime:", error);
            } finally {
                setIsDiscoverLoading(false);
            }
        };
        performSearch();
    }, [debouncedSearchTerm, filters, isDiscoveryView, applyOverridesToList, enrichAnimeWithProgress]);
    
    // Perform search for suggestions
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

    // Handlers
    const handleSelectAnime = async (anime: Anime | { anilistId: number }) => {
        setIsLoading(true);
        setIsBannerInView(true); // Reset for new page view
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
            setSelectedAnime(null); // Reset on error
            setView('home'); // Go back home
        } finally {
            setIsLoading(false);
        }
    };

    const handleRandomAnime = async () => {
        setIsLoading(true);
        try {
            const randomAnime = await getRandomAnime();
            if (randomAnime) {
                handleSelectAnime(randomAnime);
            }
        } catch (error) {
            console.error("Failed to get random anime:", error);
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setDiscoveryTitle(`Results for "${term}"`);
        setView('home'); // Switch to home view to show search results
    };

    const handleSuggestionClick = (anime: { anilistId: number }) => {
        setSearchTerm(''); 
        setSearchSuggestions([]);
        handleSelectAnime(anime);
    };

    const handleWatchNow = (anime: Anime, episode = 1) => {
        progressTracker.addToHistory(anime);
        // Clear previous anime to ensure loading state triggers, then fetch full details
        setPlayerState({ anime: null, episode, source: StreamSource.AnimePahe, language: StreamLanguage.Sub });
        setView('player');

        const fetchForPlayer = async () => {
            setIsLoading(true);
            window.scrollTo(0, 0);
            try {
                const fullDetails = await getAnimeDetails(anime.anilistId);
                setPlayerState(prev => ({
                    ...prev,
                    anime: applyOverrides(fullDetails),
                }));
            } catch (error) {
                console.error("Failed to get anime details for player:", error);
                setView('home'); // Fallback to home on error
            } finally {
                setIsLoading(false);
            }
        };
        fetchForPlayer();
    };
    
    const handleContinueWatching = (anime: Anime) => {
        const progressData = progressTracker.getMediaData(anime.anilistId);
        if (!progressData) {
            handleWatchNow(anime, 1); // Fallback to ep 1
            return;
        }
        const lastEpisode = parseInt(progressData.last_episode_watched, 10) || 1;
        handleWatchNow(anime, lastEpisode);
    };

    const handleRemoveFromContinueWatching = (animeId: number) => {
        progressTracker.removeFromHistory(animeId);
    };

    const handleBackToDetails = () => {
        if (playerState.anime) {
            setSelectedAnime(playerState.anime); // We already have full details
            setIsBannerInView(true); // Reset banner state for details page
            setView('details');
        } else {
            setView('home'); // Fallback
        }
    };
    
    const handleBackFromDetails = () => {
        setSelectedAnime(null);
        setIsBannerInView(true); // Reset for new page view
        setView('home');
    };
    
    const handleHomeClick = () => {
        setSearchTerm('');
        setFilters(initialFilters);
        setSearchResults([]);
        setSelectedAnime(null);
        setIsBannerInView(true); // Reset for new page view
        setView('home');
    };

    const handleLoginClick = () => {
        setIsLoginModalOpen(true);
    };

    const handleApplyFilters = (newFilters: FilterState) => {
        setIsFilterModalOpen(false);
        setFilters(newFilters);
        setDiscoveryTitle("Filtered Results");
        setView('home');
    };

    const handleViewMore = (partialFilters: Partial<FilterState>, title: string) => {
        setSearchTerm('');
        setFilters({ ...initialFilters, ...partialFilters });
        setDiscoveryTitle(title);
        setView('home');
        window.scrollTo(0, 0);
    };

    const generateDiscoveryTitle = () => {
        if (debouncedSearchTerm.trim()) {
            return `Results for "${debouncedSearchTerm}"`;
        }
        return discoveryTitle;
    };

    const iconProps = { className: "h-7 w-7" };
    const smallIconProps = { className: "h-5 w-5 text-cyan-400" };

    const ContinueWatchingIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
    const TrendingIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.84 3.49a1 1 0 011.118 1.666l-2.863 4.312a1 1 0 00.325 1.488l4.463 2.231a1 1 0 01.554 1.326l-2.04 4.081a1 1 0 01-1.78-.9l1.297-2.592-3.125-1.562a3 3 0 01-.975-4.464L12.84 3.49zM6.86 3.49a1 1 0 011.118 1.666l-2.863 4.312a1 1 0 00.325 1.488l4.463 2.231a1 1 0 01.554 1.326l-2.04 4.081a1 1 0 01-1.78-.9l1.297-2.592-3.125-1.562a3 3 0 01-.975-4.464L6.86 3.49z" clipRule="evenodd" /></svg>;
    const LatestIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 4a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm10 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
    const PopularIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M11 2a1 1 0 10-2 0v1a1 1 0 102 0V2zM5 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm3 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm-3 4a1 1 0 100 2h8a1 1 0 100-2H5z" /><path fillRule="evenodd" d="M3 5a3 3 0 013-3h8a3 3 0 013 3v12a1 1 0 11-2 0V5a1 1 0 00-1-1H6a1 1 0 00-1 1v12a1 1 0 11-2 0V5z" clipRule="evenodd" /></svg>;
    const UpcomingIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
    const SeasonIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1H3a1 1 0 000 2h1v1a1 1 0 001 1h12a1 1 0 001-1V6h1a1 1 0 100-2h-1V3a1 1 0 00-1-1H5zM4 9a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm2 3a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
    const AiringIcon = <svg {...smallIconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.99 2.05c.53 0 1.04.08 1.54.23l-1.28 1.28A5.95 5.95 0 004.28 7.5l-1.28 1.28A7.94 7.94 0 019.99 2.05zM2.06 9.99a7.94 7.94 0 016.71-7.71l-1.28 1.28A5.95 5.95 0 003.5 12.5l-1.28 1.28A7.94 7.94 0 012.06 10zM10 4a6 6 0 100 12 6 6 0 000-12zM10 14a4 4 0 110-8 4 4 0 010 8z" /></svg>;
    const RatedIcon = <svg {...smallIconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
    const FilterIcon = <svg {...iconProps} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>;

    const renderHomePage = () => {
        if (isDiscoveryView) {
            return (
                <main className="container mx-auto p-4 md:p-8">
                    <AnimeGrid
                        title={generateDiscoveryTitle()}
                        icon={FilterIcon}
                        animeList={searchResults}
                        onSelectAnime={handleSelectAnime}
                        isLoading={isDiscoverLoading}
                    />
                </main>
            );
        }

        return (
            <main>
                <Hero animes={trending} onWatchNow={handleWatchNow} onDetails={handleSelectAnime} onBannerChange={setHeroBannerUrl} setInView={setIsBannerInView} />
                <div className="container mx-auto p-4 md:p-8">
                    {/* Full-width sections */}
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
                    <div className="mb-12">
                        <AnimeCarousel 
                            title="Trending" 
                            icon={TrendingIcon}
                            animeList={trending} 
                            onSelectAnime={handleSelectAnime}
                            onViewMore={() => handleViewMore({ sort: MediaSort.TRENDING_DESC }, "Trending Anime")}
                        />
                    </div>

                    {/* Left/Right Column Section */}
                    <div className="mb-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 flex flex-col gap-12">
                            <AnimeCarousel
                                title="Latest Episodes"
                                icon={LatestIcon}
                                animeList={latestEpisodes.map(schedule => ({
                                    anilistId: schedule.media.id,
                                    englishTitle: schedule.media.title.english || schedule.media.title.romaji,
                                    romajiTitle: schedule.media.title.romaji || schedule.media.title.english,
                                    coverImage: schedule.media.coverImage.extraLarge,
                                    episodes: schedule.episode,
                                    isAdult: schedule.media.isAdult,
                                    progress: schedule.progress || 0,
                                    description: '',
                                    bannerImage: '',
                                    genres: [],
                                    year: 0,
                                    rating: 0,
                                    duration: null,
                                    status: '',
                                    studios: [],
                                    staff: [],
                                    relations: [],
                                    format: '',
                                } as Anime))}
                                onSelectAnime={handleSelectAnime}
                                showRank={false}
                                onViewMore={() => handleViewMore({ statuses: [MediaStatus.RELEASING], sort: MediaSort.TRENDING_DESC }, "Recently Released Anime")}
                                cardSize="small"
                            />
                            <AnimeCarousel 
                                title="All Time Popular" 
                                icon={PopularIcon}
                                animeList={popular} 
                                onSelectAnime={handleSelectAnime}
                                onViewMore={() => handleViewMore({ sort: MediaSort.POPULARITY_DESC }, "All Time Popular Anime")}
                                showRank={false}
                                cardSize="small"
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
                        <div className="lg:col-span-1">
                            <div className="flex flex-col gap-8">
                                <VerticalAnimeList 
                                    title="Top Airing" 
                                    animeList={topAiring} 
                                    onSelectAnime={handleSelectAnime}
                                    onViewMore={() => handleViewMore({ statuses: [MediaStatus.RELEASING], sort: MediaSort.POPULARITY_DESC }, "Top Airing Anime")}
                                    icon={AiringIcon}
                                />
                                <VerticalAnimeList 
                                    title="Top Rated" 
                                    animeList={topRated} 
                                    onSelectAnime={handleSelectAnime}
                                    onViewMore={() => handleViewMore({ sort: MediaSort.SCORE_DESC }, "Top Rated Anime")}
                                    icon={RatedIcon}
                                />
                            </div>
                        </div>
                    </div>
                                        
                    <SchedulePage onSelectAnime={handleSelectAnime} />
                </div>
            </main>
        );
    };

    const renderContent = () => {
        switch(view) {
            case 'player':
                 if (isLoading || !playerState.anime) {
                    return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
                }
                return <AnimePlayer
                    anime={playerState.anime}
                    currentEpisode={playerState.episode}
                    currentSource={playerState.source}
                    currentLanguage={playerState.language}
                    onEpisodeChange={(ep) => setPlayerState(prev => ({...prev, episode: ep}))}
                    onSourceChange={(src) => setPlayerState(prev => ({...prev, source: src}))}
                    onLanguageChange={(lang) => setPlayerState(prev => ({...prev, language: lang}))}
                    onBack={handleBackToDetails}
                    onSelectRecommended={handleSelectAnime}
                    onSelectRelated={handleSelectAnime}
                />;
            
            case 'details':
                return isLoading 
                    ? <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>
                    : selectedAnime && <AnimeDetailPage 
                        anime={selectedAnime}
                        onWatchNow={handleWatchNow}
                        onBack={handleBackFromDetails}
                        onSelectRelated={(id) => handleSelectAnime({anilistId: id})}
                        setInView={setIsBannerInView}
                    />;
            
            case 'home':
            default:
                if (isLoading && trending.length === 0) {
                    return <HomePageSkeleton />;
                }
                return renderHomePage();
        }
    };

    return (
        <div className="bg-gray-950 min-h-screen">
            <Header 
                onSearch={handleSearch} 
                onHomeClick={handleHomeClick} 
                onFilterClick={() => setIsFilterModalOpen(true)}
                onRandomAnime={handleRandomAnime}
                onLoginClick={handleLoginClick} 
                searchTerm={searchTerm} 
                suggestions={searchSuggestions}
                onSuggestionClick={handleSuggestionClick}
                isSuggestionsLoading={isSuggestionsLoading}
                onNavigate={handleViewMore}
                isBannerInView={isBannerInView}
            />
            {renderContent()}
            <Footer onAdminClick={() => setIsAdminModalOpen(true)} onNavigate={handleViewMore} />
            <BackToTopButton />
            <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
            <FilterModal 
                isOpen={isFilterModalOpen} 
                onClose={() => setIsFilterModalOpen(false)} 
                allGenres={allGenres} 
                onApply={handleApplyFilters}
                currentFilters={filters}
                initialFilters={initialFilters}
            />
            <InfoModal 
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                title="Feature Not Available"
            >
                <p>The login and user account feature is not yet implemented. We're working hard to bring this to you soon. Stay tuned!</p>
            </InfoModal>
        </div>
    );
};

const App: React.FC = () => (
    <AdminProvider>
        <TitleLanguageProvider>
           <AppContent />
        </TitleLanguageProvider>
    </AdminProvider>
);

export default App;