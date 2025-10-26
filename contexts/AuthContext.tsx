// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User } from '../services/firebase';
import { auth, onAuthStateChanged, isFirebaseConfigured } from '../services/firebase';
import { getUserProfile, createUserProfileDocument } from '../services/firebaseService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    if (auth?.currentUser) {
      // Force reload of auth user to get latest emailVerified status
      await auth.currentUser.reload();
      const freshFirebaseUser = auth.currentUser;
      setFirebaseUser(freshFirebaseUser);
      // Re-fetch user profile to ensure `emailVerified` is updated in Firestore data
      const userProfile = await getUserProfile(freshFirebaseUser.uid);
      if (userProfile) {
        setUser({ ...userProfile, emailVerified: freshFirebaseUser.emailVerified });
        // Also update Firestore if the emailVerified status changed in Firebase Auth
        if (userProfile.emailVerified !== freshFirebaseUser.emailVerified) {
          await createUserProfileDocument(freshFirebaseUser, { emailVerified: freshFirebaseUser.emailVerified });
        }
      } else {
        // If for some reason the profile doesn't exist, create it with latest data
        await createUserProfileDocument(freshFirebaseUser);
        const newlyCreatedProfile = await getUserProfile(freshFirebaseUser.uid);
        setUser(newlyCreatedProfile);
      }
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setFirebaseUser(authUser);
        let userProfile = await getUserProfile(authUser.uid);
        if (!userProfile) {
          // If profile doesn't exist, create it.
          await createUserProfileDocument(authUser, { emailVerified: authUser.emailVerified });
          userProfile = await getUserProfile(authUser.uid);
        } else if (userProfile.emailVerified !== authUser.emailVerified) {
          // Keep Firestore in sync with auth.currentUser for emailVerified status
          await createUserProfileDocument(authUser, { emailVerified: authUser.emailVerified });
          userProfile = await getUserProfile(authUser.uid); // Fetch updated profile
        }
        setUser(userProfile);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, firebaseUser, loading, reloadUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};