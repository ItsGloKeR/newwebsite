import React, { useState } from 'react';
import { FilterState, MediaSort } from '../types';
import InfoModal from './InfoModal';

// Icons
const LibraryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;
const AdFreeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const ProgressIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div>
        <div className="flex items-center gap-3 mb-2">
            <span className="text-cyan-400">{icon}</span>
            <h4 className="text-md font-bold text-white">{title}</h4>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
);

const DataSaverIndicator: React.FC = () => (
    <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-900/50 px-2 py-1 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6zM6 10a1 1 0 01-1-1V7a1 1 0 112 0v2a1 1 0 01-1 1zm8 0a1 1 0 01-1-1V7a1 1 0 112 0v2a1 1 0 01-1 1z" clipRule="evenodd" />
        </svg>
        <span>Data Saver On</span>
    </div>
);


interface FooterProps {
  onAdminClick: () => void;
  onNavigate: (filters: Partial<FilterState> & { list?: 'watchlist' | 'favorites' | 'continueWatching' }, title: string) => void;
  onLogoClick: () => void;
  isDataSaverActive: boolean;
}

const DiscordIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317,4.444c-0.457-0.222-0.937-0.4-1.437-0.545c-0.171,0.308-0.366,0.668-0.582,1.065 c-1.535-0.418-3.176-0.418-4.711,0C12.83,5.632,12.635,5.272,12.465,4.967c-0.499,0.145-0.979,0.323-1.436,0.545 C6.232,7.9,4.425,12.28,4.5,16.521c1.559,1.75,3.528,2.693,5.556,2.836c0.334-0.472,0.63-0.985,0.88-1.533 c-0.652-0.222-1.272-0.518-1.849-0.88c0.239-0.15,0.47-0.31,0.69-0.48C9.932,16.35,10,16.205,10,16.205 s-0.125-0.038-0.347-0.133c-0.786-0.34-1.44-0.786-1.946-1.32c0.003,0,0.005-0.002,0.008-0.003c0,0-0.031-0.018-0.088-0.057 c-0.231-0.165-0.448-0.345-0.647-0.536c-0.124-0.117-0.24-0.237-0.354-0.365c-0.002-0.002-0.003-0.004-0.005-0.005 c-0.244-0.27-0.47-0.553-0.676-0.845c-0.015-0.022-0.03-0.043-0.044-0.065c-0.291-0.413-0.55-0.848-0.771-1.3c-0.02-0.04-0.038-0.08-0.057-0.118c-0.323-0.71-0.57-1.458-0.73-2.235C4.01,10.743,4.02,7.2,6.389,4.967C6.389,4.967,6.4,4.96,6.402,4.954C6.402,4.954,6.402,4.954,6.402,4.954c0.46-0.51,1.03-0.94,1.69-1.28 c0.21-0.107,0.42-0.21,0.64-0.3c0.036-0.014,0.07-0.03,0.1-0.04c0.44-0.17,0.9-0.3,1.36-0.4c0.52-0.11,1.05-0.18,1.6-0.2 c0.02,0,0.04-0.004,0.06-0.004c0.55-0.04,1.1-0.06,1.65-0.06s1.1,0.02,1.65,0.06c0.02,0,0.04,0.004,0.06,0.004 c0.55,0.02,1.08,0.09,1.6,0.2c0.46,0.1,0.92,0.23,1.36,0.4c0.03,0.01,0.06,0.026,0.1,0.04c0.22,0.09,0.43,0.193,0.64,0.3 c0.66,0.34,1.23,0.77,1.69,1.28C17.6,4.96,17.611,4.967,17.611,4.967C20.016,7.23,19.95,10.77,19.95,10.77 c-0.16,0.777-0.407,1.525-0.73,2.235c-0.019,0.038-0.037,0.078-0.057,0.118c-0.221,0.452-0.48,0.887-0.771,1.3 c-0.014,0.022-0.029,0.043-0.044,0.065c-0.205,0.292-0.432,0.575-0.676,0.845c-0.002,0.001-0.003,0.003-0.005,0.005 c-0.114,0.128-0.23,0.248-0.354,0.365c-0.199,0.191-0.416,0.371-0.647,0.536c-0.057,0.039-0.088,0.057-0.088,0.057 c0.003,0.001,0.005,0.003,0.008,0.003c-0.475,0.505-1.09,0.92-1.81,1.25c-0.1,0.04-0.2,0.08-0.3,0.12c-0.17,0.09-0.35,0.17-0.53,0.25 c-0.577,0.264-1.197,0.56-1.849,0.88c0.25,0.548,0.546,1.061,0.88,1.533c2.028-0.143,3.997-1.086,5.556-2.836 C19.575,12.28,17.768,7.9,20.317,4.444z M10.2,13.2c-0.664,0-1.2-0.6-1.2-1.33c0-0.73,0.536-1.33,1.2-1.33s1.2,0.6,1.2,1.33 C11.4,12.6,10.864,13.2,10.2,13.2z M13.8,13.2c-0.664,0-1.2-0.6-1.2-1.33c0-0.73,0.536-1.33,1.2-1.33s1.2,0.6,1.2,1.33 C15,12.6,14.464,13.2,13.8,13.2z"/>
    </svg>
);

