import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Paper, styled, Button } from '@mui/material';

interface GoogleLoginProps {
  onSuccess?: (response: any) => void;
  onError?: () => void;
}

const StyledLoginContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  width: '100%',
  maxWidth: 360,
}));

const StyledGoogleButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#4285f4',
  color: 'white',
  padding: theme.spacing(1.5, 3),
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '&:hover': {
    backgroundColor: '#3367d6',
  },
  '&:disabled': {
    backgroundColor: '#cccccc',
    color: '#666666',
  },
}));

const GoogleLogin: React.FC<GoogleLoginProps> = ({ onSuccess, onError }) => {
  const { handleGoogleLoginSuccess } = useAuth();

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Handle the successful login with access token
      handleGoogleLoginSuccess(tokenResponse);
      if (onSuccess) {
        onSuccess(tokenResponse);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      if (onError) {
        onError();
      }
    },
    scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
    flow: 'implicit',
  });

  return (
    <StyledLoginContainer elevation={3}>
      <Typography 
        variant="h6" 
        color="primary" 
        fontWeight="600" 
        sx={{ 
          mb: 3, 
          textAlign: 'center' 
        }}
      >
        Sign in with Google
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <StyledGoogleButton
          onClick={() => googleLogin()}
          variant="contained"
          size="large"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </StyledGoogleButton>
      </Box>
    </StyledLoginContainer>
  );
};

export default GoogleLogin; 