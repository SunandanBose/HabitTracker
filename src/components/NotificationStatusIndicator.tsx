import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  styled,
  alpha
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsOff as NotificationOffIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { notificationService } from '../services/notificationService';

const StatusIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const NotificationChip = styled(Chip)<{ status: 'enabled' | 'disabled' | 'scheduled' }>(({ theme, status }) => ({
  fontSize: '0.75rem',
  height: 24,
  '& .MuiChip-icon': {
    fontSize: '1rem',
  },
  ...(status === 'enabled' && {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.main,
    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
  }),
  ...(status === 'disabled' && {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.main,
    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
  }),
  ...(status === 'scheduled' && {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  }),
}));

interface NotificationStatusIndicatorProps {
  compact?: boolean;
  showTooltip?: boolean;
}

const NotificationStatusIndicator: React.FC<NotificationStatusIndicatorProps> = ({
  compact = false,
  showTooltip = true
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hasReminder, setHasReminder] = useState(false);
  const [nextReminderTime, setNextReminderTime] = useState<Date | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      const settings = notificationService.getSettings();
      const currentPermission = notificationService.getPermissionStatus();
      const nextTime = notificationService.getNextReminderTime();
      
      setPermission(currentPermission);
      setHasReminder((settings?.dailyReminder && settings?.enabled) || false);
      setNextReminderTime(nextTime);
    };

    // Initial update
    updateStatus();

    // Update every minute to keep next reminder time current
    const interval = setInterval(updateStatus, 60000);

    // Listen for permission changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getStatus = (): 'enabled' | 'disabled' | 'scheduled' => {
    if (permission !== 'granted') {
      return 'disabled';
    }
    if (hasReminder && nextReminderTime) {
      return 'scheduled';
    }
    return 'enabled';
  };

  const getStatusText = () => {
    const status = getStatus();
    switch (status) {
      case 'scheduled':
        return 'Reminder Set';
      case 'enabled':
        return 'Notifications On';
      case 'disabled':
        return 'Notifications Off';
    }
  };

  const getStatusIcon = () => {
    const status = getStatus();
    switch (status) {
      case 'scheduled':
        return <ScheduleIcon />;
      case 'enabled':
        return <NotificationIcon />;
      case 'disabled':
        return <NotificationOffIcon />;
    }
  };

  const getTooltipText = () => {
    const status = getStatus();
    switch (status) {
      case 'scheduled':
        if (nextReminderTime) {
          const timeString = nextReminderTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const now = new Date();
          const isToday = nextReminderTime.toDateString() === now.toDateString();
          const isTomorrow = nextReminderTime.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
          
          if (isToday) {
            return `Daily reminder scheduled for today at ${timeString}`;
          } else if (isTomorrow) {
            return `Daily reminder scheduled for tomorrow at ${timeString}`;
          } else {
            return `Daily reminder scheduled for ${nextReminderTime.toLocaleDateString()} at ${timeString}`;
          }
        }
        return 'Daily reminder is scheduled';
      case 'enabled':
        return 'Notifications are enabled but no reminders are set';
      case 'disabled':
        return 'Notifications are disabled or not permitted';
    }
  };

  if (compact) {
    const content = (
      <IconButton size="small" sx={{ color: 'inherit' }}>
        {getStatusIcon()}
      </IconButton>
    );

    return showTooltip ? (
      <Tooltip title={getTooltipText()} arrow>
        {content}
      </Tooltip>
    ) : content;
  }

  const content = (
    <StatusIndicator>
      <NotificationChip
        status={getStatus()}
        icon={getStatusIcon()}
        label={getStatusText()}
        variant="outlined"
        size="small"
      />
    </StatusIndicator>
  );

  return showTooltip ? (
    <Tooltip title={getTooltipText()} arrow>
      {content}
    </Tooltip>
  ) : content;
};

export default NotificationStatusIndicator; 