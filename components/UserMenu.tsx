// components/UserMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, FilterState } from '../types';
import { DEFAULT_AVATAR_URL } from '../constants';

// Icons
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;


interface UserMenuProps {
    user: UserProfile;
    onLogout: () => void;
    onProfileClick: () => void;
    onNavigate: (filters: Partial<FilterState> & { list?: 'watchlist' | 'favorites' | 'continue-watching' }, title: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onProfileClick, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleNavigation = (list: 'watchlist' | 'favorites' | 'continue-watching', title: string) => {
        setIsOpen(false);
        onNavigate({ list }, title);
    };

    const handleLogout = () => {
        setIsOpen(false);
        onLogout();
    };

    const handleProfileClick = () => {
        setIsOpen(false);
        onProfileClick();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <img 
                    src={user.photoURL || DEFAULT_AVATAR_URL} 
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full border-2 border-gray-600 hover:border-cyan-400 transition-colors object-cover"
                />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-fade-in-fast z-50">
                     <div className="p-4 border-b border-gray-700">
                        <p className="font-semibold text-white truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <ul>
                        <li><button onClick={() => handleNavigation('watchlist', 'My List')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3"><ListIcon /> My List</button></li>
                        <li><button onClick={() => handleNavigation('favorites', 'My Favorites')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3"><HeartIcon /> Favorites</button></li>
                        <li><button onClick={() => handleNavigation('continue-watching', 'Continue Watching')} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3"><HistoryIcon /> Continue Watching</button></li>
                    </ul>
                    <div className="border-t border-gray-700">
                        <ul>
                            <li><button onClick={handleProfileClick} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3"><SettingsIcon /> Profile</button></li>
                            <li><button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3"><LogoutIcon /> Logout</button></li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;