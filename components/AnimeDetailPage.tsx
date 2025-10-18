import React, { useState, useEffect } from 'react';
import { Anime, RelatedAnime, NextEpisodeSchedule, StreamSource } from '../types';
import GenrePill from './GenrePill';
import { fetchNextEpisodeSchedule } from '../services/hianimeService';
import { useAdmin } from '../contexts/AdminContext';

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
        <img src={anime.coverImage} alt={anime.title} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-2">
            <p className="text-white text-sm font-bold line-clamp-2">{anime.title}</p>
        </div>
    </div>
    <p className="text-gray-400 text-xs mt-1 capitalize">{anime.relationType.toLowerCase().replace(/_/g, ' ')}</p>
  </div>
);

const CountdownTimer: React.FC<{ seconds: number }> = ({ seconds }) => {
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        if (remaining <= 0) return;
        const interval = setInterval(() => {
            setRemaining(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [remaining]);

    const d = Math.floor(remaining / (3600*24));
    const h = Math.floor(remaining % (3600*24) / 3600);
    const m = Math.floor(remaining % 3600 / 60);
    const s = Math.floor(remaining % 60);

    return (
        <p className="text-lg">
            Next episode airs in: <span className="font-bold text-cyan-400">{d}d {h}h {m}m {s}s</span>
        </p>
    );
};

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
  const [schedule, setSchedule] = useState<NextEpisodeSchedule | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const getSchedule = async () => {
      if (!anime.title) return;
      setIsLoadingSchedule(true);
      const hianimeId = anime.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s]+/g, '-')
        .replace(/--+/g, '-');
      
      const scheduleData = await fetchNextEpisodeSchedule(hianimeId);
      setSchedule(scheduleData);
      setIsLoadingSchedule(false);
    };

    getSchedule();
  }, [anime.anilistId, anime.title]);

  const mainStaff = anime.staff.filter(s => ['Director', 'Original Creator', 'Series Composition'].includes(s.role));

  return (
    <div className="animate-fade-in text-white">
      <div className="relative h-[50vh] w-full">
        <img
          src={anime.bannerImage}
          alt={anime.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== anime.coverImage) {
              target.onerror = null;
              target.src = anime.coverImage;
            }
          }}
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
            <button 
              onClick={() => onWatchNow(anime)}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2 w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Watch Now
            </button>
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
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
             <div>
                <h3 className="font-bold text-lg mb-2">Studios</h3>
                <p className="text-gray-400">{anime.studios.join(', ')}</p>
             </div>
             <div>
                <h3 className="font-bold text-lg mb-2">Main Staff</h3>
                {mainStaff.map(s => (
                  <div key={s.id} className="text-sm">
                      <span className="text-gray-400">{s.role}: </span>
                      <span className="text-white font-semibold">{s.name}</span>
                  </div>
                ))}
             </div>
             {!isLoadingSchedule && schedule?.secondsUntilAiring && schedule.secondsUntilAiring > 0 && (
                <div>
                    <h3 className="font-bold text-lg mb-2">Next Episode</h3>
                    <CountdownTimer seconds={schedule.secondsUntilAiring} />
                </div>
             )}
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
      </div>
    </div>
  );
};

export default AnimeDetailPage;