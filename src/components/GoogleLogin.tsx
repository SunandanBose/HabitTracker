import React from 'react';
import { GoogleLogin as GoogleLoginButton } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

interface GoogleLoginProps {
  onSuccess?: (response: any) => void;
  onError?: () => void;
}

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
    <GoogleLoginButton
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap
      theme="filled_blue"
    />
  );
};

export default GoogleLogin; 