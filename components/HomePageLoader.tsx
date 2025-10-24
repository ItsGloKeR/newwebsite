import React, { useState, useEffect } from 'react';

const messages = [
    "Conjuring the latest anime for you...",
    "Polishing the pixels to perfection...",
    "Unleashing the spirit of anime...",
    "Just a moment, grabbing the good stuff...",
    "Did you know? The longest-running anime is Sazae-san!",
    "Almost there... Get ready for an adventure!",
    "Warming up the streaming engine...",
    "Assembling your anime universe...",
];

const HomePageLoader: React.FC = () => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 2500); // Change message every 2.5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-white text-center p-4">
            <div className="w-24 h-24 mb-8 flex items-center justify-center">
                <div className="w-16 h-16 bg-cyan-400 rounded-full animate-bounce-squash relative shadow-lg">
                    <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-gray-900 rounded-full animate-eyes"></div>
                    <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-gray-900 rounded-full animate-eyes"></div>
                </div>
            </div>

            <div className="relative h-7 w-full max-w-md overflow-hidden mb-4">
                {messages.map((message, index) => (
                    <p
                        key={index}
                        className={`absolute inset-0 font-semibold text-lg text-gray-300 transition-all duration-500 ease-in-out ${
                            index === currentMessageIndex ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
                        }`}
                        style={{ transitionDelay: index === currentMessageIndex ? '300ms' : '0ms' }}
                    >
                        {message}
                    </p>
                ))}
            </div>
            
            <div className="w-full max-w-xs h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full animate-loader-bar"></div>
            </div>
            
            <style>{`
                @keyframes bounce-squash {
                    0%, 100% { transform: translateY(0) scale(1, 1); animation-timing-function: ease-in; }
                    50% { transform: translateY(-30px) scale(0.95, 1.05); animation-timing-function: ease-out; }
                    95% { transform: translateY(0) scale(1.05, 0.95); }
                }
                .animate-bounce-squash { animation: bounce-squash 1.5s ease-in-out infinite; }

                @keyframes eyes-blink {
                    0%, 40%, 100% { transform: scaleY(1); }
                    45% { transform: scaleY(0.1); }
                }
                .animate-eyes { animation: eyes-blink 3s infinite; }

                @keyframes loader-bar {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-loader-bar {
                    animation: loader-bar 10s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default HomePageLoader;
