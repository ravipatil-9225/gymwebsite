import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LogOut, Calendar, Activity, ChevronRight } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const { logout } = React.useContext(AuthContext);
  const [userName, setUserName] = useState('Member');

  useEffect(() => {
    const fetchUser = async () => {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setUserName(user.name);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: async () => {
          await logout();
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>PORTAL</Text>
            <Text style={styles.userName}>{userName.toUpperCase()}</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <User color="#E34A29" size={32} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Active Member</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.subscriptionArea}>
            <Text style={styles.subTitle}>Subscription</Text>
            <Text style={styles.subStatus}>Fetching your active plan...</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionIconBg}>
              <Calendar color="#FFF" size={24} />
            </View>
            <Text style={styles.actionText}>Schedule</Text>
            <ChevronRight color="#666" size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionIconBg}>
              <Activity color="#FFF" size={24} />
            </View>
            <Text style={styles.actionText}>History</Text>
            <ChevronRight color="#666" size={16} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { padding: 24, paddingTop: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  greeting: { color: '#A0A0A0', fontSize: 12, letterSpacing: 1 },
  userName: { color: '#E34A29', fontSize: 24, fontWeight: '900' },
  card: { backgroundColor: '#151515', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#222', marginBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2A1512', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E34A29' },
  profileInfo: { marginLeft: 16 },
  profileName: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textTransform: 'capitalize' },
  badge: { backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' },
  badgeText: { color: '#4ADE80', fontSize: 10, fontWeight: 'bold' },
  subscriptionArea: { marginTop: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#222' },
  subTitle: { color: '#A0A0A0', fontSize: 12, marginBottom: 4 },
  subStatus: { color: '#FFF', fontSize: 14, fontStyle: 'italic' },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  actionGrid: { marginBottom: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151515', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  actionIconBg: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionText: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '600' },
});
