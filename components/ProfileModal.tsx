// components/ProfileModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadAvatar, updateUserProfileAndAuth } from '../services/firebaseService';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, firebaseUser } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(user?.photoURL || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPreview(user.photoURL || null);
        }
    }, [user]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser) return;
        setLoading(true);
        setError('');

        try {
            let newAvatarUrl: string | undefined = undefined;
            if (avatarFile) {
                const uploadedUrl = await uploadAvatar(firebaseUser.uid, avatarFile);
                if (uploadedUrl) {
                    newAvatarUrl = uploadedUrl;
                } else {
                    throw new Error("Avatar upload failed.");
                }
            }
            
            await updateUserProfileAndAuth(firebaseUser, displayName, newAvatarUrl);
            onClose();

        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error(err);
        } finally {
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
                            src={preview || `https://api.dicebear.com/8.x/initials/svg?seed=${displayName || user.email}`} 
                            alt="Avatar Preview"
                            className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-gray-700"
                        />
                        <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm">
                            Change Avatar
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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
