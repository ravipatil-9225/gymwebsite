import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        const storedToken = await AsyncStorage.getItem('userToken');

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedToken) setToken(storedToken);
      } catch (e) {
        console.error('Error loading auth state', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    await AsyncStorage.setItem('userToken', authToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('userToken');
  };

  const updateUser = async (fields) => {
    const updated = { ...user, ...fields };
    setUser(updated);
    await AsyncStorage.setItem('userData', JSON.stringify(updated));

    if (token) {
      try {
        const res = await api.put('/users/profile', fields);
        if (res.status === 200) {
          const merged = { ...updated, ...res.data };
          setUser(merged);
          await AsyncStorage.setItem('userData', JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('Profile sync to backend failed:', err);
      }
    }
  };

  const uploadPhoto = async (imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('photo', { uri: imageUri, name: filename, type });

    try {
      const res = await api.post('/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      if (res.data?.profileImage) {
        const updated = { ...user, profileImage: res.data.profileImage };
        setUser(updated);
        await AsyncStorage.setItem('userData', JSON.stringify(updated));
      }
      return res.data;
    } catch (err) {
      console.error('Photo upload failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, uploadPhoto, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
