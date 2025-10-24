import React, { useState, useEffect } from 'react';

const messages = [
    "Conjuring the latest anime for you...",
    "Polishing the pixels...",
    "Unleashing the spirit of anime...",
    "Just a moment, grabbing the good stuff...",
    "Did you know? The longest-running anime is Sazae-san!",
    "Almost there... Get ready for an adventure!",
];

const EngagingLoader: React.FC<{className?: string}> = ({ className }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 2500); // Change message every 2.5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`w-full flex flex-col items-center justify-center text-white text-center p-4 ${className}`}>
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6">
                <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                <div 
                    className="absolute inset-0 border-4 border-cyan-500 rounded-full animate-spin"
                    style={{
                        animationTimingFunction: 'linear',
                        clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)'
                    }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 4L2 28H30L16 4Z" stroke="#22d3ee" strokeWidth="2.5" fill="none"/>
                        <path d="M16 15L11 23H21L16 15Z" fill="white"/>
                    </svg>
                </div>
            </div>

            <div className="relative h-7 w-full max-w-md overflow-hidden">
                {messages.map((message, index) => (
                    <p
                        key={index}
                        className={`absolute inset-0 font-semibold text-lg text-gray-300 transition-opacity duration-500 ease-in-out ${
                            index === currentMessageIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {message}
                    </p>
                ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">Loading your anime universe...</p>
        </div>
    );
};

export default EngagingLoader;