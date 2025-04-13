import React from 'react';
import { GoogleLogin as GoogleLoginButton } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Paper, styled } from '@mui/material';

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

const GoogleLogin: React.FC<GoogleLoginProps> = ({ onSuccess, onError }) => {
  const { handleGoogleLoginSuccess } = useAuth();

  const handleSuccess = (credentialResponse: any) => {
    handleGoogleLoginSuccess(credentialResponse);
    if (onSuccess) {
      onSuccess(credentialResponse);
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
    if (onError) {
      onError();
    }
  };

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
      
      <Box sx={{ transform: 'scale(1.2)', mb: 3 }}>
        <GoogleLoginButton
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap
          theme="filled_blue"
          shape="circle"
          size="large"
          text="signin_with"
          locale="en"
        />
      </Box>
    </StyledLoginContainer>
  );
};

export default GoogleLogin; 