// components/ProfileModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfileAndAuth } from '../services/firebaseService';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { DEFAULT_AVATAR_URL, PREDEFINED_AVATARS } from '../constants';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, firebaseUser, reloadUser } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.photoURL || DEFAULT_AVATAR_URL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (isOpen && user) {
            setDisplayName(user.displayName || '');
            setSelectedAvatar(user.photoURL || DEFAULT_AVATAR_URL);
            setError('');
        }
    }, [isOpen, user]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser) return;
        setLoading(true);
        setError('');

        try {
            await updateUserProfileAndAuth(firebaseUser, displayName, selectedAvatar);
            
            setLoading(false);
            onClose();
            reloadUser();

        } catch (err: any) {
            setError(err.message || 'Failed to update profile. Please try again.');
            console.error(err);
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div ref={modalRef} className="bg-gray-900 text-white rounded-lg shadow-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cyan-400">Edit Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close profile modal">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col items-center mb-6">
                        <img 
                            src={selectedAvatar || DEFAULT_AVATAR_URL} 
                            alt="Avatar Preview"
                            className="w-24 h-24 rounded-full object-cover mb-6 border-2 border-gray-700 bg-gray-800"
                        />
                        <div className="w-full">
                            <label className="block mb-3 text-sm font-bold text-gray-400 text-center">Choose an Avatar</label>
                            <div className="flex flex-wrap justify-center gap-3">
                                {PREDEFINED_AVATARS.map((avatarUrl, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setSelectedAvatar(avatarUrl)}
                                        className={`w-14 h-14 rounded-full p-1 transition-all duration-200 focus:outline-none ring-2 ring-offset-2 ring-offset-gray-900 ${
                                            selectedAvatar === avatarUrl ? 'ring-cyan-500' : 'ring-transparent hover:ring-cyan-400'
                                        }`}
                                        aria-label={`Select avatar ${index + 1}`}
                                    >
                                        <img src={avatarUrl} alt={`Avatar ${index + 1}`} className="w-full h-full rounded-full object-cover bg-gray-800" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="displayName">Display Name</label>
                        <input id="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="email">Email</label>
                        <input id="email" type="email" value={user.email || ''} className="w-full px-3 py-2 bg-gray-800 rounded text-gray-500" disabled />
                    </div>

                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-600">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;