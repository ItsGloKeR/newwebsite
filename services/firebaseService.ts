// services/firebaseService.ts
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove,
    writeBatch,
    DocumentData,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    startAfter,
    Timestamp,
    addDoc,
    deleteDoc,
    increment,
    QueryOrderByConstraint
} from "firebase/firestore";
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    updateProfile,
    User as FirebaseUser,
    sendPasswordResetEmail, // Added
    sendEmailVerification,  // Added
    updatePassword,         // Added
    EmailAuthProvider,      // Added
    reauthenticateWithCredential, // Added
    setPersistence,         // Added
    browserLocalPersistence, // Added
    browserSessionPersistence // Added
} from "firebase/auth";
import { db, auth, isFirebaseConfigured, deleteField } from './firebase';
import { UserProfile, MediaProgress, Comment } from '../types';
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
                emailVerified: userAuth.emailVerified, // Added emailVerified status
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

export const moderateUser = async (userId: string, action: { mute?: boolean; ban?: boolean }): Promise<boolean> => {
    if (!db) return false;
    const userRef = doc(db, 'users', userId);
    try {
        const updates: { isMuted?: boolean; isBanned?: boolean } = {};
        if (action.mute !== undefined) updates.isMuted = action.mute;
        if (action.ban !== undefined) updates.isBanned = action.ban;
        
        await updateDoc(userRef, updates);
        return true;
    } catch (error) {
        console.error(`Error moderating user ${userId}:`, error);
        return false;
    }
};

export const updateUserProgress = async (uid: string, progress: MediaProgress): Promise<void> => {
    if (!db || Object.keys(progress).length === 0) return;
    const userRef = doc(db, 'users', uid);
    try {
        const updates: { [key: string]: any } = {};
        for (const anilistId in progress) {
            if (Object.prototype.hasOwnProperty.call(progress, anilistId)) {
                const entry = progress[anilistId];
                // Use null as a signal for deletion in the batched update
                if (entry === null) {
                    updates[`progress.${anilistId}`] = deleteField();
                } else {
                    updates[`progress.${anilistId}`] = entry;
                }
            }
        }
        await updateDoc(userRef, updates);
    } catch (error) {
        console.error("Error updating user progress.", error);
    }
};

export const updateUserProfileAndAuth = async (user: FirebaseUser, displayName: string, photoURL?: string, emailVerified?: boolean): Promise<void> => {
    if (!auth?.currentUser || !db) return;

    const isDisplayNameChanged = displayName !== user.displayName;
    const isPhotoURLChanged = photoURL !== undefined && photoURL !== user.photoURL;
    const isEmailVerifiedChanged = emailVerified !== undefined && emailVerified !== user.emailVerified;

    if (!isDisplayNameChanged && !isPhotoURLChanged && !isEmailVerifiedChanged) {
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
        // Note: emailVerified cannot be directly updated via updateProfile.
        // It changes only after the user clicks the verification link.
        
        // Update Firebase Auth profile
        await updateProfile(user, profileUpdates);
        
        // Update Firestore profile document
        const firestoreUpdates: { displayName?: string; photoURL?: string; emailVerified?: boolean } = {};
        if (isDisplayNameChanged) firestoreUpdates.displayName = displayName;
        if (isPhotoURLChanged) firestoreUpdates.photoURL = photoURL;
        if (isEmailVerifiedChanged) firestoreUpdates.emailVerified = emailVerified; // Update firestore directly for emailVerified

        await updateDoc(doc(db, 'users', user.uid), firestoreUpdates);

    } catch(error) {
        console.error("Error updating user profile", error);
        throw error;
    }
};

// --- COMMENT FUNCTIONS ---

export const postComment = async (
    threadId: string,
    user: UserProfile,
    text: string,
    parentId?: string
): Promise<string | null> => {
    if (!db || !user) return null;
    try {
        const commentData: any = {
            threadId,
            userId: user.uid,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            text,
            createdAt: Timestamp.now(),
            likes: [],
            likeCount: 0,
            isPinned: false,
        };
        if (parentId) {
            commentData.parentId = parentId;
        }
        const docRef = await addDoc(collection(db, 'comments'), commentData);
        return docRef.id;
    } catch (error) {
        console.error("Error posting comment:", error);
        return null;
    }
};

