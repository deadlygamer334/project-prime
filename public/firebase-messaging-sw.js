// Import Firebase Messaging scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// NOTE: These values should match your .env.local configuration
firebase.initializeApp({
    apiKey: "AIzaSyBmsBTRbmCZpblJZR_bydoEsnzLopv41SA",
    authDomain: "paarangat-system.firebaseapp.com",
    projectId: "paarangat-system",
    storageBucket: "paarangat-system.firebasestorage.app",
    messagingSenderId: "88709211947",
    appId: "1:88709211947:web:76f9d69d23fc27b4a1876e",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/icon.svg',
        badge: '/icon.svg',
        data: payload.data,
        tag: payload.data?.type || 'notification',
        requireInteraction: payload.data?.requireInteraction === 'true',
        actions: [],
    };

    // Add actions based on notification type
    if (payload.data?.type === 'timer_complete') {
        notificationOptions.actions = [
            { action: 'start_break', title: 'Start Break' },
            { action: 'continue', title: 'Keep Going' },
        ];
    } else if (payload.data?.type === 'break_complete') {
        notificationOptions.actions = [
            { action: 'start_focus', title: 'Start Focus' },
            { action: 'dismiss', title: 'Dismiss' },
        ];
    }

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    const action = event.action;
    const data = event.notification.data;
    const origin = self.location.origin;

    // Helper to focus existing window or open new one
    const focusOrOpen = (urlPath) => {
        const targetUrl = `${origin}${urlPath}`;

        return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // 1. Try to find a window that is already at the target URL
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }

            // 2. Try to find any window on our origin and navigate/focus it
            for (const client of clientList) {
                if (client.url.includes(origin) && 'focus' in client) {
                    if (client.url !== targetUrl && 'navigate' in client) {
                        client.navigate(targetUrl);
                    }
                    return client.focus();
                }
            }

            // 3. Open new window if nothing found
            if (clients.openWindow) {
                return clients.openWindow(urlPath);
            }
        });
    };

    if (action === 'start_break') {
        event.waitUntil(focusOrOpen('/?action=start_break'));
    } else if (action === 'start_focus') {
        event.waitUntil(focusOrOpen('/?action=start_focus'));
    } else if (action === 'continue') {
        event.waitUntil(focusOrOpen('/'));
    } else if (action === 'dismiss') {
        return;
    } else {
        // Default: open/focus the app
        event.waitUntil(focusOrOpen('/'));
    }
});
