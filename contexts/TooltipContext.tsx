import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import { Anime } from '../types';
import AnimeTooltip from '../components/AnimeTooltip';
import { useUserData } from './UserDataContext';

interface TooltipState {
    anime: Partial<Anime> & { anilistId: number };
    rect: DOMRect;
    showWatchButton: boolean;
}

interface TooltipContextType {
    showTooltip: (anime: Partial<Anime> & { anilistId: number }, rect: DOMRect, options?: { showWatchButton?: boolean }) => void;
    hideTooltip: () => void;
    keepTooltipOpen: () => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

interface TooltipProviderProps {
    children: ReactNode;
    onWatchNow: (anime: Partial<Anime> & { anilistId: number }) => void;
    onDetails: (anime: Partial<Anime> & { anilistId: number }) => void;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children, onWatchNow, onDetails }) => {
    const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
    const showTimeoutRef = useRef<number | null>(null);
    const hideTimeoutRef = useRef<number | null>(null);
    const { watchlist, toggleWatchlist } = useUserData();

    const hideTooltipImmediately = useCallback(() => {
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        setTooltipState(null);
    }, []);

    useEffect(() => {
        const handler = () => hideTooltipImmediately();
        // Listen for explicit hide events (e.g., navigation)
        window.addEventListener('hideTooltip', handler);
        // Also hide on scroll to prevent detached tooltips
        window.addEventListener('scroll', handler, { passive: true });

        return () => {
            window.removeEventListener('hideTooltip', handler);
            window.removeEventListener('scroll', handler);
        };
    }, [hideTooltipImmediately]);

    const showTooltip = useCallback((anime: Partial<Anime> & { anilistId: number }, rect: DOMRect, options?: { showWatchButton?: boolean }) => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = window.setTimeout(() => {
            setTooltipState({ anime, rect, showWatchButton: options?.showWatchButton ?? true });
        }, 400); // Delay before showing
    }, []);

    const hideTooltip = useCallback(() => {
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
        hideTimeoutRef.current = window.setTimeout(() => {
            setTooltipState(null);
        }, 200); // Delay before hiding to allow cursor to enter tooltip
    }, []);

    const keepTooltipOpen = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, []);
    
    const handleWatchNowWrapper = (anime: Partial<Anime> & { anilistId: number }) => {
        hideTooltipImmediately();
        onWatchNow(anime);
    };

    const handleDetailsWrapper = (anime: Partial<Anime> & { anilistId: number }) => {
        hideTooltipImmediately();
        onDetails(anime);
    };

    const value = { showTooltip, hideTooltip, keepTooltipOpen };

    return (
        <TooltipContext.Provider value={value}>
            {children}
            {tooltipState && (
                <AnimeTooltip 
                    anime={tooltipState.anime as Anime} 
                    rect={tooltipState.rect}
                    onWatchNow={handleWatchNowWrapper}
                    onDetails={handleDetailsWrapper}
                    onClose={hideTooltip}
                    onMouseEnter={keepTooltipOpen}
                    watchlist={watchlist}
                    toggleWatchlist={toggleWatchlist}
                    showWatchButton={tooltipState.showWatchButton}
                />
            )}
        </TooltipContext.Provider>
    );
};

export const useTooltip = (): TooltipContextType => {
    const context = useContext(TooltipContext);
    if (context === undefined) {
        throw new Error('useTooltip must be used within a TooltipProvider');
    }
    return context;
};