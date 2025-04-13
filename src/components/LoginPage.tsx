import React from 'react';
import { Box, Typography, Alert, Paper, useTheme, alpha, styled } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogin from './GoogleLogin';

const StyledContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  gap: theme.spacing(3),
  background: `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
  padding: theme.spacing(3),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 600,
  width: '100%',
  borderRadius: theme.spacing(2),
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
  backgroundColor: alpha(theme.palette.warning.light, 0.1),
  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
}));

const LoginPage: React.FC = () => {
  const { error } = useAuth();
  const theme = useTheme();

  const handleLoginError = () => {
    console.error('Google Login Failed');
  };

  return (
    <StyledContainer>
      <Box 
        sx={{
          textAlign: 'center',
          mb: 2,
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          fontWeight="600"
          color="primary"
          gutterBottom
          sx={{
            fontSize: { xs: '2.5rem', sm: '3rem' }
          }}
        >
          Habit Tracker
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          gutterBottom
          sx={{
            maxWidth: 450,
            mx: 'auto',
            mb: 4,
            fontWeight: 400
          }}
        >
          Track your daily habits and stay motivated to achieve your goals
        </Typography>
      </Box>
      
      {error && (
        <StyledPaper>
          <Typography 
            variant="h6" 
            color="error.dark" 
            gutterBottom
            fontWeight="600"
          >
            Authentication Error
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Typography variant="body1" paragraph>
            If you're seeing this error, please make sure your Google OAuth client ID is configured correctly:
          </Typography>
          <Box 
            component="ol" 
            sx={{ 
              pl: 3,
              '& li': {
                mb: 1,
              }
            }}
          >
            <li>Go to the Google Cloud Console: https://console.cloud.google.com/</li>
            <li>Select your project</li>
            <li>Go to "APIs & Services" &gt; "Credentials"</li>
            <li>Find your OAuth 2.0 Client ID and click on it to edit</li>
            <li>Under "Authorized JavaScript origins", add: http://localhost:3000</li>
            <li>Click "Save"</li>
          </Box>
        </StyledPaper>
      )}
      
      <Box 
        sx={{ 
          mt: error ? 2 : 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <GoogleLogin onError={handleLoginError} />
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mt: 2, textAlign: 'center' }}
        >
          Sign in securely with your Google account to access your habit tracking data
        </Typography>
      </Box>
    </StyledContainer>
  );
};

export default LoginPage; 