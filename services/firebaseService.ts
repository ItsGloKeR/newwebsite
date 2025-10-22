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
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updateProfile,
    User as FirebaseUser
} from "firebase/auth";
import { db, auth, isFirebaseConfigured, deleteField } from './firebase';
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
        // Use setDoc with merge to create the document if it doesn't exist, or update it if it does.
        await setDoc(userRef, data, { merge: true });
    } catch (error) {
        console.error("Error updating user data", error);
    }
};

export const updateUserProgress = async (uid: string, progress: MediaProgress): Promise<void> => {
    if (!db || Object.keys(progress).length === 0) return;
    const userRef = doc(db, 'users', uid);
    try {
        const updates: { [key: string]: any } = {};
        for (const anilistId in progress) {
            if (Object.prototype.hasOwnProperty.call(progress, anilistId)) {
                updates[`progress.${anilistId}`] = progress[anilistId];
            }
        }
        await updateDoc(userRef, updates);
    } catch (error) {
        console.warn("updateDoc failed for progress, trying setDoc with merge as fallback:", error);
        try {
            await setDoc(userRef, { progress }, { merge: true });
        } catch (setError) {
            console.error("Error updating user progress with both updateDoc and setDoc", setError);
        }
    }
};

export const removeProgressForAnime = async (uid: string, anilistId: number): Promise<void> => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    try {
        await updateDoc(userRef, {
            [`progress.${anilistId}`]: deleteField()
        });
    } catch (error) {
        console.error("Error removing user progress for anime:", anilistId, error);
    }
};

export const syncProgressOnLogin = async (uid: string): Promise<void> => {
    if (!db) return;

    const localProgress = progressTracker.getAllMediaData();
    const localProgressExists = Object.keys(localProgress).length > 0;
    
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        
        let remoteProgress: MediaProgress = {};
        let remoteProgressExists = false;

        if (userDoc.exists() && userDoc.data()?.progress) {
            remoteProgress = userDoc.data().progress as MediaProgress;
            remoteProgressExists = Object.keys(remoteProgress).length > 0;
        }

        if (remoteProgressExists) {
            // Priority 1: Remote data exists. Overwrite local state with it.
            progressTracker.replaceAllProgress(remoteProgress);
        } else if (localProgressExists) {
            // Priority 2: No remote data, but local (guest) data exists. Upload it.
            await updateUserProgress(uid, localProgress);
        } else {
            // Priority 3: No remote or local data. Ensure tracker is empty.
            progressTracker.replaceAllProgress({});
        }
    } catch(error) {
        console.error("Error syncing progress on login. App will use local data as fallback.", error);
    }
};

export const updateUserProfileAndAuth = async (user: FirebaseUser, displayName: string, photoURL?: string): Promise<void> => {
    if (!auth?.currentUser || !db) return;

    const isDisplayNameChanged = displayName !== user.displayName;
    const isPhotoURLChanged = photoURL !== undefined && photoURL !== user.photoURL;

    if (!isDisplayNameChanged && !isPhotoURLChanged) {
        return; // No changes to apply
    }
    
    try {
        const profileUpdates: { displayName?: string; photoURL?: string } = {};
        if (isDisplayNameChanged) {
            profileUpdates.displayName = displayName;
        }
        if (isPhotoURLChanged) {
            profileUpdates.photoURL = photoURL;
        }
        
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