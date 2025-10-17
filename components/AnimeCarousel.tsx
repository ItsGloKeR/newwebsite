
import React from 'react';
import { Anime } from '../types';
import CarouselCard from './CarouselCard';

interface AnimeCarouselProps {
  title: string;
  animeList: Anime[];
  onSelectAnime: (anime: Anime) => void;
}

const AnimeCarousel: React.FC<AnimeCarouselProps> = ({ title, animeList, onSelectAnime }) => {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-cyan-400 pl-4">{title}</h2>
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 carousel-scrollbar">
        {animeList.map(anime => (
          <CarouselCard key={anime.anilistId} anime={anime} onSelect={onSelectAnime} />
        ))}
      </div>
    </section>
  );
};

export default AnimeCarousel;
