import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import PackagesScreen from '../screens/PackagesScreen';
import TrainersScreen from '../screens/TrainersScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createMaterialTopTabNavigator();

export default function MainTabNavigator() {
  return (
    // SafeAreaView pushes the Navbar just below your phone's camera notch/status bar
    <SafeAreaView style={styles.safeArea}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#0A0A0A',
            borderBottomWidth: 1,      // Thin separator line at the bottom of the navbar
            borderBottomColor: '#222',
            elevation: 0,              // Remove shadows so it blends perfectly
            shadowOpacity: 0, 
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: 'bold',
            letterSpacing: 0.5,
          },
          tabBarActiveTintColor: '#E34A29', // Gym Website's primary color
          tabBarInactiveTintColor: '#666',
          tabBarIndicatorStyle: {
            backgroundColor: '#E34A29', // Little animated bar under the active tab
            height: 3,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          },
          animationEnabled: true,       // Enables smooth swiping between tabs
          swipeEnabled: true,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Services" component={ServicesScreen} />
        <Tab.Screen name="Package" component={PackagesScreen} />
        <Tab.Screen name="Trainer" component={TrainersScreen} />
        <Tab.Screen name="More" component={MoreScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  }
});
