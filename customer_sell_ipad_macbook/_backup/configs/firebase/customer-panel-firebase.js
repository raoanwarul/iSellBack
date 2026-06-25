import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabase';

const firebaseConfig = {
  apiKey: "AIzaSyAbEjlC8T7wJwrPHa_CJeF0AOb88IPdylM",
  authDomain: "buybackelite-ea07f.firebaseapp.com",
  projectId: "buybackelite-ea07f",
  storageBucket: "buybackelite-ea07f.firebasestorage.app",
  messagingSenderId: "573873222401",
  appId: "1:573873222401:web:9425ee7f6f0623bb472100",
  measurementId: "G-NWZ36LB9EH"
};

const VAPID_KEY = 'BPDCn955AlttJWf0lfhcCnxu-GAVl2s79u_5ApmnUpknkv2HtSOQOEPQ__28Hni2g2PYzLKW7Ht5_BPtdi7ukUA';

const app = initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = getMessaging(app);
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
