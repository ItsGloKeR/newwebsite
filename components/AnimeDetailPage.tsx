import React, { useState, useEffect, useRef } from 'react';
import { Anime, RelatedAnime, StreamSource, RecommendedAnime, ZenshinMapping } from '../types';
import GenrePill from './GenrePill';
import { useAdmin } from '../contexts/AdminContext';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import TrailerModal from './TrailerModal';
import { getZenshinMappings } from '../services/anilistService';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';


interface RelatedAnimeCardProps {
  anime: RelatedAnime;
  onSelect: (id: number) => void;
}

const RelatedAnimeCard: React.FC<RelatedAnimeCardProps> = ({ anime, onSelect }) => {
  const { titleLanguage } = useTitleLanguage();
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
  
  return (
      <div 
        className="flex-shrink-0 w-32 md:w-40 cursor-pointer group"
        onClick={() => onSelect(anime.id)}
      >
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-105">
            <img 
              src={anime.coverImage} 
              alt={title} 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
            {anime.isAdult && (
                <div className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
                18+
                </div>
            )}
            {anime.episodes != null && (
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
                {anime.episodes} Ep
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
            <div className="absolute bottom-0 left-0 p-2 z-20">
                <p className="text-white text-sm font-bold line-clamp-2">{title}</p>
            </div>
            {anime.progress > 0 && anime.progress < 95 && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-500/50 z-20">
                    <div
                        className="h-full bg-cyan-500"
                        style={{ width: `${anime.progress}%` }}
                    ></div>
                </div>
            )}
        </div>
        <p className="text-gray-400 text-xs mt-1 capitalize">{anime.relationType.toLowerCase().replace(/_/g, ' ')}</p>
      </div>
  );
};

interface RecommendationCardProps {
  anime: RecommendedAnime;
  onSelect: (id: number) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ anime, onSelect }) => {
  const { titleLanguage } = useTitleLanguage();
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;

  return (
      <div 
        className="flex-shrink-0 w-32 md:w-40 cursor-pointer group"
        onClick={() => onSelect(anime.id)}
      >
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-105">
            <img 
              src={anime.coverImage} 
              alt={title} 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
            {anime.isAdult && (
                <div className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
                18+
                </div>
            )}
            {anime.episodes != null && (
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
                {anime.episodes} Ep
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
            <div className="absolute bottom-0 left-0 p-2 z-20">
                <p className="text-white text-sm font-bold line-clamp-2">{title}</p>
            </div>
            {anime.progress > 0 && anime.progress < 95 && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-500/50 z-20">
                    <div
                        className="h-full bg-cyan-500"
                        style={{ width: `${anime.progress}%` }}
                    ></div>
                </div>
            )}
        </div>
      </div>
  );
};


const TitleEditor: React.FC<{ anime: Anime }> = ({ anime }) => {
    const { updateTitle } = useAdmin();
    const { titleLanguage } = useTitleLanguage();
    const displayTitle = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
    
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(anime.englishTitle);

    useEffect(() => {
        setTitle(anime.englishTitle);
    }, [anime.englishTitle]);

    const handleSave = () => {
        updateTitle(anime.anilistId, title);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTitle(anime.englishTitle);
        }
    };

    return (
        <div className="flex items-center gap-4">
            {isEditing ? (
                 <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="text-4xl lg:text-6xl font-black bg-gray-800 text-white rounded px-2 -mx-2"
                    autoFocus
                />
            ) : (
                <h1 className="text-4xl lg:text-6xl font-black text-white drop-shadow-lg">{displayTitle}</h1>
            )}
            <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" />
                </svg>
            </button>
        </div>
    );
};

