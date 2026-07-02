import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Backend URL Configuration ───────────────────────────────────────────────
// Production: Your deployed backend
// Development: Use your local IP when testing on the same WiFi
// To switch to local: change IS_LOCAL_DEV to true and set your PC's local IP

const IS_LOCAL_DEV = false; // Set to true for local WiFi testing
const LOCAL_IP = '172.16.96.211'; // Your PC's local IP (only used when IS_LOCAL_DEV = true)
const LOCAL_PORT = '5000';

export const BASE_URL = IS_LOCAL_DEV
  ? `http://${LOCAL_IP}:${LOCAL_PORT}`
  : 'https://tfc365.com';

const API_URL = `${BASE_URL}/api`;
export const STATIC_URL = 'https://tfc365.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Important: Fails instantly after 10s if backend is down
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
