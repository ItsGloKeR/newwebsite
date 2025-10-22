// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../services/firebase';
import { auth, onAuthStateChanged, isFirebaseConfigured } from '../services/firebase';
import { getUserProfile, createUserProfileDocument } from '../services/firebaseService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const value = { user, firebaseUser, loading };

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
