import React, { useState } from 'react';
import { FilterState, MediaSort } from '../types';
import InfoModal from './InfoModal';

// Icons
const LibraryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;
const AdFreeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const ProgressIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-cyan-400">{icon}</span>
            <h4 className="text-sm font-bold text-white">{title}</h4>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
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
  onNavigate: (filters: Partial<FilterState> & { list?: 'watchlist' | 'favorites' | 'continue-watching' }, title: string) => void;
  onLogoClick: () => void;
  isDataSaverActive: boolean;
}

const DiscordIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0.5 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.54101C18.7873 3.82774 17.147 3.30224 15.4319 3.00126C15.4007 2.99545 15.3695 3.00997 15.3534 3.039C15.1424 3.4203 14.9087 3.91774 14.7451 4.30873C12.9004 4.02808 11.0652 4.02808 9.25832 4.30873C9.09465 3.90905 8.85248 3.4203 8.64057 3.039C8.62448 3.01094 8.59328 2.99642 8.56205 3.00126C6.84791 3.30128 5.20756 3.82678 3.67693 4.54101C3.66368 4.54681 3.65233 4.5565 3.64479 4.56907C0.533392 9.29283 -0.31895 13.9005 0.0991801 18.451C0.101072 18.4733 0.11337 18.4946 0.130398 18.5081C2.18321 20.0401 4.17171 20.9701 6.12328 21.5866C6.15451 21.5963 6.18761 21.5847 6.20748 21.5585C6.66913 20.9179 7.08064 20.2424 7.43348 19.532C7.4543 19.4904 7.43442 19.441 7.39186 19.4246C6.73913 19.173 6.1176 18.8662 5.51973 18.5178C5.47244 18.4897 5.46865 18.421 5.51216 18.3881C5.63797 18.2923 5.76382 18.1926 5.88396 18.0919C5.90569 18.0736 5.93598 18.0697 5.96153 18.0813C9.88928 19.9036 14.1415 19.9036 18.023 18.0813C18.0485 18.0687 18.0788 18.0726 18.1015 18.091C18.2216 18.1916 18.3475 18.2923 18.4742 18.3881C18.5177 18.421 18.5149 18.4897 18.4676 18.5178C17.8697 18.8729 17.2482 19.173 16.5945 19.4236C16.552 19.4401 16.533 19.4904 16.5538 19.532C16.9143 20.2414 17.3258 20.9169 17.7789 21.5576C17.7978 21.5847 17.8319 21.5963 17.8631 21.5866C19.8241 20.9701 21.8126 20.0401 23.8654 18.5081C23.8834 18.4946 23.8948 18.4742 23.8967 18.452C24.3971 13.1911 23.0585 8.6212 20.3482 4.57004C20.3416 4.5565 20.3303 4.54681 20.317 4.54101ZM8.02002 15.6802C6.8375 15.6802 5.86313 14.577 5.86313 13.222C5.86313 11.8671 6.8186 10.7639 8.02002 10.7639C9.23087 10.7639 10.1958 11.8768 10.1769 13.222C10.1769 14.577 9.22141 15.6802 8.02002 15.6802ZM15.9947 15.6802C14.8123 15.6802 13.8379 14.577 13.8379 13.222C13.8379 11.8671 14.7933 10.7639 15.9947 10.7639C17.2056 10.7639 18.1705 11.8768 18.1516 13.222C18.1516 14.577 17.2056 15.6802 15.9947 15.6802Z" />
    </svg>
);

const Footer: React.FC<FooterProps> = ({ onNavigate, onLogoClick, isDataSaverActive }) => {
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
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
                        {/* Column 1: Brand & Features */}
                        <div className="col-span-2 lg:col-span-2">
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
                             <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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