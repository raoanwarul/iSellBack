import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://atvpqfpvrzvfakcpgnja.supabase.co';

/**
 * Send push notification to a specific user
 * @param {string} userId - Supabase user ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional extra data
 * @param {string[]} deviceTypes - Optional: filter by device type ['web_customer', 'web_admin', 'android_customer', etc.]
 */
export async function sendPushNotification(userId, title, body, data = {}, deviceTypes = []) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session for sending notification');
      return { error: 'Not authenticated' };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        title,
        body,
        data,
        device_types: deviceTypes.length > 0 ? deviceTypes : undefined,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Push notification failed:', result);
      return { error: result.error };
    }

    console.log(`✅ Push sent: ${result.sent}/${result.total} devices`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    return { error: error.message };
  }
}

/**
 * Send notification to all admins
 */
export async function notifyAllAdmins(title, body, data = {}) {
  return sendPushNotification(null, title, body, data, ['web_admin', 'android_admin']);
}

/**
 * Send notification to a customer about their sell request
 */
export async function notifyCustomer(userId, title, body, data = {}) {
  return sendPushNotification(userId, title, body, data, ['web_customer', 'android_customer']);
}

/**
 * Send notification to all agents
 */
export async function notifyAllAgents(title, body, data = {}) {
  return sendPushNotification(null, title, body, data, ['web_agent', 'android_agent']);
}
