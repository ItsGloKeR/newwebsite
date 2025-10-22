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
      // The auth.currentUser object should be updated in memory by the Firebase SDK after updateProfile
      // We can force a reload to be sure we get the latest from the server
      await auth.currentUser.reload();
      const freshFirebaseUser = auth.currentUser;
      setFirebaseUser(freshFirebaseUser);
      const userProfile = await getUserProfile(freshFirebaseUser.uid);
      setUser(userProfile);
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
          await createUserProfileDocument(authUser);
          userProfile = await getUserProfile(authUser.uid);
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
