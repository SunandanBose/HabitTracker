import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage: React.FC = () => {
  const { handleGoogleLoginSuccess } = useAuth();

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
      <GoogleLogin
        onSuccess={handleGoogleLoginSuccess}
        onError={handleLoginError}
        useOneTap
        theme="filled_blue"
      />
    </Box>
  );
};

export default LoginPage; 