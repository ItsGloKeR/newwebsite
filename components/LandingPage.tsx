import React, { useState, useEffect, useMemo } from 'react';
import { Anime, FilterState, MediaFormat, MediaSort, MediaStatus } from '../types';
import { getLandingPageData } from '../services/anilistService';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import InfoModal from './InfoModal';

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
const AiringIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.99 2.05c.53 0 1.04 .08 1.54 .23l-1.28 1.28A5.95 5.95 0 004.28 7.5l-1.28 1.28A7.94 7.94 0 019.99 2.05zM2.06 9.99a7.94 7.94 0 016.71-7.71l-1.28 1.28A5.95 5.95 0 003.5 12.5l-1.28 1.28A7.94 7.94 0 012.06 10zM10 4a6 6 0 100 12 6 6 0 000-12zM10 14a4 4 0 110-8 4 4 0 010 8z" /></svg>;

// Redesigned Feature Graphics
const LibraryGraphic = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><path d="M48 58V8a2 2 0 00-2-2H18a2 2 0 00-2 2v50a2 2 0 002 2h28a2 2 0 002-2z" fill="#374151" stroke="#22d3ee" strokeWidth="2"/><path d="M40 54V12a2 2 0 00-2-2H10a2 2 0 00-2 2v42a2 2 0 002 2h28a2 2 0 002-2z" fill="#1f2937" stroke="#22d3ee" strokeWidth="2"/><path d="M32 50V16a2 2 0 00-2-2H2a2 2 0 00-2 2v34a2 2 0 002 2h28a2 2 0 002-2z" fill="#0891b2" stroke="#67e8f9" strokeWidth="2"/></svg>;
const AdFreeGraphic = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><path d="M32 2C16.5 2 4 10.5 4 22c0 15 28 40 28 40s28-25 28-40C60 10.5 47.5 2 32 2z" fill="#1f2937" stroke="#22d3ee" strokeWidth="2"/><path d="M24 32l6 6 10-10" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>;
const ProgressGraphic = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><path d="M48 2H16a4 4 0 00-4 4v54l19-9 19 9V6a4 4 0 00-4-4z" fill="#1f2937" stroke="#22d3ee" strokeWidth="2"/><path d="M22 24h20M22 34h12" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round"/></svg>;
const HDGraphic = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><rect x="4" y="12" width="56" height="40" rx="4" fill="#1f2937" stroke="#22d3ee" strokeWidth="2"/><text x="32" y="44" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="900" fill="#67e8f9" textAnchor="middle">1080p</text></svg>;
const NoSignupGraphic = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><circle cx="32" cy="32" r="28" fill="#1f2937" stroke="#22d3ee" strokeWidth="2"/><path d="M21 18l18 14-18 14V18z" fill="#67e8f9"/><path d="M43 18v28" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round"/></svg>;
const MultiSourceGraphic = () => <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><path d="M10 18 C 20 10, 44 10, 54 18" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M10 32 C 20 24, 44 24, 54 32" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M10 46 C 20 38, 44 38, 54 46" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M32 46 V 58" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round"/><path d="M24 58 h 16" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round"/></svg>;


