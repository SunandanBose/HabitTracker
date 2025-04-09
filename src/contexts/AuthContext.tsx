import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize Google API client when authenticated
  useEffect(() => {
    if (isAuthenticated && !isGoogleApiLoaded && !isInitializing) {
      initGoogleApiClient();
    }
  }, [isAuthenticated, isGoogleApiLoaded, isInitializing]);

  const initGoogleApiClient = async () => {
    if (isInitializing) return;
    setIsInitializing(true);

    try {
      // Load the Google API client
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', {
          callback: resolve,
          onerror: reject
        });
      });

      // Initialize the client
      await window.gapi.client.init({
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: GOOGLE_DISCOVERY_DOCS,
        scope: GOOGLE_SCOPES,
      });

      console.log('Google API client initialized successfully');
      setIsGoogleApiLoaded(true);
    } catch (error) {
      console.error('Error initializing Google API client:', error);
    } finally {
      setIsInitializing(false);
    }
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
    }
  };

  const signOut = () => {
    console.log("Signing out...");
    setUser(null);
    setIsAuthenticated(false);
    setIsGoogleApiLoaded(false);
  };

  const openGoogleDrive = () => {
    window.open('https://drive.google.com', '_blank');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated,
          signOut,
          openGoogleDrive,
          handleGoogleLoginSuccess,
          isGoogleApiLoaded,
        }}
      >
        {children}
      </AuthContext.Provider>
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