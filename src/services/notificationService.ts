import { NotificationSettings } from '../components/NotificationSettings';

export class NotificationService {
  private static instance: NotificationService;
  private reminderTimeoutId: number | null = null;
  private settings: NotificationSettings | null = null;

  private constructor() {
    this.loadSettings();
    this.initializeNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('habitTracker_notificationSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.settings = {
          ...parsed,
          reminderTime: new Date(parsed.reminderTime),
          permission: Notification.permission
        };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  private saveSettings(): void {
    if (this.settings) {
      const settingsToSave = {
        ...this.settings,
        reminderTime: this.settings.reminderTime.toISOString()
      };
      localStorage.setItem('habitTracker_notificationSettings', JSON.stringify(settingsToSave));
    }
  }

  public updateSettings(newSettings: NotificationSettings): void {
    this.settings = { ...newSettings };
    this.saveSettings();
    
    // Reschedule notifications based on new settings
    this.scheduleNotifications();
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    
    if (this.settings) {
      this.settings.permission = permission;
      this.saveSettings();
    }

    return permission;
  }

  public initializeNotifications(): void {
    // Check if we have permission and settings
    if (this.settings?.enabled && this.settings?.permission === 'granted') {
      this.scheduleNotifications();
    }

    // Listen for visibility changes to reschedule if needed
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.settings?.dailyReminder) {
        this.scheduleNotifications();
      }
    });

    // Listen for page unload to clear timeouts
    window.addEventListener('beforeunload', () => {
      this.clearScheduledNotifications();
    });
  }

  private scheduleNotifications(): void {
    this.clearScheduledNotifications();

    if (!this.settings?.enabled || 
        !this.settings?.dailyReminder || 
        this.settings?.permission !== 'granted') {
      return;
    }

    this.scheduleDailyReminder();
  }

  private scheduleDailyReminder(): void {
    if (!this.settings) return;

    const now = new Date();
    const reminderTime = new Date(this.settings.reminderTime);
    
    // Create today's reminder time
    const todayReminder = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      reminderTime.getHours(),
      reminderTime.getMinutes(),
      0,
      0
    );

    // If the time has already passed today, schedule for tomorrow
    if (todayReminder <= now) {
      todayReminder.setDate(todayReminder.getDate() + 1);
    }

    const timeUntilReminder = todayReminder.getTime() - now.getTime();

    // Don't schedule if it's more than 24 hours away (safety check)
    if (timeUntilReminder > 24 * 60 * 60 * 1000) {
      console.warn('Reminder time is more than 24 hours away, not scheduling');
      return;
    }

    this.reminderTimeoutId = window.setTimeout(() => {
      this.showDailyReminder();
      // Schedule the next reminder for tomorrow
      this.scheduleDailyReminder();
    }, timeUntilReminder);

    console.log(`Daily reminder scheduled for ${todayReminder.toLocaleString()}`);
    console.log(`Time until reminder: ${Math.round(timeUntilReminder / 1000 / 60)} minutes`);
  }

  private showDailyReminder(): void {
    if (this.settings?.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification('Habit Tracker Reminder', {
        body: "Don't forget to track your habits today! 🎯",
        icon: '/HTlogo.png',
        badge: '/HTlogo.png',
        tag: 'daily-reminder',
        requireInteraction: false,
        silent: false,
        timestamp: Date.now()
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Try to bring the app to foreground if it's a PWA
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            if (registration.active) {
              registration.active.postMessage({
                type: 'NOTIFICATION_CLICKED',
                action: 'open_app'
              });
            }
          });
        }
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      console.log('Daily reminder notification shown');
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  public showTestNotification(): void {
    if (this.settings?.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from Habit Tracker! 🧪',
        icon: '/HTlogo.png',
        badge: '/HTlogo.png',
        tag: 'test-notification',
        requireInteraction: false,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('Test notification shown');
    } catch (error) {
      console.error('Failed to show test notification:', error);
      throw error;
    }
  }

  private clearScheduledNotifications(): void {
    if (this.reminderTimeoutId) {
      clearTimeout(this.reminderTimeoutId);
      this.reminderTimeoutId = null;
    }
  }

  public getNextReminderTime(): Date | null {
    if (!this.settings?.dailyReminder || !this.settings?.reminderTime) {
      return null;
    }

    const now = new Date();
    const reminderTime = new Date(this.settings.reminderTime);
    
    const todayReminder = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      reminderTime.getHours(),
      reminderTime.getMinutes(),
      0,
      0
    );

    // If the time has already passed today, return tomorrow's time
    if (todayReminder <= now) {
      todayReminder.setDate(todayReminder.getDate() + 1);
    }

    return todayReminder;
  }

  public isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  public getSettings(): NotificationSettings | null {
    return this.settings;
  }

  // Method to handle app becoming active (useful for PWAs)
  public onAppActive(): void {
    if (this.settings?.dailyReminder && this.settings?.permission === 'granted') {
      // Reschedule notifications when app becomes active
      this.scheduleNotifications();
    }
  }

  // Method to handle app going inactive
  public onAppInactive(): void {
    // Keep notifications running even when app is inactive
    // This is important for PWAs
  }

  // Cleanup method
  public destroy(): void {
    this.clearScheduledNotifications();
    document.removeEventListener('visibilitychange', this.initializeNotifications);
  }
}

// Export a singleton instance
export const notificationService = NotificationService.getInstance(); 