const AdminSettings: React.FC<{ anime: Anime }> = ({ anime }) => {
    const { overrides, updateAnimeStreamUrlTemplate } = useAdmin();
    const animeOverrides = overrides.anime[anime.anilistId];

    const [animePaheUrl, setAnimePaheUrl] = useState(animeOverrides?.streamUrlTemplates?.animepahe || '');
    const [vidnestUrl, setVidnestUrl] = useState(animeOverrides?.streamUrlTemplates?.vidnest || '');
    const [vidlinkUrl, setVidlinkUrl] = useState(animeOverrides?.streamUrlTemplates?.vidlink || '');
    const [externalPlayerUrl, setExternalPlayerUrl] = useState(animeOverrides?.streamUrlTemplates?.externalplayer || '');

    
    useEffect(() => {
        setAnimePaheUrl(animeOverrides?.streamUrlTemplates?.animepahe || '');
        setVidnestUrl(animeOverrides?.streamUrlTemplates?.vidnest || '');
        setVidlinkUrl(animeOverrides?.streamUrlTemplates?.vidlink || '');
        setExternalPlayerUrl(animeOverrides?.streamUrlTemplates?.externalplayer || '');
    }, [animeOverrides]);

    const handleBlur = (source: StreamSource, value: string) => {
        updateAnimeStreamUrlTemplate(anime.anilistId, source, value);
    };

    return (
        <div className="mt-8 bg-gray-900/50 border border-cyan-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Admin Settings</h2>
            <div className="text-sm text-gray-400 mb-4 space-y-1">
                <p>Override the stream URL for this anime.</p>
                <p>&bull; <b>Simple Mode (Src 1, 2):</b> Enter the base URL. The episode/language will be added automatically.</p>
                <p>&bull; <b>Advanced Mode (Src 1, 2):</b> Provide a full template with tokens like <code className="bg-gray-800 text-cyan-300 px-1 rounded">{'{episode}'}</code>.</p>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="animeSource1">Source 1 URL (AnimePahe)</label>
                    <input
                        id="animeSource1"
                        type="text"
                        value={animePaheUrl}
                        onChange={(e) => setAnimePaheUrl(e.target.value)}
                        onBlur={(e) => handleBlur(StreamSource.AnimePahe, e.target.value)}
                        placeholder="Enter base URL or full template"
                        className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="animeSource2">Source 2 URL (Vidnest)</label>
                    <input
                        id="animeSource2"
                        type="text"
                        value={vidnestUrl}
                        onChange={(e) => setVidnestUrl(e.target.value)}
                        onBlur={(e) => handleBlur(StreamSource.Vidnest, e.target.value)}
                        placeholder="Enter base URL or full template"
                        className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                {/*
                 <div>
                    <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="animeSource3">Source 3 URL (Vidlink)</label>
                    <input
                        id="animeSource3"
                        type="text"
                        value={vidlinkUrl}
                        onChange={(e) => setVidlinkUrl(e.target.value)}
                        onBlur={(e) => handleBlur(StreamSource.Vidlink, e.target.value)}
                        placeholder="Enter base URL or full template"
                        className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                */}
            </div>
        </div>
    );
};


interface AnimeDetailPageProps {
  anime: Anime;
  onWatchNow: (anime: Anime) => void;
  onBack: () => void;
  onSelectRelated: (id: number) => void;
  setInView: (inView: boolean) => void;
}

// FIX: Removed an obsolete comment. A limit for related anime is already defined and used.
const RELATED_ANIME_LIMIT = 15;

