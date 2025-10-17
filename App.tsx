import React, { useState, useEffect, useCallback } from 'react';
import { Anime, StreamSource, StreamLanguage } from './types';
import { fetchPopularAnime, searchAnime, fetchAnimeById } from './services/anilistService';
import Header from './components/Header';
import Hero from './components/Hero';
import AnimeGrid from './components/AnimeGrid';
import AnimeDetailPage from './components/AnimeDetailPage';
import AnimePlayer from './components/AnimePlayer';
import LoadingSpinner from './components/LoadingSpinner';
import { useDebounce } from './hooks/useDebounce';
import AnimeCarousel from './components/AnimeCarousel';

const App: React.FC = () => {
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [popularAnime, setPopularAnime] = useState<Anime[]>([]);
  const [featuredAnime, setFeaturedAnime] = useState<Anime | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [detailedAnime, setDetailedAnime] = useState<Anime | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [currentSource, setCurrentSource] = useState<StreamSource>(StreamSource.AnimePahe);
  const [currentLanguage, setCurrentLanguage] = useState<StreamLanguage>(StreamLanguage.Sub);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  useEffect(() => {
    const getInitialData = async () => {
      try {
        const popular = await fetchPopularAnime();
        setPopularAnime(popular);
        setTrendingAnime(popular.slice(0, 10));
        setFeaturedAnime(popular[0] || null);
      } catch (error) {
        console.error("Failed to fetch popular anime:", error);
      }
    };
    getInitialData();
  }, []);
  
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearching(true);
      setSearchResults(null);
      try {
        const results = await searchAnime(searchTerm.trim());
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults(null);
    }
  };
  
  const handleGoHome = useCallback(() => {
    setSelectedAnime(null);
    setDetailedAnime(null);
    setSearchTerm('');
    setSearchResults(null);
    window.scrollTo(0, 0);
  }, []);
  
  const handleSelectAnime = useCallback((anime: Anime) => {
    setDetailedAnime(anime);
    window.scrollTo(0, 0);
  }, []);

  const handleSelectAnimeById = useCallback(async (id: number) => {
    setIsDetailLoading(true);
    setDetailedAnime(null);
    setSelectedAnime(null);
    window.scrollTo(0, 0);
    try {
      const anime = await fetchAnimeById(id);
      setDetailedAnime(anime);
    } catch (error) {
      console.error("Failed to fetch anime details:", error);
      handleGoHome();
    } finally {
      setIsDetailLoading(false);
    }
  }, [handleGoHome]);

  const handleWatchNow = useCallback((anime: Anime) => {
    setSelectedAnime(anime);
    setDetailedAnime(null);
    setCurrentEpisode(1);
  }, []);

  const handleBackFromDetails = useCallback(() => {
    setDetailedAnime(null);
  }, []);

  const handleBackFromPlayer = useCallback(() => {
    // When coming back from player, show the detail page of the anime that was being watched.
    if(selectedAnime){
      setDetailedAnime(selectedAnime);
    }
    setSelectedAnime(null);
  }, [selectedAnime]);
  
  // Debounced search has been replaced by on-submit search
  // The useDebounce hook is no longer used for triggering searches but we'll keep the hook file for potential future use.

  if (selectedAnime) {
    return <AnimePlayer anime={selectedAnime} {...{ currentEpisode, currentSource, currentLanguage, onEpisodeChange: setCurrentEpisode, onSourceChange: setCurrentSource, onLanguageChange: setCurrentLanguage, onBack: handleBackFromPlayer }} />;
  }
  
  if (isDetailLoading) {
    return (
      <div className="bg-gray-950 min-h-screen">
        <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} onSearchSubmit={handleSearchSubmit} onHomeClick={handleGoHome} isSearching={isSearching} />
        <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner /></div>
      </div>
    );
  }

  if (detailedAnime) {
      return <AnimeDetailPage anime={detailedAnime} onWatchNow={handleWatchNow} onBack={handleBackFromDetails} onSelectRelated={handleSelectAnimeById} />;
  }

  return (
    <div className="bg-gray-950 min-h-screen">
      <Header 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
        onSearchSubmit={handleSearchSubmit}
        onHomeClick={handleGoHome}
        isSearching={isSearching}
        showBackButton={searchResults !== null}
        onBackClick={handleGoHome}
      />
      <main className="container mx-auto p-4 md:p-8">
        {isSearching ? (
           <div className="h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>
        ) : searchResults !== null ? (
            <AnimeGrid title={searchTerm ? `Search Results for "${searchTerm}"` : 'Search'} animeList={searchResults} onSelectAnime={handleSelectAnime} />
        ) : (
          <>
            <Hero anime={featuredAnime} onWatchNow={handleWatchNow} />
            {trendingAnime.length > 0 && <AnimeCarousel title="Trending Now" animeList={trendingAnime} onSelectAnime={handleSelectAnime} />}
            {popularAnime.length > 0 && <AnimeGrid title="All Time Popular" animeList={popularAnime} onSelectAnime={handleSelectAnime} />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;