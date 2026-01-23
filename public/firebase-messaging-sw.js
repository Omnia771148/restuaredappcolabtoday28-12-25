
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyDZ2uueufL3iXjyY2q-p1YT4III3xsZfgY",
    authDomain: "realdel-f964c.firebaseapp.com",
    projectId: "realdel-f964c",
    storageBucket: "realdel-f964c.firebasestorage.app",
    messagingSenderId: "118715949536",
    appId: "1:118715949536:web:9d37749a6c6e2346548b85",
    measurementId: "G-XGFZJKTF9D"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 🔹 HANDLE BACKGROUND MESSAGES
// This is critical for Android/iOS when app is closed/backgrounded
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'New Order';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new order!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: payload.data || {}, // Pass data payload
        requireInteraction: true, // ⚠️ Crucial for keeping notification visible on some Androids
        tag: 'new-order' // Prevents stacking if desired, or remove to stack
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 🔹 ACTIVATE IMMEDIATELY
// This ensures that updates to the SW take effect immediately
self.addEventListener('install', function (event) {
    console.log('Service Worker installing.');
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log('Service Worker activating.');
    event.waitUntil(self.clients.claim());
});

// 🔹 HANDLE NOTIFICATION CLICKS
// This is often required for valid service worker behavior on some OSes
self.addEventListener('notificationclick', function (event) {
    console.log('Computed notification click');
    event.notification.close();

    // Open the app
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('/') && 'focus' in client)
                    return client.focus();
            }
            if (clients.openWindow)
                return clients.openWindow('/orders');
        })
    );
});
