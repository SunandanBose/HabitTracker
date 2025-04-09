import React from 'react';
import { Box, Typography, Alert, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogin from './GoogleLogin';

const LoginPage: React.FC = () => {
  const { error } = useAuth();

  const handleLoginError = () => {
    console.error('Google Login Failed');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Habit Tracker
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Track your daily habits and stay motivated
      </Typography>
      
      {error && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            maxWidth: 600, 
            width: '100%',
            backgroundColor: '#fff8e1'
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Authentication Error
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Typography variant="body1" paragraph>
            If you're seeing this error, please make sure your Google OAuth client ID is configured correctly:
          </Typography>
          <ol>
            <li>Go to the Google Cloud Console: https://console.cloud.google.com/</li>
            <li>Select your project</li>
            <li>Go to "APIs & Services" &gt; "Credentials"</li>
            <li>Find your OAuth 2.0 Client ID and click on it to edit</li>
            <li>Under "Authorized JavaScript origins", add: http://localhost:3000</li>
            <li>Click "Save"</li>
          </ol>
        </Paper>
      )}
      
      <GoogleLogin onError={handleLoginError} />
    </Box>
  );
};

export default LoginPage; 