const AnimeDetailPage: React.FC<AnimeDetailPageProps> = ({ anime, onWatchNow, onBack, onSelectRelated, setInView }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [zenshinData, setZenshinData] = useState<ZenshinMapping | null>(null);
  const { isAdmin } = useAdmin();
  const { titleLanguage } = useTitleLanguage();
  const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const currentRef = bannerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [setInView]);

  useEffect(() => {
    if (!anime) return;
    const fetchMappings = async () => {
        try {
            const data = await getZenshinMappings(anime.anilistId);
            setZenshinData(data);
        } catch (error) {
            console.error("Failed to fetch zenshin mappings for details page", error);
            setZenshinData(null);
        }
    };
    fetchMappings();
  }, [anime]);

  return (
    <div className="animate-fade-in text-white">
      <div ref={bannerRef} className="relative h-[50vh] w-full -mt-16 pt-16">
        <img
          src={anime.bannerImage || anime.coverImage}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 to-transparent"></div>
      </div>

      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10 -mt-32 md:-mt-48">
          <div className="md:col-span-4 lg:col-span-3">
            <div className="relative">
              <img 
                src={anime.coverImage} 
                alt={title} 
                className="w-full rounded-lg shadow-2xl aspect-[2/3] object-cover"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
              />
              {anime.isAdult && (
                <div className="absolute top-3 right-3 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-lg z-10">
                  18+
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-end md:pb-8">
            <button onClick={onBack} className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded-full hover:bg-cyan-500 transition-colors z-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {isAdmin ? (
                <TitleEditor anime={anime} />
            ) : (
                <h1 className="text-4xl lg:text-6xl font-black text-white drop-shadow-lg">{title}</h1>
            )}
            <div className="my-4 flex flex-wrap gap-2">
              {anime.genres.map(genre => <GenrePill key={genre} genre={genre} />)}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button 
                onClick={() => onWatchNow(anime)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 sm:py-3 sm:px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Watch Now
              </button>
              {anime.trailer && anime.trailer.site === 'youtube' ? (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="bg-gray-700/70 hover:bg-gray-600/70 backdrop-blur-sm text-white font-bold py-2 px-6 sm:py-3 sm:px-8 rounded-full transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Play Trailer
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-800 text-gray-500 font-bold py-2 px-6 sm:py-3 sm:px-8 rounded-full cursor-not-allowed flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  No Trailer
                </button>
              )}
            </div>
          </div>
        </div>

        {isAdmin && <AdminSettings anime={anime} />}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold border-l-4 border-cyan-400 pl-4 mb-4">Synopsis</h2>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap relative">
              <p className={`${!showFullDescription && 'line-clamp-6'}`}>
                {anime.description || "No description available."}
              </p>
              {anime.description && anime.description.length > 400 && (
                 <button 
                   onClick={() => setShowFullDescription(!showFullDescription)} 
                   className="font-semibold text-cyan-400 hover:text-cyan-300 mt-2"
                 >
                   {showFullDescription ? 'Show Less' : 'Show More'}
                 </button>
              )}
            </div>

            {anime.staff.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold border-l-4 border-cyan-400 pl-4 mb-4">Staff</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {anime.staff.map(s => (
                            <div key={`${s.id}-${s.role}`} className="text-sm">
                                <p className="text-white font-semibold">{s.name}</p>
                                <p className="text-gray-400">{s.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6 bg-gray-900/50 p-6 rounded-lg">
             <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-400">Rating</h3>
                <p className="text-white font-bold text-lg">{anime.rating ? `${anime.rating} / 100` : 'N/A'}</p>
             </div>
             <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-400">Episodes</h3>
                <p className="text-white font-bold text-lg">{anime.episodes ? `${anime.episodes}` : 'TBA'}</p>
             </div>
             <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-400">Status</h3>
                <p className="text-white font-bold text-lg capitalize">{anime.status.toLowerCase().replace(/_/g, ' ')}</p>
             </div>
              {zenshinData?.mappings?.imdb_id && (
                <a 
                    href={`https://www.imdb.com/title/${zenshinData.mappings.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center group"
                >
                    <h3 className="font-bold text-lg text-gray-400 group-hover:text-yellow-400 transition-colors">IMDb</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current text-white group-hover:text-yellow-400 transition-colors">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10zm-3.32-1.39c.06.19.08.38.08.58v1.62c0 .9-.73 1.63-1.63 1.63h-1.4v-4.87h1.4c.9 0 1.63.73 1.63 1.63 0 .2-.02.39-.08.59zm-5.46 2.26h-1.4V8.13h1.4v4.74zm-3.72 0H8.1V8.13h1.4v4.74zm-2.09-2.26c0-.9.73-1.63 1.63-1.63h.42V8.13h-2.05c-.9 0-1.63.73-1.63 1.63v3.08c0 .9.73 1.63 1.63 1.63h2.05v-1.95h-.42c-.9 0-1.63-.73-1.63-1.63z"/>
                    </svg>
                </a>
              )}
             <div>
                <h3 className="font-bold text-lg mb-2 text-gray-400">Studios</h3>
                <p className="text-white font-semibold">{anime.studios.join(', ')}</p>
             </div>
          </div>
        </div>

        {anime.relations.length > 0 && (
           <div className="mt-12">
              <h2 className="text-2xl font-bold border-l-4 border-cyan-400 pl-4 mb-4">Related Anime</h2>
              <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 carousel-scrollbar">
                {anime.relations.slice(0, RELATED_ANIME_LIMIT).map(rel => (
                  <RelatedAnimeCard key={`${rel.id}-${rel.relationType}`} anime={rel} onSelect={onSelectRelated} />
                ))}
              </div>
           </div>
        )}

        {anime.recommendations && anime.recommendations.length > 0 && (
           <div className="mt-12">
              <h2 className="text-2xl font-bold border-l-4 border-cyan-400 pl-4 mb-4">You Might Also Like</h2>
              <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 carousel-scrollbar">
                {anime.recommendations.map(rec => (
                  <RecommendationCard key={rec.id} anime={rec} onSelect={onSelectRelated} />
                ))}
              </div>
           </div>
        )}
      </div>
      
      {isTrailerOpen && anime.trailer && (
        <TrailerModal 
          trailerId={anime.trailer.id} 
          onClose={() => setIsTrailerOpen(false)} 
        />
      )}
    </div>
  );
};

export default AnimeDetailPage;
