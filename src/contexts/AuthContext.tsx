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

  // Use the Google login hook from @react-oauth/google
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google login success:', tokenResponse);
      setAccessToken(tokenResponse.access_token);
      setIsGoogleApiLoaded(true);
      setError(null);
    },
    onError: (error) => {
      console.error('Google login error:', error);
      setError('Failed to get access token. Please check your Google OAuth configuration.');
      setIsGoogleApiLoaded(false);
    },
    scope: GOOGLE_SCOPES,
  });

  // Function to get the current access token
  const getAccessToken = async (): Promise<string | null> => {
    if (accessToken) {
      return accessToken;
    }
    
    // If we don't have an access token but the user is authenticated,
    // we can try to get a new one
    if (isAuthenticated) {
      try {
        // This will trigger the Google login flow if needed
        await login();
        return accessToken;
      } catch (error) {
        console.error('Error getting access token:', error);
        setError('Failed to get access token. Please try again.');
        return null;
      }
    }
    
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
      login();
    } catch (error) {
      console.error("Error decoding JWT: ", error);
      // Fallback if decoding fails
      setUser({ 
        name: 'User', 
        email: '', 
        picture: '', 
        credential: credentialResponse.credential 
      });
      setIsAuthenticated(true);
      setError(null);
      
      // After successful authentication, get an access token for Google Drive
      login();
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