export const editComment = async (commentId: string, newText: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const commentRef = doc(db, 'comments', commentId);
        await updateDoc(commentRef, {
            text: newText,
            isEdited: true
        });
        return true;
    } catch (error) {
        console.error("Error editing comment:", error);
        return false;
    }
};

export const reportComment = async (commentId: string, reportingUserId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        await addDoc(collection(db, 'reports'), {
            commentId,
            reportingUserId,
            reportedAt: Timestamp.now(),
            status: 'pending'
        });
        return true;
    } catch (error) {
        console.error("Error reporting comment:", error);
        return false;
    }
};

export const togglePinComment = async (commentId: string): Promise<boolean> => {
    if (!db) return false;
    const commentRef = doc(db, 'comments', commentId);
    try {
        const commentSnap = await getDoc(commentRef);
        if (commentSnap.exists()) {
            const currentStatus = commentSnap.data().isPinned || false;
            await updateDoc(commentRef, { isPinned: !currentStatus });
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error toggling pin on comment ${commentId}:`, error);
        return false;
    }
};


export const getComments = async (
    threadId: string,
    sortBy: 'newest' | 'oldest' | 'top',
    lastVisibleDoc?: DocumentData
): Promise<{ comments: Comment[]; lastVisible: DocumentData | null }> => {
    if (!db) return { comments: [], lastVisible: null };

    // Fetch up to 100 comments at a time to build threads on the client
    const commentsPerPage = 100;
    const commentsRef = collection(db, 'comments');
    
    const orderByConstraints: QueryOrderByConstraint[] = [orderBy('isPinned', 'desc')]; // ALWAYS pin first
    if (sortBy === 'top') {
        orderByConstraints.push(orderBy('likeCount', 'desc'));
        orderByConstraints.push(orderBy('createdAt', 'desc')); // Secondary sort for tie-breaking
    } else if (sortBy === 'oldest') {
        orderByConstraints.push(orderBy('createdAt', 'asc'));
    } else { // 'newest' is the default
        orderByConstraints.push(orderBy('createdAt', 'desc'));
    }

    let q;
    if (lastVisibleDoc) {
        q = query(
            commentsRef,
            where('threadId', '==', threadId),
            ...orderByConstraints,
            startAfter(lastVisibleDoc),
            limit(commentsPerPage)
        );
    } else {
        q = query(
            commentsRef,
            where('threadId', '==', threadId),
            ...orderByConstraints,
            limit(commentsPerPage)
        );
    }

    try {
        const querySnapshot = await getDocs(q);
        const comments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Comment));
        
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

        return { comments, lastVisible };
    } catch (error) {
        console.error("Error getting comments:", error);
        return { comments: [], lastVisible: null };
    }
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const commentRef = doc(db, 'comments', commentId);
        await deleteDoc(commentRef);
        // In a real app, you'd also delete all replies via a cloud function.
        return true;
    } catch (error) {
        console.error("Error deleting comment:", error);
        return false;
    }
};

export const toggleLikeComment = async (commentId: string, userId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const commentRef = doc(db, 'comments', commentId);
        const commentSnap = await getDoc(commentRef);
        if (commentSnap.exists()) {
            const commentData = commentSnap.data();
            const likes: string[] = commentData.likes || [];
            if (likes.includes(userId)) {
                // User has liked, so unlike
                await updateDoc(commentRef, { 
                    likes: arrayRemove(userId),
                    likeCount: increment(-1) 
                });
            } else {
                // User has not liked, so like
                await updateDoc(commentRef, { 
                    likes: arrayUnion(userId),
                    likeCount: increment(1)
                });
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error toggling like on comment:", error);
        return false;
    }
};


export { sendPasswordResetEmail, sendEmailVerification, updatePassword, EmailAuthProvider, reauthenticateWithCredential, setPersistence, browserLocalPersistence, browserSessionPersistence };