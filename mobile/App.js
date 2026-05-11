import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <AppNavigator />
      </SocketProvider>
    </AuthProvider>
  );
}
