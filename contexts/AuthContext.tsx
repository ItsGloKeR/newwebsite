import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { ANILIST_CLIENT_ID, ANILIST_REDIRECT_URI, ANILIST_CLIENT_SECRET } from '../config';
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

  const exchangeCodeForToken = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
        const response = await fetch('https://corsproxy.io/?https://anilist.co/api/v2/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: ANILIST_CLIENT_ID,
                client_secret: ANILIST_CLIENT_SECRET,
                redirect_uri: ANILIST_REDIRECT_URI,
                code: code,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to exchange code for token:', errorData);
            throw new Error(`Token exchange failed: ${errorData.message}`);
        }

        const data = await response.json();
        const accessToken = data.access_token;

        if (accessToken) {
            setToken(accessToken);
            localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
            const userData = await getAuthenticatedUser(accessToken);
            setUser(userData);
        }
    } catch (error) {
        console.error(error);
        logout();
    } finally {
        setIsLoading(false);
        window.history.replaceState(null, '', window.location.pathname);
    }
  }, [logout]);

  useEffect(() => {
    const fetchUser = async (authToken: string) => {
      try {
        const userData = await getAuthenticatedUser(authToken);
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch authenticated user, token might be invalid.", error);
        logout();
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
    const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${ANILIST_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&response_type=code`;
    window.open(authUrl, '_top');
  };
  
  const handleRedirect = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
        exchangeCodeForToken(code);
    }
  }, [exchangeCodeForToken]);

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