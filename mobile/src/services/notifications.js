import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Safe guard: expo-notifications requires a development build.
// In Expo Go these APIs are unavailable and will crash the app.
// We wrap everything in try/catch dynamic imports so Expo Go still works.

let Notifications = null;
let Device = null;
let Constants = null;

async function loadModules() {
  if (Notifications) return true; // already loaded
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    Constants = require('expo-constants');
    return true;
  } catch (err) {
    console.log('expo-notifications not available in this environment (Expo Go). Skipping push setup.');
    return false;
  }
}

// ── Configure how notifications look when app is in foreground ──
(async () => {
  const ok = await loadModules();
  if (!ok) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (_) {}
})();

// ── Request permission and get push token ──
export async function registerForPushNotificationsAsync() {
  const ok = await loadModules();
  if (!ok || !Device?.isDevice) return null;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Tara Fitness Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E34A29',
        sound: 'default',
      });
    } catch (_) {}
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId
      ?? Constants?.easConfig?.projectId;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await AsyncStorage.setItem('expoPushToken', token.data);

    // Register with backend (non-blocking)
    try {
      const api = require('./api').default;
      await api.post('/auth/push-token', { token: token.data });
    } catch (_) {}

    return token.data;
  } catch (err) {
    console.warn('Push token error:', err.message);
    return null;
  }
}

// ── Show an immediate local notification ──
export async function showLocalNotification(title, body) {
  const ok = await loadModules();
  if (!ok) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null,
    });
  } catch (_) {}
}

// ── Schedule a local notification ──
export async function scheduleLocalNotification(title, body, seconds = 1) {
  const ok = await loadModules();
  if (!ok) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default', color: '#E34A29' },
      trigger: { seconds },
    });
  } catch (_) {}
}

// ── Cancel all notifications ──
export async function cancelAllNotifications() {
  const ok = await loadModules();
  if (!ok) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (_) {}
}
