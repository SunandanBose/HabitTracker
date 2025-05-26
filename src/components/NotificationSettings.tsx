import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  Chip,
  styled,
  alpha
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsOff as NotificationOffIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { notificationService } from '../services/notificationService';

const NotificationCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
}));

const StatusChip = styled(Chip)<{ status: 'enabled' | 'disabled' | 'pending' }>(({ theme, status }) => ({
  fontWeight: 600,
  ...(status === 'enabled' && {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  }),
  ...(status === 'disabled' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  }),
  ...(status === 'pending' && {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  }),
}));

interface NotificationSettingsProps {
  onSettingsChange?: (settings: NotificationSettings) => void;
}

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: Date;
  permission: NotificationPermission;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyReminder: false,
    reminderTime: new Date(2024, 0, 1, 21, 30), // 9:30 PM
    permission: 'default'
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nextReminderTime, setNextReminderTime] = useState<Date | null>(null);

  useEffect(() => {
    // Load settings from notification service
    const serviceSettings = notificationService.getSettings();
    if (serviceSettings) {
      setSettings(serviceSettings);
    } else {
      // Initialize with default settings
      const defaultSettings = {
        enabled: false,
        dailyReminder: false,
        reminderTime: new Date(2024, 0, 1, 21, 30), // 9:30 PM
        permission: notificationService.getPermissionStatus()
      };
      setSettings(defaultSettings);
      notificationService.updateSettings(defaultSettings);
    }

    // Update next reminder time
    updateNextReminderTime();
  }, []);

  useEffect(() => {
    // Update notification service when settings change
    notificationService.updateSettings(settings);
    
    // Notify parent component
    if (onSettingsChange) {
      onSettingsChange(settings);
    }

    // Update next reminder time
    updateNextReminderTime();
  }, [settings, onSettingsChange]);

  const updateNextReminderTime = () => {
    const nextTime = notificationService.getNextReminderTime();
    setNextReminderTime(nextTime);
  };

  const requestNotificationPermission = async () => {
    try {
      if (!notificationService.isNotificationSupported()) {
        throw new Error('This browser does not support notifications');
      }

      const permission = await notificationService.requestPermission();
      setSettings(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        setShowSuccess(true);
      } else if (permission === 'denied') {
        setErrorMessage('Notifications were denied. Please enable them in your browser settings.');
        setShowError(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to request notification permission');
      setShowError(true);
    }
  };

  const testNotification = () => {
    try {
      notificationService.showTestNotification();
      setShowSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to show test notification');
      setShowError(true);
    }
  };

  const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setSettings(prev => ({ ...prev, enabled }));
    
    if (enabled && settings.permission !== 'granted') {
      requestNotificationPermission();
    }
  };

  const handleDailyReminderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dailyReminder = event.target.checked;
    setSettings(prev => ({ ...prev, dailyReminder }));
  };

  const handleTimeChange = (newTime: Date | null) => {
    if (newTime) {
      setSettings(prev => ({ ...prev, reminderTime: newTime }));
    }
  };

  const getPermissionStatus = (): 'enabled' | 'disabled' | 'pending' => {
    switch (settings.permission) {
      case 'granted':
        return 'enabled';
      case 'denied':
        return 'disabled';
      default:
        return 'pending';
    }
  };

  const getPermissionText = () => {
    switch (settings.permission) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Denied';
      default:
        return 'Not Set';
    }
  };

  const formatNextReminderTime = () => {
    if (!nextReminderTime) return 'Not scheduled';
    
    const now = new Date();
    const isToday = nextReminderTime.toDateString() === now.toDateString();
    const isTomorrow = nextReminderTime.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    const timeString = nextReminderTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeString}`;
    } else {
      return `${nextReminderTime.toLocaleDateString()} at ${timeString}`;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <NotificationCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
                Notification Settings
              </Typography>
              <StatusChip 
                status={getPermissionStatus()} 
                label={getPermissionText()}
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get reminded to track your habits and stay on top of your goals.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={handleEnabledChange}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      Enable Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Allow the app to send you notifications
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {settings.permission === 'denied' && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Notifications are blocked. To enable them:
                </Typography>
                <Typography variant="body2" component="ol" sx={{ mt: 1, pl: 2 }}>
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Change notifications from "Block" to "Allow"</li>
                  <li>Refresh the page</li>
                </Typography>
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.dailyReminder}
                    onChange={handleDailyReminderChange}
                    color="primary"
                    disabled={settings.permission !== 'granted'}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Daily Reminder
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Get a daily reminder to track your habits
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Box>

            {settings.dailyReminder && (
              <Box sx={{ ml: 4, mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Reminder Time:
                </Typography>
                <TimePicker
                  value={settings.reminderTime}
                  onChange={handleTimeChange}
                  disabled={settings.permission !== 'granted'}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { maxWidth: 200 }
                    }
                  }}
                />
                
                {nextReminderTime && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="primary.main" fontWeight={500}>
                      Next reminder: {formatNextReminderTime()}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              {settings.permission !== 'granted' && (
                <Button
                  variant="contained"
                  startIcon={<NotificationIcon />}
                  onClick={requestNotificationPermission}
                >
                  Enable Notifications
                </Button>
              )}
              
              {settings.permission === 'granted' && (
                <Button
                  variant="outlined"
                  startIcon={<CheckIcon />}
                  onClick={testNotification}
                >
                  Test Notification
                </Button>
              )}
            </Box>
          </CardContent>
        </NotificationCard>

        <Snackbar
          open={showSuccess}
          autoHideDuration={4000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowSuccess(false)} severity="success">
            Notifications enabled successfully! 🎉
          </Alert>
        </Snackbar>

        <Snackbar
          open={showError}
          autoHideDuration={6000}
          onClose={() => setShowError(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowError(false)} severity="error">
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default NotificationSettings; 