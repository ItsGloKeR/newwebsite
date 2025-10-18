import React, { useState, useEffect } from 'react';
import { Anime, StreamSource, StreamLanguage } from '../types';
import GenrePill from './GenrePill';
import { useAdmin } from '../contexts/AdminContext';

const AdminEpisodeEditor: React.FC<{ anime: Anime; episode: number }> = ({ anime, episode }) => {
    const { isAdmin, overrides, updateEpisodeStreamUrl } = useAdmin();
    const [isEditing, setIsEditing] = useState(false);

    const episodeOverrides = overrides.anime[anime.anilistId]?.episodes?.[episode];
    const [animePaheUrl, setAnimePaheUrl] = useState(episodeOverrides?.animepahe || '');
    const [vidnestUrl, setVidnestUrl] = useState(episodeOverrides?.vidnest || '');

    useEffect(() => {
        setAnimePaheUrl(episodeOverrides?.animepahe || '');
        setVidnestUrl(episodeOverrides?.vidnest || '');
    }, [episodeOverrides, episode]);

    if (!isAdmin) return null;

    const handleBlur = (source: StreamSource, value: string) => {
        updateEpisodeStreamUrl(anime.anilistId, episode, source, value);
    };

    return (
        <div className="mt-4">
            <button onClick={() => setIsEditing(!isEditing)} className="bg-gray-700 hover:bg-gray-600 text-cyan-300 text-sm font-semibold px-4 py-2 rounded-md transition-colors w-full text-left flex justify-between items-center">
                <span>Admin: Edit Episode URL</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isEditing ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isEditing && (
                <div className="bg-gray-800/50 p-4 mt-2 rounded-md space-y-4 animate-fade-in">
                    <p className="text-xs text-gray-400">Enter the full, direct URL for this specific episode. This will override all other settings.</p>
                    <div>
                        <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="epSource1">Source 1 Full URL (AnimePahe)</label>
                        <input
                            id="epSource1"
                            type="text"
                            value={animePaheUrl}
                            onChange={(e) => setAnimePaheUrl(e.target.value)}
                            onBlur={(e) => handleBlur(StreamSource.AnimePahe, e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="epSource2">Source 2 Full URL (Vidnest)</label>
                        <input
                            id="epSource2"
                            type="text"
                            value={vidnestUrl}
                            onChange={(e) => setVidnestUrl(e.target.value)}
                            onBlur={(e) => handleBlur(StreamSource.Vidnest, e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

interface AnimePlayerProps {
  anime: Anime;
  currentEpisode: number;
  currentSource: StreamSource;
  currentLanguage: StreamLanguage;
  onEpisodeChange: (episode: number) => void;
  onSourceChange: (source: StreamSource) => void;
  onLanguageChange: (language: StreamLanguage) => void;
  onBack: () => void;
}

const AnimePlayer: React.FC<AnimePlayerProps> = ({
  anime,
  currentEpisode,
  currentSource,
  currentLanguage,
  onEpisodeChange,
  onSourceChange,
  onLanguageChange,
  onBack
}) => {
  const { getStreamUrl } = useAdmin();
  const episodeCount = anime.episodes || 1;

  const streamUrl = getStreamUrl(anime.anilistId, currentEpisode, currentSource, currentLanguage);

  const episodes = Array.from({ length: episodeCount }, (_, i) => i + 1);

  const handleSourceChange = (source: StreamSource) => {
    onSourceChange(source);
    if (source === StreamSource.AnimePahe) {
      onLanguageChange(StreamLanguage.Sub);
    }
  };

  const renderControlButton = <T,>(value: T, currentValue: T, setter: (value: T) => void, text: string) => (
    <button
      onClick={() => setter(value)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        currentValue === value
          ? 'bg-cyan-500 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {text}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col animate-fade-in">
      <div className="container mx-auto p-4 flex-grow">
        <button onClick={onBack} className="mb-4 text-cyan-400 hover:text-cyan-300 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to details
        </button>
        <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
          <div className="aspect-video bg-black">
            <iframe
              key={streamUrl}
              src={streamUrl}
              title={`${anime.title} - Episode ${currentEpisode}`}
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
              className="w-full h-full border-0"
            ></iframe>
          </div>
          <div className="p-6">
            <h2 className="text-3xl font-bold text-white mb-2">{anime.title} - Episode {currentEpisode}</h2>
            <div className="flex flex-wrap gap-4 items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-400">Source:</span>
                {renderControlButton(StreamSource.AnimePahe, currentSource, handleSourceChange, 'Source 1')}
                {renderControlButton(StreamSource.Vidnest, currentSource, handleSourceChange, 'Source 2')}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-400">Language:</span>
                {renderControlButton(StreamLanguage.Sub, currentLanguage, onLanguageChange, 'SUB')}
                {currentSource !== StreamSource.AnimePahe &&
                  renderControlButton(StreamLanguage.Dub, currentLanguage, onLanguageChange, 'DUB')}
                {currentSource !== StreamSource.AnimePahe &&
                  renderControlButton(StreamLanguage.Hindi, currentLanguage, onLanguageChange, 'HINDI')}
              </div>
            </div>
            
            <AdminEpisodeEditor anime={anime} episode={currentEpisode} />
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-white">Episodes</h3>
                {episodeCount > 1 && (
                  <button
                    onClick={() => onEpisodeChange(episodeCount)}
                    className="bg-gray-700 text-cyan-300 hover:bg-cyan-500 hover:text-white text-xs font-semibold px-3 py-1 rounded-full transition-colors"
                  >
                    Latest Ep
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto bg-black/20 p-3 rounded-md grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {episodes.map(ep => (
                  <button
                    key={ep}
                    onClick={() => onEpisodeChange(ep)}
                    className={`aspect-square w-full flex items-center justify-center font-bold rounded-md transition-colors ${
                      ep === currentEpisode
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {ep}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimePlayer;
