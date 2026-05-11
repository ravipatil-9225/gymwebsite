import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../services/api';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const newSocket = io(BASE_URL, {
       transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Mobile connected to Socket.io');
    });

    newSocket.on('db_changed', () => {
      console.log('🔄 Data change detected! Triggering refresh...');
      setRefreshTrigger(prev => prev + 1);
    });

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, refreshTrigger }}>
      {children}
    </SocketContext.Provider>
  );
};
