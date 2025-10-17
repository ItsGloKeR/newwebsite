import React from 'react';
import { Anime } from '../types';

interface SidebarProps {
  topAnime: Anime[];
  genres: string[];
  selectedGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
  onSelectAnime: (anime: Anime) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ topAnime, genres, selectedGenre, onSelectGenre, onSelectAnime }) => {
  return (
    <aside className="flex flex-col gap-8">
      {/* Top 10 List */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-cyan-400 pl-4">Top 10 Airing</h2>
        <div className="flex flex-col gap-4">
          {topAnime.map((anime, index) => (
            <div 
              key={anime.anilistId} 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onSelectAnime(anime)}
            >
              <div className="text-3xl font-black text-gray-700 w-8 text-center">{String(index + 1).padStart(2, '0')}</div>
              <img 
                src={anime.coverImage} 
                alt={anime.title} 
                className="w-12 h-16 object-cover rounded-md shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-500/30" 
              />
              <div>
                <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">{anime.title}</h3>
                <p className="text-sm text-gray-400">{anime.episodes} Episodes</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Genres List */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-cyan-400 pl-4">Genres</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSelectGenre(null)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              selectedGenre === null
                ? 'bg-cyan-500 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => onSelectGenre(genre)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                selectedGenre === genre
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
};

export default Sidebar;