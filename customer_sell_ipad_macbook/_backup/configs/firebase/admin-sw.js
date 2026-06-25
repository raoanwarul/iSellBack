importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAbEjlC8T7wJwrPHa_CJeF0AOb88IPdylM",
  authDomain: "buybackelite-ea07f.firebaseapp.com",
  projectId: "buybackelite-ea07f",
  storageBucket: "buybackelite-ea07f.firebasestorage.app",
  messagingSenderId: "573873222401",
  appId: "1:573873222401:web:7a4bd7ef1cb74f49472100",
  measurementId: "G-PCV79RRYNR"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Background Message:', payload);
  const notificationTitle = payload.notification?.title || 'BuyBack Admin';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
