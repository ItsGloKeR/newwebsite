// components/LoginModal.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    signInWithGoogle, 
    signInWithEmail,
    signUpWithEmail,
    createUserProfileDocument,
    sendPasswordResetEmail,
    sendEmailVerification,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from '../services/firebaseService';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { auth } from '../services/firebase';
import Logo from './Logo'; // Import the Logo component

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
const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return 'Password must be at least 6 characters long.';
    return null;
};

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState(''); // Added for sign-up
    const [rememberMe, setRememberMe] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [captchaText, setCaptchaText] = useState('');
    const [userCaptchaInput, setUserCaptchaInput] = useState('');
    const [captchaImage, setCaptchaImage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    const generateCaptcha = useCallback(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaText(result);
        setUserCaptchaInput('');

        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1f2937'; // Dark gray background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add random noise lines
            for (let i = 0; i < 5; i++) {
                ctx.strokeStyle = `rgba(100, 100, 100, ${Math.random() * 0.5 + 0.3})`;
                ctx.beginPath();
                ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
                ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
                ctx.stroke();
            }

            ctx.font = '24px Arial';
            ctx.fillStyle = '#67e8f9'; // Cyan color
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let i = 0; i < result.length; i++) {
                ctx.save();
                ctx.translate(20 + i * 15, canvas.height / 2);
                ctx.rotate((Math.random() - 0.5) * 0.4); // Random rotation
                ctx.font = `${20 + Math.random() * 8}px Arial`; // Vary font size
                ctx.fillText(result[i], 0, 0);
                ctx.restore();
            }

            setCaptchaImage(canvas.toDataURL());
        }
    }, []);

    useEffect(() => {
        if (isOpen && !isLoginView) {
            generateCaptcha();
        }
    }, [isOpen, isLoginView, generateCaptcha]);

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
        if (passwordError) { // Apply password validation for both login and signup
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
            if (userCaptchaInput.toLowerCase() !== captchaText.toLowerCase()) {
                setError('Incorrect CAPTCHA. Please try again.');
                generateCaptcha(); // Refresh CAPTCHA on failure
                setLoading(false);
                return;
            }
        }
        
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

            let user = null;
            if (isLoginView) {
                user = await signInWithEmail(email, password);
            } else {
                user = await signUpWithEmail(email, password);
                if (user) {
                    await createUserProfileDocument(user, { displayName: displayName.trim() || null }); // Pass display name
                    await sendEmailVerification(user);
                    setError('Account created! Please verify your email to log in.');
                    setIsLoginView(true);
                }
            }
            if (user && isLoginView) {
                onClose();
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
            <div ref={modalRef} className="bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-lg shadow-2xl p-4 md:p-8 w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <Logo width="105" height="24" />
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close login modal">&times;</button>
                </div>
                <h2 className="text-3xl font-black text-white text-center mb-6 font-display">{isLoginView ? 'Welcome Back!' : 'Join AniGloK!'}</h2>


                {!showForgotPassword ? (
                    <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                        {!isLoginView && (
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="displayName">Your Name</label>
                                <input id="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-700" placeholder="e.g. John Doe" required />
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="email">Email</label>
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-700" required />
                        </div>
                        <div className="mb-2">
                            <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="password">Password</label>
                            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-700" required />
                            {password && validatePassword(password) && <p className="text-red-400 text-xs mt-1">{validatePassword(password)}</p>}
                        </div>
                        {isLoginView ? (
                            <div className="flex justify-between items-center mb-6">
                                <label className="flex items-center text-sm text-gray-400">
                                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="form-checkbox h-4 w-4 text-cyan-500 rounded border-gray-700 bg-gray-800 focus:ring-cyan-500" />
                                    <span className="ml-2">Remember Me</span>
                                </label>
                                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-cyan-400 hover:underline hover:text-cyan-300 transition-colors">
                                    Forgot Password?
                                </button>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="confirmPassword">Confirm Password</label>
                                <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-700" required />
                                {confirmPassword && password !== confirmPassword && <p className="text-red-400 text-xs mt-1">Passwords do not match.</p>}
                            </div>
                        )}
                        
                        {!isLoginView && (
                             <div className="mb-6">
                                <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="captchaInput">Security Check</label>
                                <div className="flex items-center gap-2 mb-2">
                                    <img src={captchaImage} alt="CAPTCHA" className="rounded-md border border-gray-700 w-[120px] h-[40px] bg-gray-800" />
                                    <button type="button" onClick={generateCaptcha} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 text-sm flex items-center justify-center transition-colors" aria-label="Refresh CAPTCHA">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                <input id="captchaInput" type="text" value={userCaptchaInput} onChange={e => setUserCaptchaInput(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-700" placeholder="Enter CAPTCHA" required />
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-all transform hover:scale-105 shadow-md disabled:bg-gray-600">
                            {loading ? 'Processing...' : (isLoginView ? 'Login' : 'Create Account')}
                        </button>
                    </form>
                ) : ( // Forgot Password Form
                    <form onSubmit={handleForgotPasswordSubmit} className="flex-grow flex flex-col">
                        <p className="text-gray-400 text-sm mb-4 text-center">Enter your email and we'll send you a link to reset your password.</p>
                        <div className="mb-4">
                            <label className="block mb-2 text-sm font-bold text-gray-400" htmlFor="forgotPasswordEmail">Email</label>
                            <input id="forgotPasswordEmail" type="email" value={forgotPasswordEmail} onChange={e => setForgotPasswordEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-700" required />
                        </div>
                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        {resetEmailSent && <p className="text-green-500 text-sm mb-4 text-center">Password reset email sent! Check your inbox.</p>}
                        <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-all transform hover:scale-105 shadow-md disabled:bg-gray-600">
                            {loading ? 'Sending...' : 'Send Reset Email'}
                        </button>
                        <button type="button" onClick={() => setShowForgotPassword(false)} className="mt-4 w-full text-center text-sm text-cyan-400 hover:underline hover:text-cyan-300 transition-colors">
                            Back to Login
                        </button>
                    </form>
                )}

                <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>

                <button onClick={handleGoogleSignIn} disabled={loading} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:bg-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.565-3.108-11.127-7.462l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.592 35.631 48 29.932 48 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                    Continue with Google
                </button>
                <div className="mt-6 text-center">
                    <button type="button" onClick={() => { setIsLoginView(!isLoginView); setError(''); setShowForgotPassword(false); setResetEmailSent(false); }} className="text-sm text-cyan-400 hover:underline hover:text-cyan-300 transition-colors">
                        {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;