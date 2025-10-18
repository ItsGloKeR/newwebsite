import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Anime, StreamSource, StreamLanguage, SearchSuggestion, FilterState, MediaSort, AiringSchedule, MediaStatus, MediaSeason, EnrichedAiringSchedule } from './types';
import { getHomePageData, getAnimeDetails, getGenreCollection, getSearchSuggestions, discoverAnime, getLatestEpisodes, getMultipleAnimeDetails, getContinueWatchingList, getPlanToWatchList } from './services/anilistService';
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
import PlanToWatchPage from './components/PlanToWatchPage';
import { useDebounce } from './hooks/useDebounce';
import { initialTrending, initialPopular, initialTopAiring } from './static/initialData';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import isEqual from 'lodash.isequal';
import HomePageSkeleton from './components/HomePageSkeleton';
import LatestEpisodeGrid from './components/LatestEpisodeGrid';
import { progressTracker } from './utils/progressTracking';


type View = 'home' | 'details' | 'player' | 'planToWatch';

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
    const [topUpcoming, setTopUpcoming] = useState<Anime[]>([]);
    const [popularThisSeason, setPopularThisSeason] = useState<Anime[]>([]);
    const [latestEpisodes, setLatestEpisodes] = useState<EnrichedAiringSchedule[]>([]);
    const [searchResults, setSearchResults] = useState<Anime[]>([]);
    const [allGenres, setAllGenres] = useState<string[]>([]);
    const [continueWatching, setContinueWatching] = useState<Anime[]>([]);
    const [planToWatchList, setPlanToWatchList] = useState<Anime[]>([]);
    
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
    const [playerState, setPlayerState] = useState({
        anime: null as Anime | null,
        episode: 1,
        source: StreamSource.AnimePahe,
        language: StreamLanguage.Sub,
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
    const [isPlanToWatchLoading, setIsPlanToWatchLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [discoveryTitle, setDiscoveryTitle] = useState('Filtered Results');
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [currentSeason, setCurrentSeason] = useState<MediaSeason | null>(null);
    const [currentYear, setCurrentYear] = useState<number | null>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const debouncedSuggestionsTerm = useDebounce(searchTerm, 300);
    const { overrides } = useAdmin();
    const { user, token, handleRedirect } = useAuth();

    // Handle OAuth redirect from AniList on initial load
    useEffect(() => {
        handleRedirect();
    }, [handleRedirect]);

    const isDiscoveryView = useMemo(() => {
        return debouncedSearchTerm.trim() !== '' || !isEqual(filters, initialFilters);
    }, [debouncedSearchTerm, filters]);

    const applyOverrides = useCallback((anime: Anime): Anime => {
        if (!anime) return anime;
        const overriddenTitle = overrides.anime[anime.anilistId]?.title;
        return overriddenTitle ? { ...anime, title: overriddenTitle } : anime;
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
                const [{ trending, popular, topAiring, topUpcoming, popularThisSeason, currentSeason, currentYear }, genres, latest] = await Promise.all([
                    getHomePageData(),
                    getGenreCollection(),
                    getLatestEpisodes(),
                ]);
                setTrending(enrichAnimeWithProgress(applyOverridesToList(trending)));
                setPopular(enrichAnimeWithProgress(applyOverridesToList(popular)));
                setTopAiring(enrichAnimeWithProgress(applyOverridesToList(topAiring)));
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
        setTopUpcoming(applyOverridesToList);
        setPopularThisSeason(applyOverridesToList);
        setSearchResults(applyOverridesToList);
        if (selectedAnime) {
            setSelectedAnime(applyOverrides);
        }
    }, [overrides, applyOverridesToList, applyOverrides, selectedAnime]);

    // Load Continue Watching list from AniList or local storage
    useEffect(() => {
        const loadContinueWatching = async () => {
            if (user && token) {
                // User is logged in, fetch from their AniList account
                const anilistWatching = await getContinueWatchingList(user.id, token);
                const updatedList = applyOverridesToList(anilistWatching);
                if (!isEqual(updatedList, continueWatching)) {
                    setContinueWatching(updatedList);
                }
            } else {
                // Fallback to local storage for logged-out users
                const progressData = progressTracker.getAllMediaData();
                const inProgress = Object.values(progressData).filter(p => {
                    if (!p.progress || !p.progress.duration) return false;
                    const percentage = (p.progress.watched / p.progress.duration) * 100;
                    return p.progress.watched > 30 && percentage < 95;
                });

                if (inProgress.length === 0) {
                    if (continueWatching.length > 0) setContinueWatching([]);
                    return;
                }

                const ids = inProgress.map(p => p.id);
                const animeDetails = await getMultipleAnimeDetails(ids);
                
                const enrichedList = enrichAnimeWithProgress(applyOverridesToList(animeDetails));
                
                if (!isEqual(enrichedList, continueWatching)) {
                    setContinueWatching(enrichedList);
                }
            }
        };

        loadContinueWatching();
        
        // This listener is mostly for local progress, but we'll re-check everything on update
        window.addEventListener('progressUpdated', loadContinueWatching);
        return () => {
            window.removeEventListener('progressUpdated', loadContinueWatching);
        };
    }, [user, token, applyOverridesToList, enrichAnimeWithProgress, continueWatching]);


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

    // Fetch Plan to Watch list when view is opened
    useEffect(() => {
        if (view === 'planToWatch' && user && token) {
            setIsPlanToWatchLoading(true);
            getPlanToWatchList(user.id, token)
                .then(list => setPlanToWatchList(enrichAnimeWithProgress(applyOverridesToList(list))))
                .catch(error => console.error("Failed to fetch Plan to Watch list:", error))
                .finally(() => setIsPlanToWatchLoading(false));
        }
    }, [view, user, token, enrichAnimeWithProgress, applyOverridesToList]);


    // Handlers
    const handleSelectAnime = async (anime: Anime | { anilistId: number }) => {
        setIsLoading(true);
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


    const handleBackToDetails = () => {
        if (playerState.anime) {
            setSelectedAnime(playerState.anime); // We already have full details
            setView('details');
        } else {
            setView('home'); // Fallback
        }
    };
    
    const handleBackFromDetails = () => {
        setSelectedAnime(null);
        setView('home');
    };
    
    const handleHomeClick = () => {
        setSearchTerm('');
        setFilters(initialFilters);
        setSearchResults([]);
        setSelectedAnime(null);
        setView('home');
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

    const handlePlanToWatchClick = () => {
        if (!user) return;
        setView('planToWatch');
        window.scrollTo(0, 0);
    };

    const generateDiscoveryTitle = () => {
        if (debouncedSearchTerm.trim()) {
            return `Results for "${debouncedSearchTerm}"`;
        }
        return discoveryTitle;
    };

    const renderHomePage = () => {
        if (isDiscoveryView) {
            return (
                <main className="container mx-auto p-4 md:p-8">
                    <AnimeGrid
                        title={generateDiscoveryTitle()}
                        animeList={searchResults}
                        onSelectAnime={handleSelectAnime}
                        isLoading={isDiscoverLoading}
                    />
                </main>
            );
        }

        return (
            <main>
                <Hero animes={trending} onWatchNow={handleWatchNow} onDetails={handleSelectAnime} />
                <div className="container mx-auto p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3">
                             {continueWatching.length > 0 && (
                                <AnimeCarousel 
                                    title="Continue Watching" 
                                    animeList={continueWatching} 
                                    onSelectAnime={handleContinueWatching}
                                    showRank={false}
                                />
                            )}
                            <AnimeCarousel 
                                title="Trending Now" 
                                animeList={trending} 
                                onSelectAnime={handleSelectAnime}
                                onViewMore={() => handleViewMore({ sort: MediaSort.TRENDING_DESC }, "Trending Anime")}
                            />
                            <LatestEpisodeGrid 
                                title="Latest Episodes"
                                episodes={latestEpisodes}
                                onSelectAnime={handleSelectAnime}
                                isLoading={isLoading}
                                onViewMore={() => handleViewMore({ statuses: [MediaStatus.RELEASING], sort: MediaSort.TRENDING_DESC }, "Recently Released Anime")}
                            />
                            <AnimeGrid 
                                title="Popular Animes" 
                                animeList={popular} 
                                onSelectAnime={handleSelectAnime} 
                                onViewMore={() => handleViewMore({ sort: MediaSort.POPULARITY_DESC }, "Popular Anime")}
                            />
                            <SchedulePage onSelectAnime={handleSelectAnime} />
                            <AnimeCarousel 
                                title="Top Upcoming" 
                                animeList={topUpcoming} 
                                onSelectAnime={handleSelectAnime}
                                showRank={false}
                                onViewMore={() => handleViewMore({ statuses: [MediaStatus.NOT_YET_RELEASED], sort: MediaSort.POPULARITY_DESC }, "Top Upcoming Anime")}
                            />
                             <AnimeCarousel 
                                title="Popular This Season" 
                                animeList={popularThisSeason} 
                                onSelectAnime={handleSelectAnime}
                                showRank={false}
                                onViewMore={() => handleViewMore({ season: currentSeason!, year: String(currentYear!), sort: MediaSort.POPULARITY_DESC }, "Popular This Season")}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <VerticalAnimeList 
                                title="Top 10 Airing" 
                                animeList={topAiring} 
                                onSelectAnime={handleSelectAnime}
                                onViewMore={() => handleViewMore({ statuses: [MediaStatus.RELEASING], sort: MediaSort.POPULARITY_DESC }, "Top Airing Anime")}
                            />
                        </div>
                    </div>
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
                    />;
            
            case 'planToWatch':
                return <PlanToWatchPage 
                    animeList={planToWatchList}
                    onSelectAnime={handleSelectAnime}
                    isLoading={isPlanToWatchLoading}
                    onBack={handleHomeClick}
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
                onPlanToWatchClick={handlePlanToWatchClick}
                searchTerm={searchTerm} 
                suggestions={searchSuggestions}
                onSuggestionClick={handleSuggestionClick}
                isSuggestionsLoading={isSuggestionsLoading}
                onNavigate={handleViewMore}
            />
            {renderContent()}
            <Footer onAdminClick={() => setIsAdminModalOpen(true)} />
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
        </div>
    );
};

const App: React.FC = () => (
    <AdminProvider>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </AdminProvider>
);

export default App;