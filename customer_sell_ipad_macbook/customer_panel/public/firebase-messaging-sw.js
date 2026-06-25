importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAbEjlC8T7wJwrPHa_CJeF0AOb88IPdylM",
  authDomain: "buybackelite-ea07f.firebaseapp.com",
  projectId: "buybackelite-ea07f",
  storageBucket: "buybackelite-ea07f.firebasestorage.app",
  messagingSenderId: "573873222401",
  appId: "1:573873222401:web:9425ee7f6f0623bb472100",
  measurementId: "G-NWZ36LB9EH"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Customer Background Message:', payload);
  const notificationTitle = payload.notification?.title || 'BuyBack Elite';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
