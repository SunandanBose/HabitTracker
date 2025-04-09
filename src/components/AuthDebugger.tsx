import React from 'react';
import { Box, Typography, Paper, Button, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleDrive } from '../hooks/useGoogleDrive';

const AuthDebugger: React.FC = () => {
  const { 
    isAuthenticated, 
    isGoogleApiLoaded, 
    user, 
    error: authError, 
    getAccessToken,
    signOut
  } = useAuth();
  
  const { 
    isInitialized: isDriveInitialized, 
    isLoading: isDriveLoading, 
    error: driveError,
    initializeGoogleDrive
  } = useGoogleDrive();

  const handleCheckToken = async () => {
    console.log('Checking token...');
    const token = await getAccessToken();
    console.log('Current token:', token ? `${token.substring(0, 10)}...` : 'none');
  };
  
  const handleForceRetry = () => {
    console.log('Forcing Google Drive initialization retry...');
    initializeGoogleDrive();
  };
  
  const handleReset = () => {
    console.log('Resetting everything...');
    // First sign out
    signOut();
    // Then clear local storage
    localStorage.clear();
    // Clear browser session cookies - we can't do this directly, but can suggest a reload
    console.log('Please reload the page for a complete reset');
    // Force reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        p: 2,
        width: 350,
        zIndex: 9999,
        opacity: 0.9,
        maxHeight: '80vh',
        overflow: 'auto'
      }}
    >
      <Typography variant="h6" gutterBottom>Auth Debug Info</Typography>
      
      <Typography variant="body2">
        <strong>Auth State:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </Typography>
      
      <Typography variant="body2">
        <strong>Google API:</strong> {isGoogleApiLoaded ? 'Loaded' : 'Not Loaded'}
      </Typography>
      
      <Typography variant="body2">
        <strong>Drive:</strong> {isDriveInitialized ? 'Initialized' : 'Not Initialized'}
        {isDriveLoading && ' (Loading...)'}
      </Typography>
      
      {user && (
        <Box mt={1}>
          <Typography variant="body2">
            <strong>User:</strong> {user.name} ({user.email})
          </Typography>
        </Box>
      )}
      
      {(authError || driveError) && (
        <Box mt={1}>
          <Typography variant="body2" color="error">
            <strong>Error:</strong> {authError || driveError}
          </Typography>
        </Box>
      )}
      
      <Stack spacing={1} mt={2}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleCheckToken}
          fullWidth
        >
          Check Token
        </Button>
        
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleForceRetry}
          fullWidth
          color="primary"
        >
          Force Retry
        </Button>
        
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleReset}
          fullWidth
          color="error"
        >
          Reset Everything
        </Button>
      </Stack>
    </Paper>
  );
};

export default AuthDebugger; 