import React, { useState, useEffect } from 'react';
import { Anime, FilterState, MediaFormat, MediaSort, MediaStatus } from '../types';
import { getHomePageData } from '../services/anilistService';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface LandingPageProps {
  onEnter: (searchTerm?: string) => void;
  onLogoClick: () => void;
  onNavigate: (filters: Partial<FilterState>, title: string) => void;
}

// Icon Components
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>;
const MovieIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm1 4a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm10 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const TVSeriesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0v6h10V5H5z" clipRule="evenodd" /><path d="M7 15h6v1H7v-1z" /></svg>;
const PopularIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.84 3.49a1 1 0 011.118 1.666l-2.863 4.312a1 1 0 00.325 1.488l4.463 2.231a1 1 0 01.554 1.326l-2.04 4.081a1 1 0 01-1.78-.9l1.297-2.592-3.125-1.562a3 3 0 01-.975-4.464L12.84 3.49zM6.86 3.49a1 1 0 011.118 1.666l-2.863 4.312a1 1 0 00.325 1.488l4.463 2.231a1 1 0 01.554 1.326l-2.04 4.081a1 1 0 01-1.78-.9l1.297-2.592-3.125-1.562a3 3 0 01-.975-4.464L6.86 3.49z" clipRule="evenodd" /></svg>;
const AiringIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.99 2.05c.53 0 1.04.08 1.54.23l-1.28 1.28A5.95 5.95 0 004.28 7.5l-1.28 1.28A7.94 7.94 0 019.99 2.05zM2.06 9.99a7.94 7.94 0 016.71-7.71l-1.28 1.28A5.95 5.95 0 003.5 12.5l-1.28 1.28A7.94 7.94 0 012.06 10zM10 4a6 6 0 100 12 6 6 0 000-12zM10 14a4 4 0 110-8 4 4 0 010 8z" /></svg>;


