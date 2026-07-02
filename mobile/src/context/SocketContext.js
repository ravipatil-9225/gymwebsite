import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let newSocket;

    const initSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        newSocket = io(BASE_URL, {
          transports: ['websocket'],
          auth: token ? { token } : {},
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          timeout: 10000,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
          console.log('✅ Mobile Socket.io connected:', newSocket.id);
          setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('⚠️ Socket disconnected:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
          console.warn('❌ Socket connection error:', err.message);
          setIsConnected(false);
        });

        newSocket.on('db_changed', () => {
          console.log('🔄 Data change detected! Triggering refresh...');
          setRefreshTrigger(prev => prev + 1);
        });

        // Listen for admin-specific events
        newSocket.on('new_enquiry', () => setRefreshTrigger(prev => prev + 1));
        newSocket.on('payment_update', () => setRefreshTrigger(prev => prev + 1));
        newSocket.on('user_update', () => setRefreshTrigger(prev => prev + 1));

      } catch (err) {
        console.error('Socket init error:', err);
      }
    };

    initSocket();

    return () => {
      if (newSocket) {
        newSocket.close();
        console.log('🔌 Socket closed');
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, refreshTrigger, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
