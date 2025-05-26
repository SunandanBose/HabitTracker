const CACHE_NAME = 'habit-tracker-v1';
const STATIC_CACHE_NAME = 'habit-tracker-static-v1';
const DYNAMIC_CACHE_NAME = 'habit-tracker-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/HTlogo.ico',
  '/HTlogo.png',
  '/HTlogo.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://apis.google.com/js/api.js'
];

// Google APIs that we want to cache
const GOOGLE_API_URLS = [
  'https://www.googleapis.com/oauth2/v2/userinfo',
  'https://www.googleapis.com/drive/v3/',
  'https://accounts.google.com/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('https://apis.google.com')));
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle Google APIs differently
  if (isGoogleAPI(request.url)) {
    event.respondWith(handleGoogleAPI(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(request.url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default handling for other requests
  event.respondWith(handleDefault(request));
});

// Check if URL is a Google API
function isGoogleAPI(url) {
  return GOOGLE_API_URLS.some(apiUrl => url.includes(apiUrl.replace('https://', '').split('/')[0]));
}

// Check if URL is a static asset
function isStaticAsset(url) {
  return url.includes('/static/') || 
         url.includes('.js') || 
         url.includes('.css') || 
         url.includes('.png') || 
         url.includes('.jpg') || 
         url.includes('.ico') ||
         url.includes('manifest.json');
}

// Handle Google API requests
async function handleGoogleAPI(request) {
  try {
    // Always try network first for API calls
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses for short term
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for API, trying cache:', request.url);
    
    // Try to serve from cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a custom offline response for API failures
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature requires an internet connection' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  try {
    // Try cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to fetch static asset:', request.url);
    
    // For critical assets, try to serve a fallback
    if (request.url.includes('.js') || request.url.includes('.css')) {
      return new Response('/* Offline fallback */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    throw error;
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for navigation, serving cached index');
    
    // Serve cached index.html for offline navigation
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Habit Tracker - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center; 
              padding: 50px; 
              background: #f9fafc;
            }
            .offline-message {
              max-width: 400px;
              margin: 0 auto;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>Habit Tracker is not available right now. Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Default handling for other requests
async function handleDefault(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'habit-data-sync') {
    event.waitUntil(syncHabitData());
  }
});

// Sync habit data when back online
async function syncHabitData() {
  try {
    console.log('Service Worker: Syncing habit data...');
    
    // Get pending sync data from IndexedDB or localStorage
    const pendingData = await getPendingSyncData();
    
    if (pendingData && pendingData.length > 0) {
      // Send data to Google Drive API
      for (const data of pendingData) {
        await syncDataToGoogleDrive(data);
      }
      
      // Clear pending data after successful sync
      await clearPendingSyncData();
      
      console.log('Service Worker: Habit data synced successfully');
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync habit data:', error);
  }
}

// Helper functions for data sync (these would integrate with your existing data layer)
async function getPendingSyncData() {
  // This would integrate with your existing data storage
  return [];
}

async function syncDataToGoogleDrive(data) {
  // This would integrate with your existing Google Drive service
  console.log('Service Worker: Syncing data to Google Drive:', data);
}

async function clearPendingSyncData() {
  // This would clear the pending sync data
  console.log('Service Worker: Clearing pending sync data');
}

// Push notifications (for future habit reminders)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Don\'t forget to track your habits today!',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open Habit Tracker',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Habit Tracker', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 