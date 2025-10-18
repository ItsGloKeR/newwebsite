import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { ANILIST_CLIENT_ID, ANILIST_REDIRECT_URI } from '../config';
import { getAuthenticatedUser } from '../services/anilistService';

const AUTH_TOKEN_KEY = 'aniGlokAuthToken';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  handleRedirect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }, []);

  useEffect(() => {
    const fetchUser = async (authToken: string) => {
      try {
        const userData = await getAuthenticatedUser(authToken);
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch authenticated user, token might be invalid.", error);
        logout(); // Token is invalid, so log out
      } finally {
        setIsLoading(false);
      }
    };

    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [logout]);

  const login = () => {
    const encodedRedirectUri = encodeURIComponent(ANILIST_REDIRECT_URI);
    const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${ANILIST_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=token`;
    // Open in the top-level window to break out of the iframe
    window.open(authUrl, '_top');
  };
  
  const handleRedirect = useCallback(() => {
    if (window.location.hash.includes('access_token')) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            setToken(accessToken);
            localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
            // Clean the URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }
  }, []);

  const value: AuthContextType = {
    token,
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    logout,
    handleRedirect,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