const Footer: React.FC<FooterProps> = ({ onAdminClick, onNavigate, onLogoClick, isDataSaverActive }) => {
    const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
    const currentYear = new Date().getFullYear();

    const aboutContent = (
        <>
            <p>Welcome to AniGloK, your ultimate destination for discovering and streaming your favorite anime. Our mission is to provide a sleek, fast, and user-friendly platform without the usual clutter. This project is a labor of love, built by fans for fans.</p>
            <p>We leverage powerful APIs like AniList to provide comprehensive details about thousands of anime titles. Our watch history feature is powered by Vidnest and Vidlink players, and all your progress is stored securely and privately on your own device's local storage.</p>
            <p>AniGloK is a non-profit, ad-free project. We do not host any of the content ourselves; we simply provide an organized interface to access content hosted by third-party services.</p>
            <p>Enjoy your stay, and happy watching!</p>
        </>
    );

    const contactContent = (
        <>
            <p>For any inquiries, suggestions, or issues, please feel free to reach out. The best way to contact us is through our official Discord server, where you can connect with the community and staff directly.</p>
            <p>Join our Discord: <a href="https://discord.gg/H9TtXfCumQ" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">https://discord.gg/H9TtXfCumQ</a></p>
            <p>Please note that we cannot provide support for issues related to the third-party video players, but we will do our best to assist with any site-related problems.</p>
        </>
    );

    const termsContent = (
        <>
            <h3 className="text-lg font-bold text-white mb-2">1. Acceptance of Terms</h3>
            <p>By accessing and using AniGloK, you accept and agree to be bound by the terms and provision of this agreement. This site is for personal and non-commercial use only.</p>
            <h3 className="text-lg font-bold text-white mt-4 mb-2">2. Content</h3>
            <p>AniGloK does not host any video content. All video streams are embedded from third-party services. We are not responsible for the accuracy, compliance, copyright, legality, decency, or any other aspect of the content of other linked sites. If you have any legal issues please contact the appropriate media file owners or host sites.</p>
            <h3 className="text-lg font-bold text-white mt-4 mb-2">3. User Conduct</h3>
            <p>You agree not to use the service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. You are responsible for your own conduct while using the site.</p>
        </>
    );

    const privacyContent = (
        <>
            <h3 className="text-lg font-bold text-white mb-2">1. Information We Collect</h3>
            <p>AniGloK does not require user accounts and does not collect any personally identifiable information from its users.</p>
            <h3 className="text-lg font-bold text-white mt-4 mb-2">2. Watch Progress</h3>
            <p>The "Continue Watching" feature relies on data provided by the embedded video players (Vidnest, Vidlink). This data, which includes watch time and episode numbers, is stored exclusively in your browser's Local Storage. This information is never transmitted to our servers and remains private to your device.</p>
            <h3 className="text-lg font-bold text-white mt-4 mb-2">3. Third-Party Services</h3>
            <p>We utilize third-party APIs (like AniList) to fetch anime data. We also embed third-party video players. These services may have their own privacy policies, and we encourage you to review them.</p>
        </>
    );

    const companyLinks = [
        { title: 'About Us', content: aboutContent },
        { title: 'Contact', content: contactContent },
        { title: 'Terms of Service', content: termsContent },
        { title: 'Privacy Policy', content: privacyContent },
    ];

    return (
        <>
            <footer className="bg-gray-950 text-gray-400 mt-16 border-t border-gray-800">
                <div className="container mx-auto max-w-screen-2xl px-6 py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
                        {/* Column 1: Brand & Features */}
                        <div className="sm:col-span-2 lg:col-span-2">
                             <button onClick={onLogoClick} className="mb-4 text-left">
                                <svg width="140" height="32" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16.6923 4.5L2.84615 27.5H30.5385L16.6923 4.5Z" stroke="#22d3ee" strokeWidth="2"/>
                                    <path d="M16.6923 15.5L11.7692 23.5H21.6154L16.6923 15.5Z" fill="white"/>
                                    <text x="40" y="23" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="900" fill="#22d3ee">
                                        Ani
                                        <tspan fill="white">GloK</tspan>
                                    </text>
                                </svg>
                            </button>
                            <p className="text-sm leading-relaxed mb-8">
                            Your sleek, no-BS destination for discovering and tracking anime.
                            </p>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
                                <Feature
                                    icon={<LibraryIcon />}
                                    title="Vast Library"
                                    description="Explore thousands of titles."
                                />
                                <Feature
                                    icon={<AdFreeIcon />}
                                    title="Ad-Free"
                                    description="Enjoy uninterrupted streaming."
                                />
                                <Feature
                                    icon={<ProgressIcon />}
                                    title="Track Progress"
                                    description="Save your watch history."
                                />
                            </div>
                        </div>

                        {/* Column 2: Discover */}
                        <div className="lg:col-span-1">
                            <h3 className="font-bold text-white mb-4">Discover</h3>
                            <ul className="space-y-3">
                                <li><button onClick={() => onNavigate({ sort: MediaSort.TRENDING_DESC }, 'Trending Anime')} className="hover:text-cyan-400 transition-colors">Trending</button></li>
                                <li><button onClick={() => onNavigate({ sort: MediaSort.POPULARITY_DESC }, 'Popular Anime')} className="hover:text-cyan-400 transition-colors">Popular</button></li>
                                <li><button onClick={() => onNavigate({ sort: MediaSort.SCORE_DESC }, 'Top Rated Anime')} className="hover:text-cyan-400 transition-colors">Top Rated</button></li>
                                <li><button onClick={() => onNavigate({ sort: MediaSort.START_DATE_DESC }, 'Newest Anime')} className="hover:text-cyan-400 transition-colors">Newest</button></li>
                            </ul>
                        </div>

                        {/* Column 3: Company */}
                        <div className="lg:col-span-1">
                            <h3 className="font-bold text-white mb-4">Company</h3>
                            <ul className="space-y-3">
                                {companyLinks.map(link => (
                                     <li key={link.title}>
                                        <button onClick={() => setModalContent(link)} className="hover:text-cyan-400 transition-colors">
                                            {link.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 4: Follow Us */}
                        <div className="lg:col-span-1">
                            <h3 className="font-bold text-white mb-4">Follow Us</h3>
                            <a href="https://discord.gg/H9TtXfCumQ" target="_blank" rel="noopener noreferrer" aria-label="Join our Discord server">
                                <DiscordIcon className="h-8 w-8 text-gray-400 hover:text-cyan-400 transition-colors" />
                            </a>
                        </div>
                    </div>

                    <hr className="border-gray-800 my-8" />

                    <div className="text-center text-sm">
                        <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2 mb-2">
                            <p>&copy; {currentYear} AniGloK. All Rights Reserved.</p>
                            {isDataSaverActive && <DataSaverIndicator />}
                        </div>
                        <p className="mt-2 text-xs">
                            This site does not store any files on our server, we only link to the media which is hosted on 3rd party services.
                            <button onClick={onAdminClick} className="text-cyan-500 hover:underline ml-2">Admin</button>
                        </p>
                    </div>
                </div>
            </footer>
            <InfoModal 
                isOpen={!!modalContent}
                onClose={() => setModalContent(null)}
                title={modalContent?.title || ''}
            >
                {modalContent?.content}
            </InfoModal>
        </>
    );
};

export default Footer;