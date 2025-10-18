import React, { useState, useEffect } from 'react';
import { Anime, RelatedAnime, StreamSource, RecommendedAnime } from '../types';
import GenrePill from './GenrePill';
import { useAdmin } from '../contexts/AdminContext';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import TrailerModal from './TrailerModal';

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-2">
            <p className="text-white text-sm font-bold line-clamp-2">{anime.title}</p>
        </div>
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-2">
            <p className="text-white text-sm font-bold line-clamp-2">{anime.title}</p>
        </div>
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