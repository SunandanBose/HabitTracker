import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID, GOOGLE_DISCOVERY_DOCS, GOOGLE_SCOPES } from '../config/googleAuth';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_OPTIONS = {
  expires: 2/24, // 2 hours in days (1/12 of a day)
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
  
  // Create a promise resolver for the token
  const [tokenResolver, setTokenResolver] = useState<{
    resolve: (token: string | null) => void;
    reject: (error: Error) => void;
  } | null>(null);

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

  // Use the Google login hook from @react-oauth/google with callbacks
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const token = tokenResponse.access_token;
      
      if (!token) {
        setError('No access token received from Google');
        if (tokenResolver) {
          tokenResolver.reject(new Error('No access token received from Google'));
          setTokenResolver(null);
        }
        return;
      }
      
      setAccessToken(token);
      setIsGoogleApiLoaded(true);
      setError(null);
      
      // If there's a pending token request, resolve it
      if (tokenResolver) {
        tokenResolver.resolve(token);
        setTokenResolver(null);
      }
    },
    onError: (error) => {
      setError('Failed to get access token. Please check your Google OAuth configuration.');
      setIsGoogleApiLoaded(false);
      
      // If there's a pending token request, reject it
      if (tokenResolver) {
        tokenResolver.reject(new Error('Failed to get access token'));
        setTokenResolver(null);
      }
    },
    scope: GOOGLE_SCOPES,
    flow: 'implicit', // Use implicit flow
    onNonOAuthError: (error: NonOAuthError) => {
      setError(`Login error: ${error.type} - ${error.description || error.error || 'Unknown error'}`);
    }
  });

  // Function to get the current access token
  const getAccessToken = async (): Promise<string | null> => {
    // If we already have a token, return it
    if (accessToken) {
      return accessToken;
    }
    
    // If user is authenticated but we don't have a token, request one
    if (isAuthenticated) {
      try {
        // Create a new promise that will be resolved when we get the token
        const tokenPromise = new Promise<string | null>((resolve, reject) => {
          setTokenResolver({ resolve, reject });
        });
        
        // Trigger the Google login flow
        googleLogin();
        
        // Wait for the promise to resolve (it will be resolved in the onSuccess callback)
        const token = await tokenPromise;
        return token;
      } catch (error) {
        setError('Failed to get access token. Please try again.');
        return null;
      }
    }
    
    return null;
  };

  const handleGoogleLoginSuccess = (credentialResponse: any) => {
    try {
      // Decode the JWT token to get user profile information
      const decoded = jwtDecode<any>(credentialResponse.credential);
      
      // Create a user profile object with the decoded information
      const userProfile: UserProfile = {
        name: decoded.name || 'User',
        email: decoded.email || '',
        picture: decoded.picture || '',
        credential: credentialResponse.credential
      };
      
      setUser(userProfile);
      setIsAuthenticated(true);
      setError(null);
      
      // After successful authentication, get an access token for Google Drive
      googleLogin();
    } catch (error) {
      setError('Error processing authentication response');
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