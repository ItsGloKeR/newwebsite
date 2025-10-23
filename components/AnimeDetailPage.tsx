import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Anime, RelatedAnime, RecommendedAnime, Character, StaffMember } from '../types';
import GenrePill from './GenrePill';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';
import { useUserData } from '../contexts/UserDataContext';
import { useDataSaver } from '../contexts/DataSaverContext';
import TrailerModal from './TrailerModal';
import { useTooltip } from '../contexts/TooltipContext';


// SVG Icons for the details section
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
const TVIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM4.343 5.757a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM1 12a1 1 0 011-1h16a1 1 0 110 2H2a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>;
const EpisodesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2-2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;

const RelatedAnimeCard: React.FC<{ anime: RelatedAnime; onSelect: (id: number) => void }> = ({ anime, onSelect }) => {
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
        onClick={() => onSelect(anime.id)}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-cyan-500/30">
          <img src={anime.coverImage} alt={title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }} />
          {anime.isAdult && <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">18+</div>}
        </div>
        <div className="pt-3">
          <h3 className="text-white text-sm font-bold truncate group-hover:text-cyan-400 transition-colors" title={title}>{title}</h3>
          <div className="flex items-center gap-3 text-gray-400 text-xs mt-1">
            {anime.format && <span className="font-semibold">{anime.format.replace(/_/g, ' ')}</span>}
            {anime.year > 0 && <span className="font-semibold">{anime.year}</span>}
            {episodeText && <span className="font-semibold">{episodeText}</span>}
          </div>
          <p className="text-cyan-400 text-xs mt-1 capitalize font-semibold">{anime.relationType.toLowerCase().replace(/_/g, ' ')}</p>
        </div>
      </div>
  );
};

const RecommendationCard: React.FC<{ anime: RecommendedAnime; onSelect: (id: number) => void }> = ({ anime, onSelect }) => {
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
        onClick={() => onSelect(anime.id)}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-cyan-500/30">
            <img src={anime.coverImage} alt={title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}/>
            {anime.isAdult && <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">18+</div>}
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

const CharacterCard: React.FC<{ character: Character }> = ({ character }) => {
    return (
        <div className="bg-gray-800/60 rounded-lg flex justify-between items-center overflow-hidden">
            <div className="flex items-center gap-3 p-2">
                <img src={character.image} alt={character.name} className="w-12 h-16 object-cover rounded-md" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }} />
                <div>
                    <p className="font-semibold text-white text-sm">{character.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{character.role}</p>
                </div>
            </div>
            {character.voiceActor && (
                <div className="flex items-center gap-3 p-2 text-right">
                     <div>
                        <p className="font-semibold text-white text-sm">{character.voiceActor.name}</p>
                        <p className="text-xs text-gray-400">Japanese</p>
                    </div>
                    <img src={character.voiceActor.image} alt={character.voiceActor.name} className="w-12 h-16 object-cover rounded-md" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }} />
                </div>
            )}
        </div>
    );
};

const StaffCard: React.FC<{ member: StaffMember }> = ({ member }) => {
    return (
        <div className="bg-gray-800/60 rounded-lg flex items-center gap-3 p-2 overflow-hidden">
            <img
                src={member.image || PLACEHOLDER_IMAGE_URL}
                alt={member.name}
                className="w-12 h-16 object-cover rounded-md flex-shrink-0"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
            <div className="overflow-hidden">
                <p className="font-semibold text-white text-sm truncate">{member.name}</p>
                <p className="text-xs text-gray-400 truncate">{member.role}</p>
            </div>
        </div>
    );
};


interface AnimeDetailPageProps {
  anime: Anime;
  onWatchNow: (anime: Anime) => void;
  onBack: () => void;
  onSelectRelated: (id: number) => void;
  onViewMore: (filters: { animeList: (RelatedAnime | RecommendedAnime)[] }, title: string) => void;
  setInView: (inView: boolean) => void;
}

const RELATED_ANIME_LIMIT = 15;
const MIN_RELATED_THRESHOLD = 4;
type Tab = 'overview' | 'characters' | 'stats';
type DiscoverView = 'related' | 'recommended';

