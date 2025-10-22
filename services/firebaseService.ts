// services/firebaseService.ts
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove,
    writeBatch,
    DocumentData
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updateProfile,
    User as FirebaseUser
} from "firebase/auth";
import { db, storage, auth, isFirebaseConfigured } from './firebase';
import { UserProfile, MediaProgress } from '../types';
import { progressTracker } from '../utils/progressTracking';

if (!isFirebaseConfigured) {
    console.log("Firebase not configured, firebaseService will use mock/no-op functions.");
}

// AUTH FUNCTIONS
const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    if (!auth) return null;
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error during Google sign-in", error);
        return null;
    }
};

export const signUpWithEmail = async (email: string, password: string): Promise<FirebaseUser | null> => {
    if (!auth) return null;
    try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        return user;
    } catch (error) {
        console.error("Error signing up with email and password", error);
        return null;
    }
}

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser | null> => {
    if (!auth) return null;
    try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        return user;
    } catch (error) {
        console.error("Error signing in with email and password", error);
        return null;
    }
}

export const logout = async (): Promise<void> => {
    if (!auth) return;
    await signOut(auth);
};

// USER PROFILE / DATA FUNCTIONS
export const createUserProfileDocument = async (userAuth: FirebaseUser, additionalData?: object) => {
    if (!db || !userAuth) return;
    const userRef = doc(db, 'users', userAuth.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const { email, displayName, photoURL } = userAuth;
        const createdAt = new Date();
        try {
            await setDoc(userRef, {
                uid: userAuth.uid,
                displayName: displayName || email?.split('@')[0],
                email,
                photoURL,
                createdAt,
                watchlist: [],
                favorites: [],
                progress: {},
                ...additionalData,
            });
        } catch (error) {
            console.error("Error creating user profile document", error);
        }
    }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!db) return null;
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
};
export const getUserData = getUserProfile; // Alias for UserDataContext

export const updateUserData = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    try {
        await updateDoc(userRef, data);
    } catch (error) {
        console.error("Error updating user data", error);
    }
};

export const updateUserProgress = async (uid: string, progress: MediaProgress): Promise<void> => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    try {
        // This will merge the progress data, not overwrite the whole user doc
        await setDoc(userRef, { progress }, { merge: true });
    } catch (error) {
        console.error("Error updating user progress", error);
    }
};

export const syncProgressOnLogin = async (uid: string): Promise<void> => {
    if (!db) return;
    
    const localProgress = progressTracker.getAllMediaData();
    if (Object.keys(localProgress).length === 0) return;

    const userRef = doc(db, 'users', uid);
    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return;

        const remoteProgress = (userDoc.data()?.progress || {}) as MediaProgress;
        
        // Merge local and remote progress, local takes precedence for conflicts
        const mergedProgress = { ...remoteProgress, ...localProgress };
        
        await updateDoc(userRef, { progress: mergedProgress });

        // Once synced, we can clear the local storage for guest progress
        localStorage.removeItem('vidLinkProgress');

        // Reload progress tracker with merged data
        progressTracker.replaceAllProgress(mergedProgress);

    } catch(error) {
        console.error("Error syncing progress on login", error);
    }
};

export const updateUserProfileAndAuth = async (user: FirebaseUser, displayName: string, photoURL?: string): Promise<void> => {
    if (!auth?.currentUser || !db) return;
    try {
        const profileUpdates: { displayName?: string; photoURL?: string } = {};
        if (displayName) profileUpdates.displayName = displayName;
        if (photoURL) profileUpdates.photoURL = photoURL;
        
        // Update Firebase Auth profile
        await updateProfile(user, profileUpdates);
        
        // Update Firestore profile document
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, profileUpdates);
    } catch(error) {
        console.error("Error updating user profile", error);
        throw error;
    }
};

// STORAGE FUNCTIONS
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    if (!storage) return null;
    const avatarRef = ref(storage, `avatars/${userId}/${file.name}`);
    try {
        await uploadBytes(avatarRef, file);
        const url = await getDownloadURL(avatarRef);
        return url;
    } catch (error) {
        console.error("Error uploading avatar", error);
        return null;
    }
};
