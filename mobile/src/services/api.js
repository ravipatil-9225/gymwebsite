import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://172.16.96.211:5000';
const API_URL = `${BASE_URL}/api`; 
export { BASE_URL };
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