const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onLogoClick, onNavigate }) => {
    const [popularAnime, setPopularAnime] = useState<Anime[]>([]);
    const [collageAnime, setCollageAnime] = useState<Anime[]>([]);
    const [imageOpacity, setImageOpacity] = useState([1, 1, 1, 1, 1]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { popular } = await getLandingPageData();
                setPopularAnime(popular);
                setCollageAnime(popular.slice(0, 5)); // Initial 5 images
            } catch (error) {
                console.error("Failed to fetch popular anime for landing page", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (popularAnime.length <= 5) return;

        const animationDuration = 500; // ms for the fade
        const intervalDuration = 3000; // ms between swaps

        const interval = setInterval(() => {
            // 1. Pick a random image position to swap
            const indexToSwap = Math.floor(Math.random() * 5);

            // 2. Trigger fade out
            setImageOpacity(currentOpacity => {
                const newOpacity = [...currentOpacity];
                newOpacity[indexToSwap] = 0;
                return newOpacity;
            });

            // 3. After fade out, swap the image source and fade back in
            setTimeout(() => {
                setCollageAnime(currentCollage => {
                    const currentIds = new Set(currentCollage.map(a => a.anilistId));
                    const availableForSwap = popularAnime.filter(a => !currentIds.has(a.anilistId));
                    
                    if (availableForSwap.length === 0) {
                        return currentCollage; // No new images to swap in
                    }

                    const newAnime = availableForSwap[Math.floor(Math.random() * availableForSwap.length)];
                    const newCollage = [...currentCollage];
                    newCollage[indexToSwap] = newAnime;
                    return newCollage;
                });

                // Trigger fade in
                setImageOpacity(currentOpacity => {
                    const newOpacity = [...currentOpacity];
                    newOpacity[indexToSwap] = 1;
                    return newOpacity;
                });

            }, animationDuration);

        }, intervalDuration);

        return () => clearInterval(interval);
    }, [popularAnime]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onEnter(searchTerm.trim() || undefined);
    };

    const handleNavClick = (filters: Partial<FilterState>, title: string) => {
        onNavigate(filters, title);
        onEnter();
    };

    const topSearches = ['My Hero Academia', 'One-Punch Man', 'One Piece', 'Demon Slayer', 'Spy x Family', 'Jujutsu Kaisen', 'Attack on Titan', 'Naruto', 'Chainsaw Man', 'Bleach'];
    
    const navLinks = [
        { title: 'Home', icon: <HomeIcon />, action: () => onEnter() },
        { title: 'Movies', icon: <MovieIcon />, action: () => handleNavClick({ formats: [MediaFormat.MOVIE] }, 'Movies') },
        { title: 'TV Series', icon: <TVSeriesIcon />, action: () => handleNavClick({ formats: [MediaFormat.TV, MediaFormat.TV_SHORT] }, 'TV Series') },
        { title: 'Most Popular', icon: <PopularIcon />, action: () => handleNavClick({ sort: MediaSort.POPULARITY_DESC }, 'Most Popular Anime') },
        { title: 'Top Airing', icon: <AiringIcon />, action: () => handleNavClick({ statuses: [MediaStatus.RELEASING], sort: MediaSort.POPULARITY_DESC }, 'Top Airing Anime') },
    ];
    
    const features = [
        { title: "Vast Library", description: "Explore thousands of titles from multiple sources, all in one place.", graphic: LibraryGraphic },
        { title: "Ad-Free Experience", description: "Enjoy uninterrupted streaming without annoying pop-ups or banners.", graphic: AdFreeGraphic },
        { title: "Track Your Progress", description: "Automatically save your watch history across devices.", graphic: ProgressGraphic },
        { title: "HD Quality", description: "Stream in beautiful high definition. Enjoy a crisp, clear picture on all your devices.", graphic: HDGraphic },
        { title: "No Sign-Up Required", description: "Jump right into the action. No account needed to start watching immediately.", graphic: NoSignupGraphic },
        { title: "Multi-Source Streaming", description: "Access content from various providers, ensuring you always find what you're looking for.", graphic: MultiSourceGraphic },
    ];
    
    const collageImageStyles = [
        { wrapper: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] max-w-[220px] transform -rotate-3 z-20", img: "shadow-2xl" },
        { wrapper: "absolute top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2 w-[35%] max-w-[180px] transform rotate-6 z-10", img: "shadow-2xl" },
        { wrapper: "absolute top-1/2 right-[20%] translate-x-1/2 -translate-y-1/2 w-[35%] max-w-[180px] transform -rotate-6 z-10", img: "shadow-2xl" },
        { wrapper: "absolute top-1/2 left-[5%] -translate-y-1/2 w-[30%] max-w-[150px] transform -rotate-12 z-0", img: "shadow-lg" },
        { wrapper: "absolute top-1/2 right-[5%] -translate-y-1/2 w-[30%] max-w-[150px] transform rotate-12 z-0", img: "shadow-lg" },
    ];

    const infoContent = (
      <>
          <p>AniGloK is a non-profit, ad-free project created by fans, for fans. Our goal is to provide a modern, user-friendly interface for discovering and tracking anime.</p>
          <p><strong>We do not host any of the content ourselves.</strong> All video streams are embedded from third-party services. We simply provide an organized way to access this content.</p>
          <p>All anime data, including titles, descriptions, and images, is sourced from the public AniList API. We are grateful for their incredible service which makes projects like this possible.</p>
      </>
    );

    return (
    <div className="bg-gray-950 text-white min-h-screen font-sans overflow-x-hidden relative">
      {/* New Background Elements */}
      <div className="absolute inset-0 z-0 opacity-40" style={{
        backgroundImage: 'radial-gradient(circle at top right, rgba(34, 211, 238, 0.4), transparent 50%), radial-gradient(circle at bottom left, rgba(8, 145, 178, 0.4), transparent 50%)',
      }}></div>
       <div className="absolute inset-0 z-0" style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="container mx-auto p-4 flex justify-between items-center">
             <button onClick={onLogoClick} aria-label="Go to landing page">
                <svg width="105" height="24" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.6923 4.5L2.84615 27.5H30.5385L16.6923 4.5Z" stroke="#22d3ee" strokeWidth="2"/><path d="M16.6923 15.5L11.7692 23.5H21.6154L16.6923 15.5Z" fill="white"/><text x="40" y="23" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="900" fill="#22d3ee">Ani<tspan fill="white">GloK</tspan></text>
                </svg>
            </button>
            <nav className="hidden md:flex items-center gap-8">{navLinks.map(link => (<button key={link.title} onClick={link.action} className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors font-semibold">{link.icon}<span>{link.title}</span></button>))}</nav>
            <div className="w-[105px]"></div>
        </header>
        
        <main className="flex-grow flex flex-col justify-center">
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        <div className="text-center lg:text-left animate-fade-in">
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-lg">The Ultimate Anime Streaming Destination.</h1>
                            <p className="mt-6 text-lg text-gray-300 max-w-lg mx-auto lg:mx-0">Discover, watch, and track your favorite anime seamlessly. All your shows, all in one place.</p>
                            <form onSubmit={handleSearch} className="mt-10 max-w-lg mx-auto lg:mx-0">
                                <div className="relative w-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search anime..." className="w-full bg-gray-900/80 text-white rounded-full py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all border border-gray-700" />
                                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 p-2 rounded-full hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors" aria-label="Submit search"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg></button>
                                </div>
                            </form>
                            <div className="mt-4 text-sm max-w-lg mx-auto lg:mx-0">
                                <span className="font-semibold text-white mr-2">Top Searches:</span>
                                <span className="text-gray-400">{topSearches.map((term, index) => (<React.Fragment key={term}><button onClick={() => onEnter(term)} className="hover:text-cyan-400 transition-colors">{term}</button>{index < topSearches.length - 1 && ', '}</React.Fragment>))}</span>
                            </div>
                            <div className="mt-10 flex justify-center lg:justify-start"><button onClick={() => onEnter()} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center gap-3 text-lg"><span>View Full Site</span><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div>
                        </div>
                        <div className="relative h-64 md:h-80 lg:h-96 w-full animate-fade-in mt-12 lg:mt-0">
                           {collageAnime.length > 0 && collageImageStyles.map((style, index) => (
                                <div
                                    key={collageAnime[index]?.anilistId || index}
                                    className={`${style.wrapper} transition-opacity duration-500 ease-in-out transition-transform hover:scale-105`}
                                    style={{ opacity: imageOpacity[index] }}
                                >
                                    <img
                                        src={collageAnime[index]?.coverImage || PLACEHOLDER_IMAGE_URL}
                                        alt={collageAnime[index]?.englishTitle}
                                        className={`w-full h-auto object-cover rounded-lg aspect-[2/3] ${style.img}`}
                                        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE_URL; }}
                                    />
                                </div>
                            ))}
                        </div>
                </div>
            </section>
        </main>
        
        <section className="container mx-auto px-4 my-24 md:my-32">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-white">Why Choose AniGloK?</h2>
                <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">A seamless, feature-rich experience for every anime fan, built with modern technology for speed and reliability.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature) => (
                    <div key={feature.title} className="bg-gray-900/50 p-8 rounded-lg text-center transform transition-transform duration-300 hover:-translate-y-2 border border-transparent hover:border-cyan-500/30 shadow-lg hover:shadow-cyan-500/10">
                        <div className="flex justify-center items-center h-20 mb-6">
                            <div className="w-20">
                                <feature.graphic />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>

        <section className="container mx-auto px-4 my-24 md:my-32 text-gray-300">
            <div className="max-w-4xl mx-auto bg-gray-900/50 p-8 rounded-lg">
                <h2 className="text-3xl font-black text-white text-center mb-6">AniGloK - The Best Site to Watch Anime Online for Free</h2>
                <p className="leading-relaxed mb-4">
                    Do you know that according to Google, the monthly search volume for anime related topics is up to over 1 Billion times? Anime is famous worldwide and it is no wonder we've seen a sharp rise in the number of free anime streaming sites.
                </p>
                <p className="leading-relaxed mb-8">
                    Just like free online movie streaming sites, anime watching sites are not created equally, some are better than the rest, so we've decided to build AniGloK to be one of the best free anime streaming sites for all anime fans in the world.
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">1/ What is AniGloK?</h3>
                <p className="leading-relaxed">
                    AniGloK is a free site to watch anime in ultra HD quality without any registration or payment. We are committed to being a completely ad-free platform, making it one of the safest and most enjoyable sites for free anime.
                </p>

                <h3 className="text-2xl font-bold text-white mt-8 mb-4">2/ Is AniGloK safe?</h3>
                <p className="leading-relaxed">
                    Yes. Safety is our top priority. Since AniGloK is ad-free, you are protected from the typical risks of malware and intrusive trackers often found on other streaming sites. We provide a clean and secure environment for you to enjoy your anime.
                </p>
                
                <h3 className="text-2xl font-bold text-white mt-8 mb-4">3/ So what makes AniGloK the best site to watch anime free online?</h3>
                <p className="leading-relaxed mb-6">
                    Before building AniGloK, we've checked many other free anime sites, and learnt from them. We only keep the good things and remove all the bad things from all the competitors, to put it in our website. Let's see how we're so confident about being the best site for anime streaming:
                </p>

                <ul className="space-y-4 list-disc pl-5">
                    <li>
                        <strong className="text-white">Safety:</strong> As an ad-free platform, we eliminate the risk of harmful ads. Your viewing experience is secure and uninterrupted.
                    </li>
                    <li>
                        <strong className="text-white">Content library:</strong> Our main focus is anime. You can find popular, classic, as well as current titles from all genres such as action, drama, kids, fantasy, horror, mystery, romance, school, comedy, and many more, all sourced from the comprehensive AniList database.
                    </li>
                    <li>
                        <strong className="text-white">Quality/Resolution:</strong> All titles are available in the best possible resolution. Our player is designed to provide a high-quality stream, typically 720p or even 1080p, ensuring a great experience.
                    </li>
                    <li>
                        <strong className="text-white">Streaming experience:</strong> Compared to other anime streaming sites, the loading speed at AniGloK is faster. Our modern design and technology ensure a smooth and responsive experience.
                    </li>
                    <li>
                        <strong className="text-white">Updates:</strong> Our library is updated automatically with the latest information, new releases, and airing schedules directly from AniList, so you'll never run out of what to watch.
                    </li>
                    <li>
                        <strong className="text-white">User interface:</strong> Our UI and UX makes it easy for anyone to navigate. You can figure out how to use our site after a quick look. If you want to watch a specific title, search for it via the search box. If you want to look for suggestions, you can use the site's categories or simply scroll down for new releases.
                    </li>
                    <li>
                        <strong className="text-white">Device compatibility:</strong> AniGloK works perfectly on both your mobile and desktop, with a responsive design that adapts to any screen size.
                    </li>
                    <li>
                        <strong className="text-white">Customer care:</strong> We are active on our Discord for any help, queries, or business-related inquiries. We are always looking to improve the user experience based on feedback.
                    </li>
                </ul>

                <p className="leading-relaxed mt-8">
                    So if you're looking for a trustworthy and safe site for your anime streaming, give AniGloK a try. And if you like us, please help us to spread the word and do not forget to bookmark our site.
                </p>

                <p className="leading-relaxed mt-4">Thank you!</p>
            </div>
        </section>


        <footer className="text-center py-6 text-gray-500 text-sm border-t border-gray-800/50 mt-auto">
            <p>&copy; {new Date().getFullYear()} AniGloK. Your ad-free anime universe.</p>
            <button onClick={() => setIsInfoModalOpen(true)} className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-cyan-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                Disclaimer & Info
            </button>
        </footer>
      </div>

      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} title="About This Project">{infoContent}</InfoModal>
    </div>
    );
};

export default LandingPage;