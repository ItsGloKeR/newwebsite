
import React, { useState, useEffect } from 'react';
import { HiAnime } from '../types';
import { getFeaturedAnime } from '../services/hianimeService';
import HiAnimeGrid from './HiAnimeGrid';
import LoadingSpinner from './LoadingSpinner';

const FeaturedSection: React.FC = () => {
    const [featuredAnime, setFeaturedAnime] = useState<HiAnime[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const anime = await getFeaturedAnime();
                setFeaturedAnime(anime);
            } catch (error) {
                console.error("Failed to fetch featured anime:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    const handleSelectAnime = (anime: HiAnime) => {
        // This is a placeholder. In a real app, this would likely
        // navigate to a details page for HiAnime content.
        console.log("Selected HiAnime:", anime.title);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (featuredAnime.length === 0) {
        return null;
    }

    return (
        <HiAnimeGrid 
            title="Featured on HiAnime"
            animeList={featuredAnime}
            onSelectAnime={handleSelectAnime}
        />
    );
};

export default FeaturedSection;