const AnimeDetailPage: React.FC<AnimeDetailPageProps> = ({ anime, onWatchNow, onBack, onSelectRelated, onViewMore, setInView }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { titleLanguage } = useTitleLanguage();
  const { watchlist, favorites, toggleWatchlist, toggleFavorite } = useUserData();
  const [isInList, setIsInList] = useState(false);
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
  const bannerRef = useRef<HTMLDivElement>(null);
  const initialLoad = useRef(true);

  const { isDataSaverActive } = useDataSaver();
  const hasTrailer = anime.trailer && anime.trailer.site === 'youtube';

  const [backgroundType, setBackgroundType] = useState<'video' | 'image'>('image');
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const hasRelations = anime.relations && anime.relations.length > 0;
  const hasRecommendations = anime.recommendations && anime.recommendations.length > 0;

  const [activeDiscoverView, setActiveDiscoverView] = useState<DiscoverView>(() => {
    if (hasRelations && anime.relations.length >= MIN_RELATED_THRESHOLD) {
      return 'related';
    }
    return hasRecommendations ? 'recommended' : 'related';
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };
    // A small timeout allows the browser to render and calculate dimensions correctly
    const timer = setTimeout(checkOverflow, 150);
    window.addEventListener('resize', checkOverflow);

    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkOverflow);
    };
  }, [activeDiscoverView, anime]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (hasRelations && anime.relations.length >= MIN_RELATED_THRESHOLD) {
      setActiveDiscoverView('related');
    } else if (hasRecommendations) {
      setActiveDiscoverView('recommended');
    } else {
      setActiveDiscoverView('related'); // Fallback if no recommendations
    }
  }, [anime.anilistId, hasRelations, hasRecommendations, anime.relations.length]);

  const episodeText = useMemo(() => {
    const released = anime.episodes;
    const total = anime.totalEpisodes;

    if (anime.status === 'RELEASING') {
      if (released !== null) {
        if (total && total > 0) {
            return `${released} / ${total}`;
        }
        return `${released}`;
      }
      return null;
    }

    if (anime.status === 'FINISHED') {
        return total ? `${total}` : (released ? `${released}` : null);
    }
    
    if (anime.status === 'NOT_YET_RELEASED') {
        return total ? `${total}` : null;
    }

    // Default for other statuses
    if (total) return `${total}`;
    if (released !== null) return `${released}`;

    return null;
  }, [anime.episodes, anime.totalEpisodes, anime.status]);

  useEffect(() => {
    setIsInList(watchlist.includes(anime.anilistId));
  }, [watchlist, anime.anilistId]);

  const handleToggleWatchlist = () => {
    toggleWatchlist(anime.anilistId);
    setIsInList(true); // Optimistic update for animation
  };

  const isFavorite = favorites.includes(anime.anilistId);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { setInView(entry.isIntersecting); }, { threshold: 0.1 });
    const currentRef = bannerRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [setInView]);
  
  const switchToImage = useCallback(() => {
    setBackgroundType('image');
    initialLoad.current = false;
  }, []);

  useEffect(() => {
    setBackgroundType('image');
    initialLoad.current = true;
    if (hasTrailer && !isDataSaverActive) {
      const timer = setTimeout(() => {
        if (initialLoad.current) { setBackgroundType('video'); initialLoad.current = false; }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [anime.anilistId, hasTrailer, isDataSaverActive]);

  useEffect(() => {
    if (backgroundType !== 'video' || !hasTrailer) return;
    const timeoutId = window.setTimeout(switchToImage, 40000);
    const handlePlayerMessage = (event: MessageEvent) => {
        if (event.origin !== 'https://www.youtube.com') return;
        try {
            const data = JSON.parse(event.data);
            if (data.event === 'onError') {
                console.error('YouTube Player Error:', data.info);
                setVideoError('Trailer unavailable.');
                switchToImage();
                setTimeout(() => setVideoError(null), 5000);
            }
        } catch (error) { /* Ignore non-JSON messages */ }
    };
    window.addEventListener('message', handlePlayerMessage);
    return () => { window.clearTimeout(timeoutId); window.removeEventListener('message', handlePlayerMessage); };
  }, [backgroundType, hasTrailer, switchToImage]);
  
  const postPlayerCommand = (func: string, args: any[] = []) => {
    playerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com');
  };
  
  const handleTogglePlay = () => {
    postPlayerCommand(isPlaying ? 'pauseVideo' : 'playVideo');
    setIsPlaying(prev => !prev);
  };
  
  const handleToggleMute = () => {
    if (isMuted) {
      postPlayerCommand('unMute');
      postPlayerCommand('playVideo');
      setIsPlaying(true);
    } else {
      postPlayerCommand('mute');
    }
    setIsMuted(prev => !prev);
  };

  const switchToVideo = () => { if (hasTrailer) { setBackgroundType('video'); setIsPlaying(true); } };

  const videoSrc = hasTrailer ? `https://www.youtube.com/embed/${anime.trailer.id}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1&origin=${window.location.origin}` : '';

  const statusPill = (status: string) => {
    const s = status.toLowerCase();
    let colorClass = 'bg-gray-500/80 text-gray-100';
    if (s === 'releasing') colorClass = 'bg-green-500/80 text-green-100';
    if (s === 'finished') colorClass = 'bg-blue-500/80 text-blue-100';
    if (s === 'not_yet_released') colorClass = 'bg-yellow-500/80 text-yellow-100';
    return (
      <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>
        {status.replace(/_/g, ' ')}
      </div>
    );
  };

  const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-lg font-bold transition-colors duration-200 ${
        activeTab === tab ? 'text-white border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="animate-fade-in text-white">
      <div ref={bannerRef} className="relative h-[65vh] md:h-[70vh] w-full bg-black flex items-center justify-center">
        {backgroundType === 'video' && hasTrailer ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <iframe ref={playerRef} src={videoSrc} key={anime.anilistId} title={`${title} Trailer Background`} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope;" className="absolute top-1/2 left-1/2 w-[178vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2" style={{ pointerEvents: 'none' }}/>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            <img src={anime.bannerImage || anime.coverImage} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}/>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-black/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/50 to-transparent"></div>
        
        {videoError && <div className="absolute bottom-20 right-4 z-30 bg-red-800/80 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg animate-fade-in flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg><span>{videoError}</span></div>}

        <div className="absolute top-8 right-8 md:top-auto md:bottom-4 md:right-4 z-20 flex items-center gap-3">
            {hasTrailer && (<>
              {backgroundType === 'video' && (<>
                <div className="relative group flex justify-center">
                  <button onClick={handleTogglePlay} className="bg-black/50 p-2.5 rounded-full hover:bg-black/70 transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}><span className="absolute bottom-full mb-2 w-max bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{isPlaying ? 'Pause' : 'Play'}</span>{isPlaying ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}</button>
                </div>
                <div className="relative group flex justify-center">
                  <button onClick={handleToggleMute} className="bg-black/50 p-2.5 rounded-full hover:bg-black/70 transition-colors" aria-label={isMuted ? 'Unmute' : 'Mute'}><span className="absolute bottom-full mb-2 w-max bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{isMuted ? 'Unmute' : 'Mute'}</span>{isMuted ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}</button>
                </div>
              </>)}
              <div className="relative group flex justify-center">
                <button onClick={backgroundType === 'video' ? switchToImage : switchToVideo} className="bg-black/50 p-2.5 rounded-full hover:bg-black/70 transition-colors" aria-label={backgroundType === 'video' ? 'Show image' : 'Play trailer'}><span className="absolute bottom-full mb-2 w-max bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{backgroundType === 'video' ? 'Show Image' : 'Play Trailer'}</span>{backgroundType === 'video' ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>}</button>
              </div>
            </>)}
        </div>
        
        <div className="relative container mx-auto max-w-screen-2xl p-4 md:p-8 md:flex md:items-end md:gap-8">
            <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 z-30 group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm md:text-base whitespace-nowrap bg-gray-800/50 hover:bg-gray-700/60 px-4 py-2 rounded-lg" aria-label="Go back"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg><span>Back</span></button>
            <div className="flex-shrink-0 w-1/3 max-w-[250px] hidden md:block self-center"><img src={anime.coverImage} alt={title} className="w-full rounded-lg shadow-2xl aspect-[2/3] object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}/></div>
            <div className="flex flex-col gap-3 md:gap-4 mt-16 md:mt-0 pt-8 md:pt-0 text-center md:text-left">
                <h1 className="text-3xl lg:text-5xl font-black text-white drop-shadow-lg">{title}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-gray-200 text-sm md:text-base">
                  {anime.rating > 0 && <span className="flex items-center gap-1.5 font-semibold text-yellow-400"><StarIcon /> {anime.rating / 10}</span>}
                  {anime.year > 0 && <span className="flex items-center gap-1.5"><CalendarIcon /> {anime.year}</span>}
                  {anime.format && anime.format !== 'N/A' && <span className="flex items-center gap-1.5"><TVIcon /> {anime.format}</span>}
                  {statusPill(anime.status)}
                  {episodeText && <span className="flex items-center gap-1.5"><EpisodesIcon /> {episodeText} Episodes</span>}
                  {anime.duration && <span className="flex items-center gap-1.5"><ClockIcon /> {anime.duration} min</span>}
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">{anime.genres.slice(0, 5).map(genre => <GenrePill key={genre} genre={genre} />)}</div>
                <div className="text-sm"> <span className="font-bold text-gray-300">Studios:</span> <span className="text-gray-400">{anime.studios.join(', ')}</span></div>
                <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                  <a href={`https://anilist.co/anime/${anime.anilistId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-800/70 hover:bg-gray-700/90 text-gray-200 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors">AniList <ExternalLinkIcon /></a>
                  {anime.malId && <a href={`https://myanimelist.net/anime/${anime.malId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-800/70 hover:bg-gray-700/90 text-gray-200 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors">MAL <ExternalLinkIcon /></a>}
                </div>
                 <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start mt-6">
                    <button onClick={() => onWatchNow(anime)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 md:py-3 md:px-6 rounded-md transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2 text-base"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>Watch Now</button>
                    {hasTrailer && (
                    <button onClick={() => setIsTrailerOpen(true)} className="bg-gray-700/70 hover:bg-gray-600/70 backdrop-blur-sm text-white font-bold py-2 px-4 md:py-3 md:px-6 rounded-md transition-colors flex items-center gap-2 text-base">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                        Trailer
                    </button>
                    )}
                    <button onClick={handleToggleWatchlist} className={`font-bold p-3 rounded-md transition-all duration-300 flex items-center gap-2 relative overflow-hidden ${ isInList ? 'bg-green-500 text-white' : 'bg-gray-700/70 hover:bg-gray-600/70 backdrop-blur-sm text-white' }`}>{isInList ? <span className="absolute inset-0 flex items-center justify-center animate-show-check"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></span> : <PlusIcon />}<span className={`transition-opacity duration-200 text-base font-bold ${isInList ? 'opacity-0' : 'opacity-100'}`}>Add to List</span></button>
                    <button onClick={() => toggleFavorite(anime.anilistId)} className="bg-gray-700/70 hover:bg-gray-600/70 backdrop-blur-sm text-white p-3 rounded-md transition-colors" aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-300 ${isFavorite ? 'text-red-500' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto max-w-screen-2xl p-4 md:p-8">
        <div className="mt-8">
            <div className="flex border-b border-gray-700 mb-6">
                <TabButton tab="overview" label="Overview" />
                <TabButton tab="characters" label="Characters & Staff" />
                <TabButton tab="stats" label="Stats" />
            </div>
            <div className="animate-fade-in-fast">
                {activeTab === 'overview' && (
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap relative bg-gray-900/50 p-6 rounded-lg">
                        <p className={`${!showFullDescription && 'line-clamp-3 md:line-clamp-5'}`}>{anime.description || "No description available."}</p>
                        {anime.description && anime.description.length > 300 && <button onClick={() => setShowFullDescription(!showFullDescription)} className="font-semibold text-cyan-400 hover:text-cyan-300 mt-2">{showFullDescription ? 'Show Less' : 'Show More'}</button>}
                    </div>
                )}
                {activeTab === 'characters' && (
                    <div className="bg-gray-900/50 p-6 rounded-lg">
                        {anime.characters && anime.characters.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-4">Characters</h3>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {anime.characters.map(character => (
                                        <CharacterCard key={character.id} character={character} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <h3 className="text-xl font-bold mb-4">Staff</h3>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {anime.staff.length > 0 ? (
                                anime.staff.map(member => (
                                    <StaffCard key={member.id} member={member} />
                                ))
                            ) : ( <p className="text-gray-400 col-span-full">No staff information available.</p> )}
                        </div>
                    </div>
                )}
                {activeTab === 'stats' && (
                    <div className="bg-gray-900/50 p-6 rounded-lg">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                            <div><strong className="text-gray-400 font-semibold block">Format</strong> <span className="text-white">{anime.format || 'N/A'}</span></div>
                            <div><strong className="text-gray-400 font-semibold block">Status</strong> <span className="text-white capitalize">{anime.status.toLowerCase().replace(/_/g, ' ') || 'N/A'}</span></div>
                            <div><strong className="text-gray-400 font-semibold block">Start Date</strong> <span className="text-white">{anime.year || 'N/A'}</span></div>
                            <div><strong className="text-gray-400 font-semibold block">Avg. Score</strong> <span className="text-white">{anime.rating ? `${anime.rating}%` : 'N/A'}</span></div>
                            <div><strong className="text-gray-400 font-semibold block">Duration</strong> <span className="text-white">{anime.duration ? `${anime.duration} min` : 'N/A'}</span></div>
                            <div className="col-span-2 sm:col-span-1 md:col-span-3"><strong className="text-gray-400 font-semibold block">Studios</strong> <span className="text-white">{anime.studios.join(', ') || 'N/A'}</span></div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {(hasRelations || hasRecommendations) && (
          <div className="mt-12">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-y-2">
                <h2 className="text-2xl font-bold border-l-4 border-cyan-400 pl-4">Discover More</h2>
                <div className="flex items-center gap-4 flex-wrap justify-end">
                    <div className="relative flex w-auto items-center rounded-full bg-gray-800 p-1">
                        {hasRelations && hasRecommendations && (
                            <div
                                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-cyan-500 transition-transform duration-300 ease-in-out"
                                style={{
                                    transform: `translateX(${activeDiscoverView === 'related' ? '2px' : 'calc(100% + 2px)'})`,
                                }}
                            />
                        )}
                        <button
                            onClick={() => setActiveDiscoverView('related')}
                            disabled={!hasRelations}
                            className={`relative z-10 w-28 py-1 text-center text-sm font-semibold transition-colors rounded-full
                                ${!hasRelations ? 'cursor-not-allowed opacity-50 text-gray-500' : 'text-white'}
                                ${!hasRecommendations && hasRelations ? 'bg-cyan-500' : ''}
                            `}
                        >
                            Related
                        </button>
                        <button
                            onClick={() => setActiveDiscoverView('recommended')}
                            disabled={!hasRecommendations}
                            className={`relative z-10 w-28 py-1 text-center text-sm font-semibold transition-colors rounded-full
                                ${!hasRecommendations ? 'cursor-not-allowed opacity-50 text-gray-500' : 'text-white'}
                                ${!hasRelations && hasRecommendations ? 'bg-cyan-500' : ''}
                            `}
                        >
                            Recommended
                        </button>
                    </div>
                    <button
                        onClick={() => onViewMore({ animeList: activeDiscoverView === 'related' ? anime.relations : anime.recommendations }, activeDiscoverView === 'related' ? 'Related Anime' : 'Recommended Anime')}
                        className="group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm md:text-base whitespace-nowrap"
                    >
                        <span>View All</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div className="relative">
                {showScrollButtons && (
                    <>
                        <button 
                            onClick={() => scroll('left')}
                            className="absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block"
                            aria-label="Scroll Left"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button 
                            onClick={() => scroll('right')}
                            className="absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 rounded-full hover:bg-black/70 transition-colors hidden md:block"
                            aria-label="Scroll Right"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </>
                )}
            
                <div ref={scrollContainerRef} className="flex gap-4 md:gap-6 overflow-x-auto pb-4 carousel-scrollbar">
                    {activeDiscoverView === 'related' && hasRelations && (
                        anime.relations.slice(0, RELATED_ANIME_LIMIT).map(rel => (
                            <RelatedAnimeCard key={`${rel.id}-${rel.relationType}`} anime={rel} onSelect={onSelectRelated} />
                        ))
                    )}
                    {activeDiscoverView === 'recommended' && hasRecommendations && (
                        anime.recommendations.map(rec => (
                            <RecommendationCard key={rec.id} anime={rec} onSelect={onSelectRelated} />
                        ))
                    )}
                </div>
            </div>
          </div>
        )}
      </div>
      {isTrailerOpen && anime.trailer && (
        <TrailerModal trailerId={anime.trailer.id} onClose={() => setIsTrailerOpen(false)} />
      )}
    </div>
  );
};

export default AnimeDetailPage;