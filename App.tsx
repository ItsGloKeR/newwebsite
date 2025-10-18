import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Anime, StreamSource, StreamLanguage, SearchSuggestion, FilterState, MediaSort } from './types';
import { getHomePageData, getAnimeDetails, getGenreCollection, getSearchSuggestions, discoverAnime } from './services/anilistService';
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
import { useDebounce } from './hooks/useDebounce';
import { initialTrending, initialPopular, initialTopAiring } from './static/initialData';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import isEqual from 'lodash.isequal';


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
    const [searchResults, setSearchResults] = useState<Anime[]>([]);
    const [allGenres, setAllGenres] = useState<string[]>([]);
    
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
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const debouncedSuggestionsTerm = useDebounce(searchTerm, 300);
    const { overrides } = useAdmin();

    const isDiscoveryView = useMemo(() => {
        return debouncedSearchTerm.trim() !== '' || !isEqual(filters, initialFilters);
    }, [debouncedSearchTerm, filters]);

    const applyOverrides = useCallback((anime: Anime): Anime => {
        if (!anime) return anime;
        const overriddenTitle = overrides.anime[anime.anilistId]?.title;
        return overriddenTitle ? { ...anime, title: overriddenTitle } : anime;
    }, [overrides.anime]);

    const applyOverridesToList = useCallback((list: Anime[]): Anime[] => {
        return list.map(applyOverrides);
    }, [applyOverrides]);

    // Fetch initial data for the home page
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [{ trending, popular, topAiring }, genres] = await Promise.all([
                    getHomePageData(),
                    getGenreCollection()
                ]);
                setTrending(applyOverridesToList(trending));
                setPopular(applyOverridesToList(popular));
                setTopAiring(applyOverridesToList(topAiring));
                setAllGenres(genres);
            } catch (error) {
                console.error("Failed to fetch home page data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [applyOverridesToList]);

    // Re-apply overrides if they change
    useEffect(() => {
        setTrending(applyOverridesToList);
        setPopular(applyOverridesToList);
        setTopAiring(applyOverridesToList);
        setSearchResults(applyOverridesToList);
        if (selectedAnime) {
            setSelectedAnime(applyOverrides);
        }
    }, [overrides, applyOverridesToList, applyOverrides, selectedAnime]);

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
                setSearchResults(applyOverridesToList(results));
            } catch (error) {
                console.error("Failed to discover anime:", error);
            } finally {
                setIsDiscoverLoading(false);
            }
        };
        performSearch();
    }, [debouncedSearchTerm, filters, isDiscoveryView, applyOverridesToList]);
    
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
        setView('details');
        window.scrollTo(0, 0);
        try {
            const fullDetails = await getAnimeDetails(anime.anilistId);
            setSelectedAnime(applyOverrides(fullDetails));
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
        setView('home'); // Switch to home view to show search results
    };

    const handleSuggestionClick = (anime: { anilistId: number }) => {
        setSearchTerm(''); 
        setSearchSuggestions([]);
        handleSelectAnime(anime);
    };

    const handleWatchNow = (anime: Anime) => {
        setPlayerState({
            anime: anime,
            episode: 1,
            source: StreamSource.AnimePahe,
            language: StreamLanguage.Sub,
        });
        setView('player');
        window.scrollTo(0, 0);
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
        setView('home');
    };

    const generateDiscoveryTitle = () => {
        if (debouncedSearchTerm.trim()) {
            return `Results for "${debouncedSearchTerm}"`;
        }
        return "Filtered Results";
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
                            <AnimeCarousel title="Trending Now" animeList={trending} onSelectAnime={handleSelectAnime} />
                            <AnimeGrid title="Popular Animes" animeList={popular} onSelectAnime={handleSelectAnime} />
                            <SchedulePage onSelectAnime={handleSelectAnime} />
                        </div>
                        <div className="lg:col-span-1">
                            <VerticalAnimeList title="Top 10 Airing" animeList={topAiring} onSelectAnime={handleSelectAnime} />
                        </div>
                    </div>
                </div>
            </main>
        );
    };

    const renderContent = () => {
        switch(view) {
            case 'player':
                return playerState.anime ? <AnimePlayer
                    anime={playerState.anime}
                    currentEpisode={playerState.episode}
                    currentSource={playerState.source}
                    currentLanguage={playerState.language}
                    onEpisodeChange={(ep) => setPlayerState(prev => ({...prev, episode: ep}))}
                    onSourceChange={(src) => setPlayerState(prev => ({...prev, source: src}))}
                    onLanguageChange={(lang) => setPlayerState(prev => ({...prev, language: lang}))}
                    onBack={handleBackToDetails}
                /> : null; // Should not happen if logic is correct
            
            case 'details':
                return isLoading 
                    ? <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>
                    : selectedAnime && <AnimeDetailPage 
                        anime={selectedAnime}
                        onWatchNow={handleWatchNow}
                        onBack={handleBackFromDetails}
                        onSelectRelated={(id) => handleSelectAnime({anilistId: id})}
                    />;
            
            case 'home':
            default:
                if (isLoading && trending.length === 0) {
                    return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
                }
                return renderHomePage();
        }
    };

    return (
        <div className="bg-gray-950 min-h-screen">
            {view !== 'player' && <Header 
                onSearch={handleSearch} 
                onHomeClick={handleHomeClick} 
                onFilterClick={() => setIsFilterModalOpen(true)} 
                searchTerm={searchTerm} 
                suggestions={searchSuggestions}
                onSuggestionClick={handleSuggestionClick}
                isSuggestionsLoading={isSuggestionsLoading}
            />}
            {renderContent()}
            {view !== 'player' && <Footer onAdminClick={() => setIsAdminModalOpen(true)} />}
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
        <AppContent />
    </AdminProvider>
);

export default App;
