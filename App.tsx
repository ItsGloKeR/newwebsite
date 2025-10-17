

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AnimeGrid from './components/AnimeGrid';
import AnimeDetailPage from './components/AnimeDetailPage';
import AnimePlayer from './components/AnimePlayer';
import LoadingSpinner from './components/LoadingSpinner';
import { getHomePageData, searchAnime, getAnimeDetails } from './services/anilistService';
import { Anime, StreamSource, StreamLanguage } from './types';
import { useDebounce } from './hooks/useDebounce';
import Hero from './components/Hero';
import AnimeCarousel from './components/AnimeCarousel';
import VerticalAnimeList from './components/VerticalAnimeList';


type View = 'home' | 'detail' | 'player' | 'search';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [homePageData, setHomePageData] = useState<{
    trending: Anime[];
    popular: Anime[];
    topAiring: Anime[];
  } | null>(null);
  const [searchResults, setSearchResults] = useState<Anime[]>([]);

  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [currentSource, setCurrentSource] = useState(StreamSource.Vidnest);
  const [currentLanguage, setCurrentLanguage] = useState(StreamLanguage.Sub);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const data = await getHomePageData();
        setHomePageData(data);
      } catch (error) {
        console.error("Failed to fetch home page data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.trim() === '') {
        setSearchResults([]);
        if(view === 'search') setView('home');
        return;
      }
      try {
        setIsSearching(true);
        setView('search');
        const results = await searchAnime(debouncedSearchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error("Failed to search anime:", error);
      } finally {
        setIsSearching(false);
      }
    };
    if (debouncedSearchTerm) {
      performSearch();
    } else {
        setSearchResults([]);
        if(view === 'search') setView('home');
    }
  }, [debouncedSearchTerm]);

  const handleSelectAnime = async (anime: Anime | number) => {
    try {
      setIsLoading(true);
      const animeId = typeof anime === 'number' ? anime : anime.anilistId;
      const details = await getAnimeDetails(animeId);
      setSelectedAnime(details);
      setView('detail');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Failed to get anime details:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleWatchNow = (anime: Anime) => {
    setSelectedAnime(anime);
    setCurrentEpisode(1);
    setView('player');
    window.scrollTo(0, 0);
  };
  
  const handleBack = () => {
    if (view === 'player') {
      setView('detail');
    } else if (view === 'detail') {
      setView(searchTerm ? 'search' : 'home');
    }
  };

  const handleHome = () => {
    setView('home');
    setSearchTerm('');
    setSelectedAnime(null);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is triggered by debouncedSearchTerm effect
  };

  const renderContent = () => {
    if (isLoading && !homePageData && view === 'home') {
        return <div className="h-screen"><LoadingSpinner /></div>;
    }

    switch (view) {
      case 'player':
        if (selectedAnime) {
          return (
            <AnimePlayer
              anime={selectedAnime}
              currentEpisode={currentEpisode}
              currentSource={currentSource}
              currentLanguage={currentLanguage}
              onEpisodeChange={setCurrentEpisode}
              onSourceChange={setCurrentSource}
              onLanguageChange={setCurrentLanguage}
              onBack={handleBack}
            />
          );
        }
        return null;

      case 'detail':
        if (selectedAnime) {
          return <AnimeDetailPage anime={selectedAnime} onWatchNow={handleWatchNow} onBack={handleBack} onSelectRelated={handleSelectAnime} />;
        }
        return <div className="h-screen"><LoadingSpinner /></div>;

      case 'search':
        return (
          <main className="container mx-auto p-4 md:p-8">
            <AnimeGrid title={`Search Results for "${searchTerm}"`} animeList={searchResults} onSelectAnime={handleSelectAnime} />
          </main>
        );

      case 'home':
      default:
        if (!homePageData) return <div className="h-screen"><LoadingSpinner /></div>;
        return (
          <>
            {homePageData.trending.length > 0 && <Hero animes={homePageData.trending} onWatchNow={handleWatchNow} onDetails={handleSelectAnime}/>}
            <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <AnimeCarousel title="Trending Now" animeList={homePageData.trending} onSelectAnime={handleSelectAnime} />
                <AnimeGrid title="Most Popular" animeList={homePageData.popular} onSelectAnime={handleSelectAnime} />
              </div>
              <div className="lg:col-span-1">
                <VerticalAnimeList title="Top Airing" animeList={homePageData.topAiring} onSelectAnime={handleSelectAnime} />
              </div>
            </main>
          </>
        );
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onHomeClick={handleHome}
        onBackClick={handleBack}
        showBackButton={view === 'detail' || view === 'player'}
        isSearching={isSearching}
      />
      {renderContent()}
    </div>
  );
};

export default App;