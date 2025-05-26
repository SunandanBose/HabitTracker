import React, { useState, useEffect } from 'react';
import {
  Button,
  Snackbar,
  Alert,
  Box,
  Typography,
  IconButton,
  Slide,
  styled,
  alpha
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  Smartphone as PhoneIcon
} from '@mui/icons-material';
import { setupPWAInstallPrompt } from '../serviceWorkerRegistration';

const InstallBanner = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  left: 20,
  right: 20,
  zIndex: 1300,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    left: 'auto',
    right: 20,
    maxWidth: 400,
  }
}));

const InstallButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.contrastText,
  color: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.contrastText, 0.9),
  },
  fontWeight: 600,
  borderRadius: theme.spacing(1),
  textTransform: 'none',
}));

interface PWAInstallButtonProps {
  onInstallSuccess?: () => void;
  onInstallDismiss?: () => void;
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onInstallSuccess,
  onInstallDismiss
}) => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInstalled = isStandalone || isInWebAppiOS;
      
      setIsInstalled(isInstalled);
      
      if (isInstalled) {
        console.log('PWA: App is already installed');
        return true;
      }
      return false;
    };

    if (checkIfInstalled()) {
      return;
    }

    // Set up PWA install prompt
    const pwaInstall = setupPWAInstallPrompt();
    setInstallPrompt(pwaInstall);

    // Listen for install availability
    const handleInstallAvailable = () => {
      if (!dismissed) {
        setShowInstallPrompt(true);
        setShowBanner(true);
      }
    };

    const handleInstallCompleted = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setShowBanner(false);
      setShowSuccessMessage(true);
      if (onInstallSuccess) {
        onInstallSuccess();
      }
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-completed', handleInstallCompleted);

    // Check if install prompt is available after a delay
    setTimeout(() => {
      if (pwaInstall.isInstallable() && !dismissed) {
        setShowInstallPrompt(true);
        setShowBanner(true);
      }
    }, 3000); // Show after 3 seconds

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-completed', handleInstallCompleted);
    };
  }, [dismissed, onInstallSuccess]);

  const handleInstall = () => {
    if (installPrompt && installPrompt.showInstallPrompt) {
      installPrompt.showInstallPrompt();
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    if (onInstallDismiss) {
      onInstallDismiss();
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessMessage(false);
  };

  // Don't show anything if already installed or dismissed
  if (isInstalled || dismissed) {
    return (
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          <Typography variant="body2">
            🎉 Habit Tracker installed successfully! You can now access it from your home screen.
          </Typography>
        </Alert>
      </Snackbar>
    );
  }

  return (
    <>
      <Slide direction="up" in={showBanner} mountOnEnter unmountOnExit>
        <InstallBanner>
          <PhoneIcon sx={{ fontSize: 32 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Install Habit Tracker
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Get the app for a better experience with offline access
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <InstallButton
              size="small"
              startIcon={<InstallIcon />}
              onClick={handleInstall}
            >
              Install
            </InstallButton>
            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{ 
                color: 'inherit',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.1)
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </InstallBanner>
      </Slide>

      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          <Typography variant="body2">
            🎉 Habit Tracker installed successfully! You can now access it from your home screen.
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAInstallButton; 