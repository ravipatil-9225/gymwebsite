import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Settings, Image as ImageIcon, Phone, ChevronRight, LogOut, Shield, Gift, QrCode, Apple, Scan } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';

export default function MoreScreen({ navigation }) {
  const { logout, user } = React.useContext(AuthContext);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: async () => { await logout(); } 
      }
    ]);
  };

  const menuItems = [
    ...(user?.role === 'admin' ? [
      { title: 'Admin Management', icon: <Shield color="#A855F7" size={24} />, route: 'AdminPanel' },
      { title: 'Attendance Scanner', icon: <QrCode color="#06B6D4" size={24} />, route: 'AttendanceScanner' },
      { title: 'SmartNutrition Hub', icon: <Apple color="#22C55E" size={24} />, route: 'SmartNutrition' },
    ] : []),
    { title: 'Media & Gallery', icon: <ImageIcon color="#E34A29" size={24} />, route: 'Gallery' },
    { title: 'Exclusive Offers', icon: <Gift color="#E34A29" size={24} />, route: 'Offers' },
    { title: 'Contact Us', icon: <Phone color="#E34A29" size={24} />, route: 'Contact' },
    { title: 'Account Settings', icon: <Settings color="#E34A29" size={24} />, route: 'Settings' },
  ];


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>MORE OPTIONS</Text>
        <Text style={styles.subtitle}>Explore Tara Fitness</Text>
        
        <View style={styles.list}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.item}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <View style={styles.itemLeft}>
                <View style={styles.iconBg}>{item.icon}</View>
                <Text style={styles.itemText}>{item.title}</Text>
              </View>
              <ChevronRight color="#666" size={20} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#E34A29" size={20} style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>SIGN OUT</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { padding: 24, paddingTop: 60 },
  title: { color: '#E34A29', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#A0A0A0', marginBottom: 32 },
  list: { backgroundColor: '#151515', borderRadius: 16, borderColor: '#222', borderWidth: 1, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  itemText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 16, backgroundColor: '#151515', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  logoutText: { color: '#E34A29', fontWeight: 'bold', fontSize: 16 }
});
