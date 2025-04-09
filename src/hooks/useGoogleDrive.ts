import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { googleDriveService } from '../services/googleDriveService';

export const useGoogleDrive = () => {
  const { getAccessToken, isAuthenticated, isGoogleApiLoaded } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initAttempts, setInitAttempts] = useState(0);
  
  // Use a ref to track initialization status to avoid race conditions
  const initializationInProgress = useRef(false);
  
  // Use a ref to track if we've successfully initialized to prevent a re-initialization loop
  const hasSuccessfullyInitialized = useRef(false);

  const initializeGoogleDrive = useCallback(async () => {
    // If we've already successfully initialized, don't try again
    if (hasSuccessfullyInitialized.current) {
      console.log('Google Drive already successfully initialized, skipping');
      return true;
    }
    
    if (!isAuthenticated) {
      setError('User is not authenticated');
      return false;
    }

    // Prevent multiple simultaneous initialization attempts
    if (initializationInProgress.current) {
      console.log('Initialization already in progress, skipping');
      return false;
    }

    initializationInProgress.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log('Initializing Google Drive service...');
      const token = await getAccessToken();
      console.log('Got access token:', token ? 'yes' : 'no');
      
      if (!token) {
        setError('Failed to get access token. Please ensure you have granted the necessary permissions.');
        setIsLoading(false);
        initializationInProgress.current = false;
        return false;
      }
      
      // Set the access token in the Google Drive service
      googleDriveService.setAccessToken(token);
      
      // Test a simple operation to verify the access token works
      try {
        await googleDriveService.createOrGetFolder();
        console.log('Successfully initialized Google Drive service');
        setIsInitialized(true);
        hasSuccessfullyInitialized.current = true;
        setError(null);
        initializationInProgress.current = false;
        return true;
      } catch (error: any) {
        console.error('Error during Drive API operation:', error);
        if (error.message && error.message.includes('Google API error: 401')) {
          setError('Your session has expired. Please sign out and sign in again.');
        } else if (error.message && error.message.includes('Google API error: 403')) {
          setError('You do not have permission to access Google Drive. Please ensure you have granted the necessary permissions.');
        } else {
          setError(`Failed to access Google Drive: ${error.message || 'Unknown error'}`);
        }
        initializationInProgress.current = false;
        return false;
      }
    } catch (error: any) {
      console.error('Error in initialization process:', error);
      setError(`Failed to initialize Google Drive: ${error.message || 'Unknown error'}`);
      initializationInProgress.current = false;
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getAccessToken]);

  useEffect(() => {
    // Only try to initialize if:
    // 1. The user is authenticated
    // 2. We're not already loading
    // 3. We have made less than 3 attempts
    // 4. Either we're not initialized or we've explicitly been told the Google API is loaded
    // 5. We haven't already successfully initialized
    if (isAuthenticated && 
        !isLoading && 
        initAttempts < 3 && 
        (!isInitialized || (isGoogleApiLoaded && !hasSuccessfullyInitialized.current)) && 
        !initializationInProgress.current) {
      
      console.log('Attempting to initialize Google Drive...', { 
        isAuthenticated, 
        isGoogleApiLoaded,
        initAttempts,
        isInitialized,
        hasSuccessfullyInitialized: hasSuccessfullyInitialized.current
      });
      
      initializeGoogleDrive().then(success => {
        if (!success) {
          setInitAttempts(prev => prev + 1);
        }
      }).catch(err => {
        console.error('Unhandled error during initialization:', err);
        setInitAttempts(prev => prev + 1);
        setError(`Unhandled error: ${err.message || 'Unknown error'}`);
      });
    }
  }, [isAuthenticated, isGoogleApiLoaded, isInitialized, isLoading, initAttempts, initializeGoogleDrive]);

  // Reset attempts when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      setInitAttempts(0);
    } else {
      // Reset initialization state when user is not authenticated
      setIsInitialized(false);
      hasSuccessfullyInitialized.current = false;
      initializationInProgress.current = false;
    }
  }, [isAuthenticated]);

  return {
    googleDriveService,
    isInitialized,
    isLoading,
    error,
    initializeGoogleDrive
  };
}; 