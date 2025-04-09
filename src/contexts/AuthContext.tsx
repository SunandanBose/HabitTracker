import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID, GOOGLE_DISCOVERY_DOCS, GOOGLE_SCOPES } from '../config/googleAuth';
import { jwtDecode } from 'jwt-decode';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Create a promise resolver for the token
  const [tokenResolver, setTokenResolver] = useState<{
    resolve: (token: string | null) => void;
    reject: (error: Error) => void;
  } | null>(null);

  // DEBUG: Log state changes
  useEffect(() => {
    console.log('Auth Context State Changed:', { 
      isAuthenticated, 
      isGoogleApiLoaded,
      hasAccessToken: !!accessToken,
      hasUser: !!user,
      error
    });
  }, [isAuthenticated, isGoogleApiLoaded, accessToken, user, error]);

  // Use the Google login hook from @react-oauth/google with callbacks
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google login success with token response:', tokenResponse);
      const token = tokenResponse.access_token;
      
      if (!token) {
        console.error('Token response did not contain an access token');
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
        console.log('Resolving pending token request');
        tokenResolver.resolve(token);
        setTokenResolver(null);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
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
      console.error('Non-OAuth error during login:', error);
      setError(`Login error: ${error.type} - ${error.description || error.error || 'Unknown error'}`);
    }
  });

  // Function to get the current access token
  const getAccessToken = async (): Promise<string | null> => {
    console.log('getAccessToken called, current token:', accessToken ? 'exists' : 'null');
    
    // If we already have a token, return it
    if (accessToken) {
      return accessToken;
    }
    
    // If user is authenticated but we don't have a token, request one
    if (isAuthenticated) {
      console.log('User is authenticated but no token exists, requesting one...');
      try {
        // Create a new promise that will be resolved when we get the token
        const tokenPromise = new Promise<string | null>((resolve, reject) => {
          console.log('Setting up token resolver');
          setTokenResolver({ resolve, reject });
        });
        
        // Trigger the Google login flow
        console.log('Triggering Google login flow');
        googleLogin();
        
        // Wait for the promise to resolve (it will be resolved in the onSuccess callback)
        console.log('Waiting for token promise to resolve');
        const token = await tokenPromise;
        console.log('Token promise resolved:', token ? 'got token' : 'no token');
        return token;
      } catch (error) {
        console.error('Error in getAccessToken:', error);
        setError('Failed to get access token. Please try again.');
        return null;
      }
    }
    
    console.log('User is not authenticated, cannot get token');
    return null;
  };

  const handleGoogleLoginSuccess = (credentialResponse: any) => {
    console.log("AuthContext: Google Login Success", credentialResponse);
    
    try {
      // Decode the JWT token to get user profile information
      const decoded = jwtDecode<any>(credentialResponse.credential);
      console.log("Decoded JWT: ", decoded);
      
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
      // We don't await here because we want to let the component render
      // The useGoogleDrive hook will handle waiting for the token
      console.log('Triggering Google login after successful authentication');
      googleLogin();
    } catch (error) {
      console.error("Error decoding JWT: ", error);
      setError('Error processing authentication response');
    }
  };

  const signOut = () => {
    console.log("Signing out...");
    setUser(null);
    setIsAuthenticated(false);
    setIsGoogleApiLoaded(false);
    setAccessToken(null);
    setError(null);
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