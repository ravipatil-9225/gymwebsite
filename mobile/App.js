import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <SocketProvider>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
            <AppNavigator />
          </SocketProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