const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onLogoClick, onNavigate }) => {
    const [popularAnime, setPopularAnime] = useState<Anime[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch popular anime for the visual collage
                const { popular } = await getHomePageData();
                setPopularAnime(popular.slice(0, 8)); // Use 8 images for a nice grid
            } catch (error) {
                console.error("Failed to fetch popular anime for landing page", error);
            }
        };
        fetchData();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            onEnter(searchTerm.trim());
        } else {
            onEnter();
        }
    };

    const handleNavClick = (filters: Partial<FilterState>, title: string) => {
        onNavigate(filters, title);
        onEnter(); // Transition to the main app view
    };

    const topSearches = [
        'My Hero Academia', 'One-Punch Man', 'One Piece', 'Demon Slayer', 'Spy x Family', 'Jujutsu Kaisen', 'Attack on Titan', 'Naruto', 'Chainsaw Man', 'Bleach'
    ];
    
    // Simple utility to get different rotations for the image collage
    const getRotationClass = (index: number) => {
        const rotations = ['-rotate-2', 'rotate-3', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-3'];
        return rotations[index % rotations.length];
    };

    const navLinks = [
        { title: 'Home', icon: <HomeIcon />, action: () => onEnter() },
        { title: 'Movies', icon: <MovieIcon />, action: () => handleNavClick({ formats: [MediaFormat.MOVIE] }, 'Movies') },
        { title: 'TV Series', icon: <TVSeriesIcon />, action: () => handleNavClick({ formats: [MediaFormat.TV, MediaFormat.TV_SHORT] }, 'TV Series') },
        { title: 'Most Popular', icon: <PopularIcon />, action: () => handleNavClick({ sort: MediaSort.POPULARITY_DESC }, 'Most Popular Anime') },
        { title: 'Top Airing', icon: <AiringIcon />, action: () => handleNavClick({ statuses: [MediaStatus.RELEASING], sort: MediaSort.POPULARITY_DESC }, 'Top Airing Anime') },
    ];

    return (
    <div className="bg-gray-950 text-white min-h-screen font-sans overflow-hidden">
      {/* Background Gradients */}
      <div 
        className="absolute inset-0 bg-gray-900 opacity-20" 
        style={{
          backgroundImage: 'radial-gradient(circle at top right, #22d3ee 0%, transparent 40%), radial-gradient(circle at bottom left, #0891b2 0%, transparent 50%)'
        }}>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="container mx-auto p-4 flex justify-between items-center">
             <button onClick={onLogoClick} aria-label="Go to landing page">
                <svg width="105" height="24" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.6923 4.5L2.84615 27.5H30.5385L16.6923 4.5Z" stroke="#22d3ee" strokeWidth="2"/>
                    <path d="M16.6923 15.5L11.7692 23.5H21.6154L16.6923 15.5Z" fill="white"/>
                    <text x="40" y="23" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="900" fill="#22d3ee">
                        Ani
                        <tspan fill="white">GloK</tspan>
                    </text>
                </svg>
            </button>
            <nav className="hidden md:flex items-center gap-8">
                {navLinks.map(link => (
                    <button key={link.title} onClick={link.action} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold">
                        {link.icon}
                        <span>{link.title}</span>
                    </button>
                ))}
            </nav>
            {/* Placeholder for potential right-side items like login button */}
            <div className="w-[105px]"></div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow flex items-center">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left Column: Content */}
                <div className="text-left animate-fade-in">
                    <h1 className="text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-lg">Your Universe of Anime Awaits.</h1>
                    
                     <p className="mt-6 max-w-lg text-lg text-gray-300">
                        Stream thousands of series and movies, ad-free. Track your progress and discover your next favorite show.
                    </p>
                    
                    <form onSubmit={handleSearch} className="mt-8">
                         <div className="relative w-full max-w-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search anime..."
                                className="w-full bg-gray-900/80 text-white rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all border border-gray-700"
                            />
                        </div>
                    </form>
                    
                    <div className="mt-4 text-left max-w-lg">
                        <span className="font-semibold text-white mr-2 text-sm">Top Searches:</span>
                        <span className="text-gray-400 text-sm">
                            {topSearches.map((term, index) => (
                                <React.Fragment key={term}>
                                    <button onClick={() => onEnter(term)} className="hover:text-cyan-400 transition-colors">
                                        {term}
                                    </button>
                                    {index < topSearches.length - 1 && ', '}
                                </React.Fragment>
                            ))}
                        </span>
                    </div>

                    <div className="mt-10">
                        <button
                            onClick={() => onEnter()}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center gap-3 text-lg"
                        >
                            <span>View Full Site</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Right Column: Image Collage */}
                <div className="hidden lg:block relative h-96 animate-fade-in">
                    <div className="grid grid-cols-4 grid-rows-2 gap-4 h-full">
                         {popularAnime.map((anime, index) => (
                            <div key={anime.anilistId} className={`relative col-span-2 row-span-2 flex items-center justify-center p-2`}>
                               <img 
                                src={anime.coverImage} 
                                alt={anime.englishTitle} 
                                className={`rounded-lg shadow-2xl object-cover w-full h-full max-w-[200px] max-h-[300px] transform transition-transform duration-500 hover:scale-110 hover:rotate-0 ${getRotationClass(index)}`}
                                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
                                />
                            </div>
                        )).slice(0, 2)}
                        {popularAnime.map((anime, index) => (
                            <div key={anime.anilistId} className="relative flex items-center justify-center p-1">
                                <img 
                                src={anime.coverImage} 
                                alt={anime.englishTitle} 
                                className={`rounded-md shadow-xl object-cover w-full h-full max-w-[100px] max-h-[150px] transform transition-transform duration-500 hover:scale-110 hover:rotate-0 ${getRotationClass(index + 2)}`}
                                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
                                />
                            </div>
                        )).slice(2, 8)}
                    </div>
                </div>
           </div>
        </main>

        <footer className="text-center py-6 mt-8 text-gray-500 text-sm border-t border-gray-800/50">
            <p>&copy; {new Date().getFullYear()} AniGloK. Your ad-free anime universe.</p>
        </footer>
      </div>
    </div>
    );
};

export default LandingPage;