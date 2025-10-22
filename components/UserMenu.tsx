// components/UserMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { DEFAULT_AVATAR_URL } from '../constants';

interface UserMenuProps {
    user: UserProfile;
    onLogout: () => void;
    onProfileClick: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onProfileClick }) => {
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
                <span className="hidden lg:inline font-semibold text-sm text-white">{user.displayName || 'User'}</span>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-fade-in-fast z-50">
                    <ul>
                        <li><button onClick={handleProfileClick} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Profile</button></li>
                        <li><button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Logout</button></li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UserMenu;