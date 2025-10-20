// services/firebase.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc
} from 'firebase/firestore';

// IMPORTANT: REPLACE WITH YOUR FIREBASE PROJECT CONFIGURATION
// You can get this from your Firebase project settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Create a user document in Firestore if it doesn't exist
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        watchlist: [],
        favorites: [],
        createdAt: new Date(),
      });
    }

    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return null;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

interface UserData {
  watchlist: number[];
  favorites: number[];
}

export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        watchlist: data.watchlist || [],
        favorites: data.favorites || [],
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

export const updateUserData = async (userId: string, data: Partial<UserData>): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    // Use setDoc with merge to create the doc if it doesn't exist, or update it if it does.
    await setDoc(userDocRef, data, { merge: true });
  } catch (error) {
    console.error("Error updating user data:", error);
  }
};

export const mergeLocalDataToFirestore = async (userId: string, localData: UserData): Promise<UserData> => {
    try {
        const firestoreData = await getUserData(userId);
        const userDocRef = doc(db, 'users', userId);

        if (firestoreData) {
            // Merge: Firestore is source of truth, but add any new local items
            const newWatchlist = Array.from(new Set([...firestoreData.watchlist, ...localData.watchlist]));
            const newFavorites = Array.from(new Set([...firestoreData.favorites, ...localData.favorites]));
            
            const mergedData = { watchlist: newWatchlist, favorites: newFavorites };
            await updateDoc(userDocRef, mergedData);
            return mergedData;
        } else {
            // No Firestore data, so just write the local data
            await updateDoc(userDocRef, localData);
            return localData;
        }
    } catch (error) {
        console.error("Error merging local data to Firestore:", error);
        return localData; // Fallback to local data on error
    }
};
