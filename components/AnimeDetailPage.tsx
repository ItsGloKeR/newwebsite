import React, { useState, useEffect } from 'react';
import { Anime, RelatedAnime, StreamSource, RecommendedAnime, MediaListEntry, MediaListStatus } from '../types';
import GenrePill from './GenrePill';
import { useAdmin } from '../contexts/AdminContext';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import TrailerModal from './TrailerModal';
import { useAuth } from '../contexts/AuthContext';
import { getMediaListEntry, updateMediaListEntry, deleteMediaListEntry } from '../services/anilistService';

const RELATED_ANIME_LIMIT = 10;

interface RelatedAnimeCardProps {
  anime: RelatedAnime;
  onSelect: (id: number) => void;
}

const RelatedAnimeCard: React.FC<RelatedAnimeCardProps> = ({ anime, onSelect }) => (
  <div 
    className="flex-shrink-0 w-32 md:w-40 cursor-pointer group"
    onClick={() => onSelect(anime.id)}
  >
    <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-105">
        <img 
          src={anime.coverImage} 
          alt={anime.title} 
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
        />
        {anime.isAdult && (
            <div className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
            18+
            </div>
        )}
        {anime.episodes != null && (
            <div className="absolute top-1 right-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
            {anime.episodes} Ep
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
        <div className="absolute bottom-0 left-0 p-2 z-20">
            <p className="text-white text-sm font-bold line-clamp-2">{anime.title}</p>
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

interface RecommendationCardProps {
  anime: RecommendedAnime;
  onSelect: (id: number) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ anime, onSelect }) => (
  <div 
    className="flex-shrink-0 w-32 md:w-40 cursor-pointer group"
    onClick={() => onSelect(anime.id)}
  >
    <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-105">
        <img 
          src={anime.coverImage} 
          alt={anime.title} 
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
        />
        {anime.isAdult && (
            <div className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
            18+
            </div>
        )}
        {anime.episodes != null && (
            <div className="absolute top-1 right-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
            {anime.episodes} Ep
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
        <div className="absolute bottom-0 left-0 p-2 z-20">
            <p className="text-white text-sm font-bold line-clamp-2">{anime.title}</p>
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


const TitleEditor: React.FC<{ anime: Anime }> = ({ anime }) => {
    const { updateTitle } = useAdmin();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(anime.title);

    useEffect(() => {
        setTitle(anime.title);
    }, [anime.title]);

    const handleSave = () => {
        updateTitle(anime.anilistId, title);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTitle(anime.title);
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
                <h1 className="text-4xl lg:text-6xl font-black text-white drop-shadow-lg">{anime.title}</h1>
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
    
    useEffect(() => {
        setAnimePaheUrl(animeOverrides?.streamUrlTemplates?.animepahe || '');
        setVidnestUrl(animeOverrides?.streamUrlTemplates?.vidnest || '');
    }, [animeOverrides]);

    const handleBlur = (source: StreamSource, value: string) => {
        updateAnimeStreamUrlTemplate(anime.anilistId, source, value);
    };

    return (
        <div className="mt-8 bg-gray-900/50 border border-cyan-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Admin Settings</h2>
            <div className="text-sm text-gray-400 mb-4 space-y-1">
                <p>Override the stream URL for this anime.</p>
                <p>&bull; <b>Simple Mode:</b> Enter the base URL (e.g., <code className="bg-gray-800 text-cyan-300 px-1 rounded">https://.../one-piece</code>). The episode/language will be added automatically.</p>
                <p>&bull; <b>Advanced Mode:</b> Provide a full template with <code className="bg-gray-800 text-cyan-300 px-1 rounded">{'{episode}'}</code> for custom URL structures.</p>
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
            </div>
        </div>
    );
};


interface AnimeDetailPageProps {
  anime: Anime;
  onWatchNow: (anime: Anime) => void;
  onBack: () => void;
  onSelectRelated: (id: number) => void;
}

const AnimeDetailPage: React.FC<AnimeDetailPageProps> = ({ anime, onWatchNow, onBack, onSelectRelated }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const { user, token } = useAuth();
  const [listEntry, setListEntry] = useState<MediaListEntry | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isUpdatingList, setIsUpdatingList] = useState(false);

  useEffect(() => {
    // Reset on anime change
    setListEntry(null);
    setIsListLoading(true);

    if (user && token && anime) {
      getMediaListEntry(anime.anilistId, token)
        .then(entry => setListEntry(entry))
        .catch(console.error)
        .finally(() => setIsListLoading(false));
    } else {
      setIsListLoading(false);
    }
  }, [user, token, anime]);

  const handleTogglePlanToWatch = async () => {
    if (!token || !anime) return;
    
    setIsUpdatingList(true);
    try {
      if (listEntry?.status === MediaListStatus.PLANNING) {
        // It's on the plan to watch list, so we remove it
        await deleteMediaListEntry(listEntry.id, token);
        setListEntry(null);
      } else {
        // It's not on the plan to watch list (or on another list), so we add/move it
        const updatedEntry = await updateMediaListEntry(anime.anilistId, MediaListStatus.PLANNING, token);
        setListEntry(updatedEntry);
      }
    } catch (error) {
      console.error("Failed to update Plan to Watch list", error);
      // TODO: Optionally show a toast/error message to the user
    } finally {
      setIsUpdatingList(false);
    }
  };

  const PlanToWatchButton = () => {
    if (!user) return null;
    
    if (isListLoading) {
      return (
        <button disabled className="bg-gray-700/70 text-white font-bold py-3 px-8 rounded-full flex items-center justify-center w-[230px]">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        </button>
      );
    }

    const isInPlanning = listEntry?.status === MediaListStatus.PLANNING;
    const buttonClass = isInPlanning 
      ? "bg-green-600/50 hover:bg-red-600/80 border-2 border-green-500 group" 
      : "bg-gray-700/70 hover:bg-gray-600/70";
    
    return (
        <button
            onClick={handleTogglePlanToWatch}
            disabled={isUpdatingList}
            className={`backdrop-blur-sm text-white font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2 relative ${buttonClass}`}
        >
            {isUpdatingList ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : isInPlanning ? (
                <>
                    <span className="group-hover:hidden flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        <span>In Plan to Watch</span>
                    </span>
                    <span className="hidden group-hover:flex items-center gap-2 text-red-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        <span>Remove</span>
                    </span>
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    <span>Add to List</span>
                </>
            )}
        </button>
    );
  };


  return (
    <div className="animate-fade-in text-white">
      <div className="relative h-[50vh] w-full">
        <img
          src={anime.bannerImage || anime.coverImage}
          alt={anime.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 to-transparent"></div>
      </div>

      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10 -mt-32 md:-mt-48">
          <div className="md:col-span-4 lg:col-span-3">
            <img 
              src={anime.coverImage} 
              alt={anime.title} 
              className="w-full rounded-lg shadow-2xl aspect-[2/3] object-cover"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
            />
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
                <h1 className="text-4xl lg:text-6xl font-black text-white drop-shadow-lg">{anime.title}</h1>
            )}
            <div className="my-4 flex flex-wrap gap-2">
              {anime.genres.map(genre => <GenrePill key={genre} genre={genre} />)}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button 
                onClick={() => onWatchNow(anime)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Watch Now
              </button>
              {anime.trailer && anime.trailer.site === 'youtube' ? (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="bg-gray-700/70 hover:bg-gray-600/70 backdrop-blur-sm text-white font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Play Trailer
                </button>
              ) : (
                <button
                  disabled
                  className="bg-gray-800 text-gray-500 font-bold py-3 px-8 rounded-full cursor-not-allowed flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  No Trailer
                </button>
              )}
               <PlanToWatchButton />
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