import React, { useMemo } from 'react';
import { Anime } from '../types';
import { useAdmin } from '../contexts/AdminContext';
import { getLastPlayerSettings } from '../services/userPreferenceService';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';

interface MiniPlayerProps {
    anime: Anime;
    episode: number;
    onClose: () => void;
    onExpand: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ anime, episode, onClose, onExpand }) => {
    const { getStreamUrl } = useAdmin();
    const { titleLanguage } = useTitleLanguage();
    
    const streamUrl = useMemo(() => {
        const lastSettings = getLastPlayerSettings();
        return getStreamUrl({
            animeId: anime.anilistId,
            malId: anime.malId,
            episode,
            source: lastSettings.source,
            language: lastSettings.language,
            animeFormat: anime.format,
        });
    }, [anime, episode, getStreamUrl]);

    const title = titleLanguage === 'romaji' ? anime.romajiTitle : anime.englishTitle;
    
    return (
        <div className="fixed bottom-4 right-4 z-50 w-[340px] h-[191px] bg-gray-900 rounded-lg shadow-2xl animate-fade-in-fast flex flex-col overflow-hidden border border-gray-700">
            <div className="w-full h-full relative">
                <iframe
                    key={streamUrl}
                    src={streamUrl}
                    title={`${title} - Episode ${episode}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-presentation"
                    allowFullScreen
                    className="w-full h-full border-0"
                    scrolling="no"
                ></iframe>
            </div>
            <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start">
                <div className="flex-grow overflow-hidden pr-2">
                    <p className="text-white font-bold text-sm truncate">{title}</p>
                    <p className="text-gray-300 text-xs">Episode {episode}</p>
                </div>
                 <div className="flex-shrink-0 flex items-center gap-1">
                    <button onClick={onExpand} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-cyan-500 transition-colors" aria-label="Expand player">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zM12 10a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" /><path d="M.464 4.586a1 1 0 011.414 0L4 6.172V4a1 1 0 112 0v3.586l-1.5-1.5a1 1 0 01-1.414 1.414l-2.828-2.828a1 1 0 010-1.414zM15.536 15.414a1 1 0 01-1.414 0L12 13.828V16a1 1 0 11-2 0v-3.586l1.5 1.5a1 1 0 011.414 1.414l2.828 2.828a1 1 0 010 1.414z" /></svg>
                    </button>
                    <button onClick={onClose} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors" aria-label="Close player">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiniPlayer;