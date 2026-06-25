import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabase';

// Firebase config loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

// Validate Firebase config at startup
const requiredFirebaseVars = ['apiKey', 'authDomain', 'projectId'];
const missingVars = requiredFirebaseVars.filter(key => !firebaseConfig[key]);
if (missingVars.length > 0) {
  console.warn(
    `⚠️ Missing Firebase config vars: ${missingVars.join(', ')}.\n` +
    'Add VITE_FIREBASE_* variables to your .env file for push notifications.'
  );
}

let app = null;
try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
  }
} catch (e) {
  console.warn('Firebase initialization failed:', e);
}

let messaging = null;
try {
  if (app) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.warn('Firebase Messaging not supported in this browser:', e);
}

export async function requestNotificationPermission() {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log('✅ Customer Web FCM Token:', token);
      return token;
    }
    console.warn('⚠️ Notification permission denied');
    return null;
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
}

export async function saveFcmTokenToSupabase(token) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('fcm_tokens').upsert({
      user_id: user.id,
      token: token,
      device_type: 'web_customer',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,device_type' });
    console.log('✅ Customer web FCM token saved to Supabase');
  } catch (error) {
    console.error('❌ Failed to save FCM token:', error);
  }
}

export async function deleteFcmToken() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('fcm_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('device_type', 'web_customer');
    console.log('✅ Customer web FCM token deleted');
  } catch (error) {
    console.error('❌ Failed to delete FCM token:', error);
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('🔔 Customer Foreground message:', payload);

    if (Notification.permission === 'granted' && payload.notification) {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/app-logo.png',
      });
    }

    if (callback) callback(payload);
  });
}

export { messaging, getToken, onMessage };
