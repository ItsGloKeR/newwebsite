import React, { useState, useEffect, useCallback } from 'react';
import { Anime, StreamLanguage, StreamSource } from './types';
import { getHomePageData, searchAnime, getAnimeDetails } from './services/anilistService';
import { initialTrending, initialPopular, initialTopAiring } from './static/initialData';
import { useDebounce } from './hooks/useDebounce';

import Header from './components/Header';
import Hero from './components/Hero';
import AnimeGrid from './components/AnimeGrid';
import AnimeCarousel from './components/AnimeCarousel';
import VerticalAnimeList from './components/VerticalAnimeList';
import AnimeDetailPage from './components/AnimeDetailPage';
import AnimePlayer from './components/AnimePlayer';
import LoadingSpinner from './components/LoadingSpinner';
import GenreFilter from './components/GenreFilter';
import SchedulePage from './components/SchedulePage';


type View = 'home' | 'details' | 'player' | 'search' | 'schedule';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [trending, setTrending] = useState<Anime[]>(initialTrending);
  const [popular, setPopular] = useState<Anime[]>(initialPopular);
  const [topAiring, setTopAiring] = useState<Anime[]>(initialTopAiring);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  
  const [playerState, setPlayerState] = useState({
    episode: 1,
    source: StreamSource.Vidnest,
    language: StreamLanguage.Sub,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const loadHomePageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getHomePageData();
      setTrending(data.trending);
      setPopular(data.popular);
      setTopAiring(data.topAiring);
    } catch (error) {
      console.error("Failed to load home page data:", error);
      // Potentially set an error state to show in UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomePageData();
  }, [loadHomePageData]);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.trim().length > 2) {
        setIsSearching(true);
        setView('search');
        try {
          const results = await searchAnime(debouncedSearchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error("Failed to search anime:", error);
        } finally {
          setIsSearching(false);
        }
      } else if (searchTerm.length === 0) {
        setSearchResults([]);
        if (view === 'search') {
            handleHomeClick();
        }
      }
    };
    performSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  const handleSelectAnime = async (anime: { anilistId: number }) => {
    setIsLoading(true);
    try {
      // The anime object might be partial, so we fetch full details
      const fullDetails = await getAnimeDetails(anime.anilistId);
      setSelectedAnime(fullDetails);
      setView('details');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Failed to get anime details:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectRelated = async (id: number) => {
    setIsLoading(true);
    try {
      const details = await getAnimeDetails(id);
      setSelectedAnime(details);
      setView('details');
       window.scrollTo(0, 0);
    } catch (error) {
      console.error("Failed to get related anime details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchNow = (anime: Anime) => {
    setSelectedAnime(anime);
    setPlayerState(prev => ({ ...prev, episode: 1 })); // Reset to episode 1
    setView('player');
    window.scrollTo(0, 0);
  };

  const handleBackToDetails = () => {
    setView('details');
  };

  const handleHomeClick = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedGenres([]);
    setView('home');
    window.scrollTo(0, 0);
  };
  
  const handleScheduleClick = () => {
    setView('schedule');
    window.scrollTo(0, 0);
  }

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const filteredPopular = popular.filter(anime => 
    selectedGenres.length === 0 || selectedGenres.every(g => anime.genres.includes(g))
  );

  const renderContent = () => {
    if (isLoading && !selectedAnime && view !== 'home' && trending.length === 0) {
      return <div className="h-screen flex-grow flex items-center justify-center"><LoadingSpinner /></div>;
    }

    switch(view) {
      case 'player':
        if (!selectedAnime) return null;
        return <AnimePlayer 
          anime={selectedAnime}
          currentEpisode={playerState.episode}
          currentSource={playerState.source}
          currentLanguage={playerState.language}
          onEpisodeChange={episode => setPlayerState(s => ({ ...s, episode }))}
          onSourceChange={source => setPlayerState(s => ({ ...s, source }))}
          onLanguageChange={language => setPlayerState(s => ({ ...s, language }))}
          onBack={handleBackToDetails}
        />;

      case 'details':
        if (!selectedAnime) return null;
        return <AnimeDetailPage 
          anime={selectedAnime} 
          onWatchNow={handleWatchNow} 
          onBack={handleHomeClick}
          onSelectRelated={handleSelectRelated}
        />;
      
      case 'schedule':
        return <SchedulePage onSelectAnime={handleSelectAnime} />;

      case 'search':
        return (
          <main className="container mx-auto p-4 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Search results for "{searchTerm}"</h2>
            {isSearching 
              ? <LoadingSpinner />
              : <AnimeGrid title="" animeList={searchResults} onSelectAnime={handleSelectAnime} />
            }
          </main>
        );

      case 'home':
      default:
        return (
          <>
            {trending.length > 0 && 
              <Hero animes={trending} onWatchNow={handleWatchNow} onDetails={handleSelectAnime} />
            }
            <main className="container mx-auto p-4 md:p-8">
              {isLoading && trending.length === 0 && <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  {trending.length > 0 && <AnimeCarousel title="Trending Now" animeList={trending} onSelectAnime={handleSelectAnime} />}
                  <GenreFilter selectedGenres={selectedGenres} onGenreToggle={handleGenreToggle} />
                  {filteredPopular.length > 0 && <AnimeGrid title="Popular This Season" animeList={filteredPopular} onSelectAnime={handleSelectAnime} />}
                </div>
                <div className="lg:col-span-1">
                  {topAiring.length > 0 && <VerticalAnimeList title="Top Airing" animeList={topAiring} onSelectAnime={handleSelectAnime} />}
                </div>
              </div>
            </main>
          </>
        );
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen">
      <Header 
        onSearch={setSearchTerm}
        onHomeClick={handleHomeClick}
        onScheduleClick={handleScheduleClick}
        searchTerm={searchTerm}
      />
      {renderContent()}
    </div>
  );
};

export default App;
