import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { notificationService } from './services/notificationService';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('PWA: Service worker registered successfully');
    console.log('PWA: App is ready for offline use');
    
    // Initialize notification service after service worker is ready
    notificationService.onAppActive();
  },
  onUpdate: (registration) => {
    console.log('PWA: New content is available');
    // You could show a notification to the user here
    if (window.confirm('New version available! Reload to update?')) {
      window.location.reload();
    }
  },
  onOfflineReady: () => {
    console.log('PWA: App is ready to work offline');
    // You could show a notification that the app is ready for offline use
  },
  onNeedRefresh: () => {
    console.log('PWA: New content available, please refresh');
    // You could show a persistent notification here
  }
});

// Handle app visibility changes for notification service
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    notificationService.onAppInactive();
  } else {
    notificationService.onAppActive();
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  notificationService.onAppInactive();
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
