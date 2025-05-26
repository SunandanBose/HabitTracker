import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Alert,
  useTheme,
  useMediaQuery,
  styled
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import NotificationStatusIndicator from './NotificationStatusIndicator';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  position: 'sticky',
  top: 0,
  zIndex: 1100
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 2),
  }
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  border: `2px solid ${theme.palette.background.paper}`,
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  minWidth: 180,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

const Header: React.FC = () => {
  const { user, signOut, openGoogleDrive, error } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGoogleDrive = () => {
    openGoogleDrive();
    handleClose();
  };

  const handleSignOut = () => {
    signOut();
    handleClose();
  };

  return (
    <>
      <StyledAppBar elevation={0} color="default">
        <StyledToolbar>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component="div" 
            color="primary"
            fontWeight="600"
            sx={{ flexGrow: 1 }}
          >
            Habit Tracker
          </Typography>
          {user && (
            <Box display="flex" alignItems="center" gap={2}>
              <NotificationStatusIndicator compact={isMobile} />
              
              {!isMobile && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    fontWeight: 500 
                  }}
                >
                  {user.name}
                </Typography>
              )}
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                sx={{ p: 0 }}
              >
                <StyledAvatar
                  alt={user.name}
                  src={user.picture}
                />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 3,
                  sx: { 
                    borderRadius: 2,
                    mt: 1,
                    overflow: 'hidden'
                  }
                }}
              >
                <StyledMenuItem onClick={handleGoogleDrive}>Open Google Drive</StyledMenuItem>
                <StyledMenuItem onClick={handleSignOut}>Sign Out</StyledMenuItem>
              </Menu>
            </Box>
          )}
        </StyledToolbar>
      </StyledAppBar>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2, 
            mx: 2, 
            borderRadius: 2, 
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          {error}
        </Alert>
      )}
    </>
  );
};

export default Header; 