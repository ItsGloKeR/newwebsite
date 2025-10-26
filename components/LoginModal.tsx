// components/LoginModal.tsx
import React, { useState, useRef } from 'react';
import { 
    signInWithGoogle, 
    signInWithEmail,
    signUpWithEmail,
    createUserProfileDocument,
    sendPasswordResetEmail, // Added
    sendEmailVerification,  // Added
    setPersistence,         // Added
    browserLocalPersistence, // Added
    browserSessionPersistence // Added
} from '../services/firebaseService';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { auth } from '../services/firebase'; // Import auth instance

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Helper for Firebase error messages
const getAuthErrorMessage = (code: string): string => {
    switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try logging in.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password is too weak. Please choose a stronger one.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in cancelled.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};

// Password strength validation regex
const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasNumber = /[0-9]/;
const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!hasUppercase.test(pwd)) return 'Password must contain at least one uppercase letter.';
    if (!hasLowercase.test(pwd)) return 'Password must contain at least one lowercase letter.';
    if (!hasNumber.test(pwd)) return 'Password must contain at least one number.';
    if (!hasSpecialChar.test(pwd)) return 'Password must contain at least one special character.';
    return null;
};

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true); // Added "Remember Me" state
    const [showForgotPassword, setShowForgotPassword] = useState(false); // Added for password reset
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState(''); // Added for password reset email
    const [resetEmailSent, setResetEmailSent] = useState(false); // Added for password reset success
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) return 'Password must be at least 8 characters long.';
        if (!hasUppercase.test(pwd)) return 'Password must contain at least one uppercase letter.';
        if (!hasLowercase.test(pwd)) return 'Password must contain at least one lowercase letter.';
        if (!hasNumber.test(pwd)) return 'Password must contain at least one number.';
        if (!hasSpecialChar.test(pwd)) return 'Password must contain at least one special character.';
        return null;
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const user = await signInWithGoogle();
            if (user) {
                await createUserProfileDocument(user);
                onClose();
            } else {
                setError('Failed to sign in with Google. Please try again.');
            }
        } catch (err: any) {
            setError(getAuthErrorMessage(err.code || 'default'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!auth) {
            setError('Authentication service not available.');
            setLoading(false);
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError && !isLoginView) { // Only validate for sign-up or if changing password (in profile modal)
            setError(passwordError);
            setLoading(false);
            return;
        }

        if (!isLoginView) { // Sign Up Specific Validations
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                setLoading(false);
                return;
            }
        }
        
        try {
            // Set persistence based on "Remember Me" checkbox
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

            let user = null;
            if (isLoginView) {
                user = await signInWithEmail(email, password);
            } else {
                user = await signUpWithEmail(email, password);
                if (user) {
                    await sendEmailVerification(user); // Send verification email after sign-up
                    setError('Account created! Please verify your email to log in.'); // Success message for sign-up
                    setIsLoginView(true); // Switch to login view after successful sign-up
                }
            }
            if (user && isLoginView) { // Only close if successfully logged in (not just signed up)
                onClose();
            } else if (user && !isLoginView) {
                // If sign-up was successful, don't close the modal, let the user see the verification message
            }
        } catch (err: any) {
            setError(getAuthErrorMessage(err.code || 'default'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResetEmailSent(false);

        if (!auth) {
            setError('Authentication service not available.');
            setLoading(false);
            return;
        }

        try {
            await sendPasswordResetEmail(auth, forgotPasswordEmail);
            setResetEmailSent(true);
            setError('');
        } catch (err: any) {
            setError(getAuthErrorMessage(err.code || 'default'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div ref={modalRef} className="bg-gray-900 text-white rounded-lg shadow-xl p-4 sm:p-8 w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cyan-400">{isLoginView ? 'Login' : 'Sign Up'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close login modal">&times;</button>
                </div>

                {!showForgotPassword ? (
                    <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="email">Email</label>
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                        </div>
                        <div className="mb-2">
                            <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="password">Password</label>
                            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                            {!isLoginView && password && validatePassword(password) && <p className="text-red-400 text-xs mt-1">{validatePassword(password)}</p>}
                        </div>
                        {isLoginView ? (
                            <div className="flex justify-between items-center mb-6">
                                <label className="flex items-center text-sm text-gray-400">
                                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="form-checkbox h-4 w-4 text-cyan-500 rounded border-gray-700 bg-gray-800 focus:ring-cyan-500" />
                                    <span className="ml-2">Remember Me</span>
                                </label>
                                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-cyan-400 hover:underline">
                                    Forgot Password?
                                </button>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="confirmPassword">Confirm Password</label>
                                <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                                {confirmPassword && password !== confirmPassword && <p className="text-red-400 text-xs mt-1">Passwords do not match.</p>}
                            </div>
                        )}
                        
                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-600">
                            {loading ? 'Processing...' : (isLoginView ? 'Login' : 'Create Account')}
                        </button>
                    </form>
                ) : ( // Forgot Password Form
                    <form onSubmit={handleForgotPasswordSubmit} className="flex-grow flex flex-col">
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="forgotPasswordEmail">Email</label>
                            <input id="forgotPasswordEmail" type="email" value={forgotPasswordEmail} onChange={e => setForgotPasswordEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                        </div>
                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        {resetEmailSent && <p className="text-green-500 text-sm mb-4 text-center">Password reset email sent! Check your inbox.</p>}
                        <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-600">
                            {loading ? 'Sending...' : 'Send Reset Email'}
                        </button>
                        <button type="button" onClick={() => setShowForgotPassword(false)} className="mt-4 w-full text-center text-sm text-cyan-400 hover:underline">
                            Back to Login
                        </button>
                    </form>
                )}

                <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>

                <button onClick={handleGoogleSignIn} disabled={loading} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 disabled:bg-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.565-3.108-11.127-7.462l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.592 35.631 48 29.932 48 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                    Continue with Google
                </button>
                <div className="mt-6 text-center">
                    <button type="button" onClick={() => { setIsLoginView(!isLoginView); setError(''); setShowForgotPassword(false); setResetEmailSent(false); }} className="text-sm text-cyan-400 hover:underline">
                        {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;