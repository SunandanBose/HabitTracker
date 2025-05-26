import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Typography,
  Box,
  Chip,
  styled,
  alpha
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon
} from '@mui/icons-material';

const OfflineChip = styled(Chip)(({ theme }) => ({
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 1200,
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  fontWeight: 600,
  '& .MuiChip-icon': {
    color: 'inherit'
  }
}));

const OnlineChip = styled(Chip)(({ theme }) => ({
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 1200,
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
  fontWeight: 600,
  '& .MuiChip-icon': {
    color: 'inherit'
  }
}));

interface OfflineIndicatorProps {
  showOnlineStatus?: boolean;
  onlineStatusDuration?: number;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showOnlineStatus = true,
  onlineStatusDuration = 3000
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [showOnlineChip, setShowOnlineChip] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Back online');
      setIsOnline(true);
      setShowOfflineMessage(false);
      
      if (wasOffline && showOnlineStatus) {
        setShowOnlineMessage(true);
        setShowOnlineChip(true);
        
        // Hide online chip after specified duration
        setTimeout(() => {
          setShowOnlineChip(false);
        }, onlineStatusDuration);
      }
      
      setWasOffline(false);
    };

    const handleOffline = () => {
      console.log('Network: Gone offline');
      setIsOnline(false);
      setShowOfflineMessage(true);
      setShowOnlineMessage(false);
      setShowOnlineChip(false);
      setWasOffline(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, showOnlineStatus, onlineStatusDuration]);

  const handleCloseOfflineMessage = () => {
    setShowOfflineMessage(false);
  };

  const handleCloseOnlineMessage = () => {
    setShowOnlineMessage(false);
  };

  return (
    <>
      {/* Offline Indicator Chip */}
      {!isOnline && (
        <OfflineChip
          icon={<OfflineIcon />}
          label="Offline"
          size="small"
        />
      )}

      {/* Online Indicator Chip (temporary) */}
      {isOnline && showOnlineChip && (
        <OnlineChip
          icon={<OnlineIcon />}
          label="Back Online"
          size="small"
        />
      )}

      {/* Offline Snackbar Message */}
      <Snackbar
        open={showOfflineMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={handleCloseOfflineMessage}
      >
        <Alert 
          onClose={handleCloseOfflineMessage} 
          severity="warning" 
          sx={{ 
            width: '100%',
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
          icon={<CloudOffIcon />}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight="600">
              You're offline
            </Typography>
            <Typography variant="body2">
              Some features may not work. Your changes will sync when you're back online.
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Back Online Snackbar Message */}
      <Snackbar
        open={showOnlineMessage}
        autoHideDuration={4000}
        onClose={handleCloseOnlineMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseOnlineMessage} 
          severity="success" 
          sx={{ 
            width: '100%',
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
          icon={<CloudDoneIcon />}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight="600">
              You're back online!
            </Typography>
            <Typography variant="body2">
              All features are now available. Syncing your data...
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicator; 