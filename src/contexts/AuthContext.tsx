import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '../config/googleAuth';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_OPTIONS = {
  expires: 30, // 30 days (1 month)
  secure: process.env.NODE_ENV === 'production', // Secure in production
  sameSite: 'strict' as const
};

// Cookie names
const AUTH_COOKIE_PREFIX = 'habit_tracker_';
const USER_COOKIE = `${AUTH_COOKIE_PREFIX}user`;
const TOKEN_COOKIE = `${AUTH_COOKIE_PREFIX}token`;

interface UserProfile {
  name: string;
  email: string;
  picture: string;
  credential: string;
}

// Define the NonOAuthError interface
interface NonOAuthError {
  type: string;
  error?: string;
  description?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  signOut: () => void;
  openGoogleDrive: () => void;
  handleGoogleLoginSuccess: (credentialResponse: any) => void;
  isGoogleApiLoaded: boolean;
  getAccessToken: () => Promise<string | null>;
  error: string | null;
  clearCookiesAndRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Inner component that uses the Google OAuth hooks
const AuthProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to load user from cookie
  const loadUserFromCookie = (): UserProfile | null => {
    const userCookie = Cookies.get(USER_COOKIE);
    try {
      return userCookie ? JSON.parse(userCookie) : null;
    } catch (e) {
      return null;
    }
  };

  // Try to load token from cookie
  const loadTokenFromCookie = (): string | null => {
    return Cookies.get(TOKEN_COOKIE) || null;
  };

  const [user, setUser] = useState<UserProfile | null>(loadUserFromCookie());
  const [isAuthenticated, setIsAuthenticated] = useState(!!loadUserFromCookie());
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(loadTokenFromCookie());
  const [error, setError] = useState<string | null>(null);

  // Save user to cookie whenever it changes
  useEffect(() => {
    if (user) {
      Cookies.set(USER_COOKIE, JSON.stringify(user), COOKIE_OPTIONS);
    } else {
      Cookies.remove(USER_COOKIE);
    }
  }, [user]);

  // Save token to cookie whenever it changes
  useEffect(() => {
    if (accessToken) {
      Cookies.set(TOKEN_COOKIE, accessToken, COOKIE_OPTIONS);
    } else {
      Cookies.remove(TOKEN_COOKIE);
    }
  }, [accessToken]);

  // Function to get the current access token
  const getAccessToken = async (): Promise<string | null> => {
    // If we already have a token, return it
    if (accessToken) {
      return accessToken;
    }
    
    // If user is authenticated but we don't have a token, they need to re-authenticate
    if (isAuthenticated) {
      setError('Session expired. Please sign in again.');
      return null;
    }
    
    return null;
  };

  const handleGoogleLoginSuccess = (tokenResponse: any) => {
    try {
      // Check if we have an access token from the response
      if (tokenResponse.access_token) {
        // Store the access token
        setAccessToken(tokenResponse.access_token);
        setIsGoogleApiLoaded(true);
        setError(null);
        
        // For the new flow, we need to get user profile information from the Google API
        // using the access token
        fetchUserProfile(tokenResponse.access_token);
      } else if (tokenResponse.credential) {
        // Handle the old JWT credential flow (fallback)
        const decoded = jwtDecode<any>(tokenResponse.credential);
        
        const userProfile: UserProfile = {
          name: decoded.name || 'User',
          email: decoded.email || '',
          picture: decoded.picture || '',
          credential: tokenResponse.credential
        };
        
        setUser(userProfile);
        setIsAuthenticated(true);
        setError(null);
        
        // Don't call googleLogin() again - this was causing the double prompt
      } else {
        setError('Invalid authentication response');
      }
    } catch (error) {
      setError('Error processing authentication response');
    }
  };

  // New function to fetch user profile using access token
  const fetchUserProfile = async (accessToken: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const userInfo = await response.json();
      
      const userProfile: UserProfile = {
        name: userInfo.name || 'User',
        email: userInfo.email || '',
        picture: userInfo.picture || '',
        credential: accessToken // Store the access token as credential
      };
      
      setUser(userProfile);
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to fetch user profile');
    }
  };

  const signOut = () => {
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    setIsGoogleApiLoaded(false);
    setAccessToken(null);
    setError(null);
    
    // Clear all auth cookies
    Cookies.remove(USER_COOKIE);
    Cookies.remove(TOKEN_COOKIE);
    
    // Reload the page to ensure all state is cleared
    window.location.reload();
  };

  const openGoogleDrive = () => {
    window.open('https://drive.google.com', '_blank');
  };

  const clearCookiesAndRefresh = () => {
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    setIsGoogleApiLoaded(false);
    setAccessToken(null);
    setError(null);
    
    // Clear all auth cookies
    Cookies.remove(USER_COOKIE);
    Cookies.remove(TOKEN_COOKIE);
    
    // Reload the page to ensure all state is cleared
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        signOut,
        openGoogleDrive,
        handleGoogleLoginSuccess,
        isGoogleApiLoaded,
        getAccessToken,
        error,
        clearCookiesAndRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Outer component that provides the GoogleOAuthProvider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </GoogleOAuthProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 