import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Platform } from 'react-native';
import {
  Home, Layers, BarChart2, Users, MoreHorizontal, LayoutDashboard
} from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import PackagesScreen from '../screens/PackagesScreen';
import TrainersScreen from '../screens/TrainersScreen';
import MoreScreen from '../screens/MoreScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Tab = createBottomTabNavigator();

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 80 : 64;

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#E34A29',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color, focused, size }) => {
          const iconSize = focused ? 24 : 22;
          if (route.name === 'Home') return <Home color={color} size={iconSize} />;
          if (route.name === 'Services') return <Layers color={color} size={iconSize} />;
          if (route.name === 'Package') return <BarChart2 color={color} size={iconSize} />;
          if (route.name === 'Trainer') return <Users color={color} size={iconSize} />;
          if (route.name === 'Dashboard') return <LayoutDashboard color={color} size={iconSize} />;
          if (route.name === 'More') return <MoreHorizontal color={color} size={iconSize} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ tabBarLabel: 'Services' }} />
      <Tab.Screen name="Package" component={PackagesScreen} options={{ tabBarLabel: 'Plans' }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Portal' }} />
      <Tab.Screen name="Trainer" component={TrainersScreen} options={{ tabBarLabel: 'Trainers' }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarLabel: 'More' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D0D0D',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    height: TAB_BAR_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
});
