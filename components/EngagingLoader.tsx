import React from 'react';
import Logo from './Logo';

interface EngagingLoaderProps {
    status: 'loading' | 'error' | 'loaded' | 'idle';
    message: string;
    onRetry: () => void;
    onCancel: () => void;
}

const EngagingLoader: React.FC<EngagingLoaderProps> = ({ status, message, onRetry, onCancel }) => {
    if (status !== 'loading' && status !== 'error') {
        return null;
    }

    return (
        <div
            className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6 text-white p-4 animate-fade-in"
            onClick={status === 'loading' ? onCancel : undefined}
        >
            {status === 'loading' && (
                <>
                    <div className="relative w-24 h-24 cursor-pointer">
                        <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-pulse"></div>
                        <div className="absolute inset-2 rounded-full bg-cyan-500/30 animate-pulse [animation-delay:0.2s]"></div>
                        <div className="absolute inset-4 flex items-center justify-center">
                            <Logo width={64} height={64} />
                        </div>
                    </div>
                    <p className="text-lg font-semibold">{message}</p>
                    <p className="text-sm text-gray-400 -mt-4">(Click anywhere to dismiss)</p>
                </>
            )}
            {status === 'error' && (
                <>
                    <div className="text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="text-lg font-bold">Failed to load source</p>
                    <p className="text-sm text-gray-400 -mt-4 text-center max-w-xs">This can happen due to high traffic or a temporary issue with the provider.</p>
                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={onRetry}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-md transition-colors"
                        >
                            Try Next Source
                        </button>
                        <button
                            onClick={onCancel}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default EngagingLoader;