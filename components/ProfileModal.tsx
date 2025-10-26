// components/ProfileModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    updateUserProfileAndAuth, 
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendEmailVerification
} from '../services/firebaseService';
import { auth } from '../services/firebase';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { DEFAULT_AVATAR_URL, PREDEFINED_AVATARS } from '../constants';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return 'Password must be at least 6 characters long.';
    return null;
};

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, firebaseUser, reloadUser } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.photoURL || DEFAULT_AVATAR_URL);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (isOpen && user) {
            setDisplayName(user.displayName || '');
            setSelectedAvatar(user.photoURL || DEFAULT_AVATAR_URL);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setError('');
            // Reset password change form visibility when modal opens
            setShowPasswordChange(false); 
        }
    }, [isOpen, user]);
    
    const handleSubmitProfile = async (e: React.FormEvent) => {
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

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser || !auth?.currentUser) return;
        setLoading(true);
        setError('');

        const newPasswordError = validatePassword(newPassword);
        if (newPasswordError) {
            setError(newPasswordError);
            setLoading(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('New passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowPasswordChange(false);
            setLoading(false);
            setError('Password updated successfully!');
            reloadUser();
            setTimeout(() => setError(''), 3000);
        } catch (err: any) {
            console.error("Error changing password:", err);
            if (err.code === 'auth/wrong-password') {
                setError('Incorrect current password.');
            } else if (err.code === 'auth/weak-password') {
                setError('New password is too weak.');
            } else if (err.code === 'auth/requires-recent-login') {
                setError('Please log out and log back in to change your password.');
            } else {
                setError(err.message || 'Failed to change password. Please try again.');
            }
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!firebaseUser) return;
        setLoading(true);
        setError('');
        try {
            await sendEmailVerification(firebaseUser);
            setError('Verification email sent! Please check your inbox.');
            setTimeout(() => setError(''), 5000);
        } catch (err: any) {
            setError(err.message || 'Failed to send verification email.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div ref={modalRef} className="bg-gray-900 text-white rounded-lg shadow-xl p-4 md:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cyan-400">Edit Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close profile modal">&times;</button>
                </div>
                
                {/* Scrollable content wrapper */}
                <div className="flex-grow overflow-y-auto pr-2">
                    <form onSubmit={handleSubmitProfile}>
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center text-sm mt-2 gap-2">
                                {user.emailVerified ? (
                                    <span className="text-green-500 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Email Verified</span>
                                ) : (
                                    <>
                                        <span className="flex items-center gap-1 text-yellow-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.342a.87.87 0 012.486 0l6.068 10.375c.346.593-.058 1.341-.755 1.341H2.801c-.697 0-1.101-.748-.755-1.341L8.257 3.342zM12 10a1 1 0 11-2 0 1 1 0 012 0zm-1 2a1 1 0 100 2h.01a1 1 0 100-2H11z" clipRule="evenodd" /></svg> Email Not Verified</span>
                                        <button type="button" onClick={handleResendVerification} className="text-cyan-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                                            {loading ? 'Sending...' : 'Resend Verification Email'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                        <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-600">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-700">
                        <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
                            Change Password
                            <button 
                                type="button" 
                                onClick={() => setShowPasswordChange(!showPasswordChange)}
                                className="text-gray-400 hover:text-white"
                                aria-expanded={showPasswordChange}
                                aria-controls="password-change-form"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform ${showPasswordChange ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </h3>
                        {showPasswordChange && (
                            <form id="password-change-form" onSubmit={handleChangePassword} className="animate-fade-in-fast">
                                <div className="mb-4">
                                    <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="currentPassword">Current Password</label>
                                    <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="newPassword">New Password</label>
                                    <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                                    {newPassword && validatePassword(newPassword) && <p className="text-red-400 text-xs mt-1">{validatePassword(newPassword)}</p>}
                                </div>
                                <div className="mb-6">
                                    <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="confirmNewPassword">Confirm New Password</label>
                                    <input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                                    {confirmNewPassword && newPassword !== confirmNewPassword && <p className="text-red-400 text-xs mt-1">New passwords do not match.</p>}
                                </div>
                                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                                <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-600">
                                    {loading ? 'Changing...' : 'Change Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;