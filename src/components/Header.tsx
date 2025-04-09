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
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, signOut, openGoogleDrive, error } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Habit Tracker
          </Typography>
          {user && (
            <Box>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar
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
              >
                <MenuItem onClick={handleGoogleDrive}>Open Google Drive</MenuItem>
                <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      {error && (
        <Alert severity="error" sx={{ mt: 2, mx: 2 }}>
          {error}
        </Alert>
      )}
    </>
  );
};

export default Header; 