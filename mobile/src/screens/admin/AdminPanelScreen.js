import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import {
  ArrowLeft, Users, PhoneCall, HandCoins, Activity,
  Package, Dumbbell, Tag, Image as ImageIcon,
  FileText, MessageSquare, BarChart3, ChevronRight, Shield, QrCode
} from 'lucide-react-native';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import api from '../../services/api';

export default function AdminPanelScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { refreshTrigger } = useContext(SocketContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/admin/analytics');
      setStats(data);
    } catch (err) {
      if (!silent) Alert.alert('Error', 'Failed to load dashboard data.');
      console.error('Admin analytics error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, refreshTrigger]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: <Users color="#4F8EF7" size={22} />, bg: '#1a2744', border: '#2a4070', color: '#4F8EF7' },
    { title: 'Active Members', value: stats?.activeMembers || 0, icon: <Activity color="#22C55E" size={22} />, bg: '#142e1d', border: '#1f5c33', color: '#22C55E' },
    { title: 'Enquiries', value: stats?.totalEnquiries || 0, icon: <PhoneCall color="#F59E0B" size={22} />, bg: '#2d2510', border: '#5c4e20', color: '#F59E0B' },
    { title: 'Pending Payments', value: stats?.pendingPayments || 0, icon: <HandCoins color="#EF4444" size={22} />, bg: '#2e1515', border: '#5c2020', color: '#EF4444' },
  ];

  const adminMenuSections = [
    {
      title: 'MANAGEMENT',
      items: [
        { title: 'User Management', subtitle: 'View, edit & manage all users', icon: <Users color="#4F8EF7" size={20} />, route: 'AdminUsers' },
        { title: 'Payments', subtitle: 'Verify & manage payments', icon: <HandCoins color="#22C55E" size={20} />, route: 'AdminPayments' },
        { title: 'Summary Dashboard', subtitle: 'Monthly analytics & reports', icon: <BarChart3 color="#A855F7" size={20} />, route: 'AdminSummary' },
        { title: 'Attendance Scanner', subtitle: 'Scan member QR codes', icon: <QrCode color="#06B6D4" size={20} />, route: 'AttendanceScanner' },
      ]
    },
    {
      title: 'CONTENT',
      items: [
        { title: 'Packages', subtitle: 'Manage membership plans', icon: <Package color="#F59E0B" size={20} />, route: 'AdminPackages' },
        { title: 'Trainers', subtitle: 'Manage trainer profiles', icon: <Dumbbell color="#E34A29" size={20} />, route: 'AdminTrainers' },
        { title: 'Offers', subtitle: 'Manage promotional offers', icon: <Tag color="#EC4899" size={20} />, route: 'AdminOffers' },
        { title: 'Gallery', subtitle: 'Manage gym photos', icon: <ImageIcon color="#06B6D4" size={20} />, route: 'AdminGallery' },
        { title: 'CMS Manager', subtitle: 'Edit website & app content', icon: <FileText color="#A855F7" size={20} />, route: 'AdminCMS' },
      ]
    },
    {
      title: 'FORM SUBMISSIONS',
      items: [
        { title: 'Enquiries', subtitle: 'Enquiries & join requests', icon: <PhoneCall color="#F59E0B" size={20} />, route: 'AdminEnquiries' },
        { title: 'Class Bookings', subtitle: 'Group class bookings', icon: <Activity color="#22C55E" size={20} />, route: 'AdminClassBookings' },
        { title: 'PT Sessions', subtitle: 'Personal training bookings', icon: <Dumbbell color="#E34A29" size={20} />, route: 'AdminPTSessions' },
        { title: 'Feedback', subtitle: 'Member feedback submissions', icon: <MessageSquare color="#A855F7" size={20} />, route: 'AdminFeedback' },
        { title: 'Documents', subtitle: 'PAR-Q, Waivers, PT Contracts', icon: <FileText color="#06B6D4" size={20} />, route: 'AdminDocuments' },
      ]
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Shield color="#E34A29" size={20} />
          <Text style={styles.headerTitle}>ADMIN </Text>
          <Text style={styles.headerTitleAccent}>PANEL</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E34A29" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />
          }
        >
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeName}>Hello, {user?.name?.split(' ')[0] || 'Admin'} 👋</Text>
            <Text style={styles.welcomeDesc}>Here's your gym overview for today</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {[
              { title: 'Total Users', value: stats?.totalUsers || 0, icon: <Users color="#4F8EF7" size={22} />, bg: '#1a2744', border: '#2a4070', color: '#4F8EF7', route: 'AdminUsers' },
              { title: 'Active Members', value: stats?.activeMembers || 0, icon: <Activity color="#22C55E" size={22} />, bg: '#142e1d', border: '#1f5c33', color: '#22C55E', route: 'AdminUsers', params: { initialFilter: 'active' } },
              { title: 'Enquiries', value: stats?.totalEnquiries || 0, icon: <PhoneCall color="#F59E0B" size={22} />, bg: '#2d2510', border: '#5c4e20', color: '#F59E0B', route: 'AdminEnquiries' },
              { title: 'Pending Payments', value: stats?.pendingPayments || 0, icon: <HandCoins color="#EF4444" size={22} />, bg: '#2e1515', border: '#5c2020', color: '#EF4444', route: 'AdminPayments', params: { initialFilter: 'pending' } },
            ].map((card, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.statCard, { backgroundColor: card.bg, borderColor: card.border }]}
                onPress={() => navigation.navigate(card.route, card.params)}
              >
                <View style={styles.statCardTop}>
                  {card.icon}
                </View>
                <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                <Text style={styles.statLabel}>{card.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Menu Sections */}
          {adminMenuSections.map((section, si) => (
            <View key={si} style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, ii) => (
                  <TouchableOpacity
                    key={ii}
                    style={[styles.menuItem, ii < section.items.length - 1 && styles.menuItemBorder]}
                    onPress={() => navigation.navigate(item.route)}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIconBg}>{item.icon}</View>
                      <View>
                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <ChevronRight color="#555" size={18} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Recent Activity */}
          {stats?.recentActivities?.length > 0 && (
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>RECENT ACTIVITY</Text>
              <View style={styles.menuCard}>
                {stats.recentActivities.slice(0, 5).map((act, i) => (
                  <View key={i} style={[styles.activityItem, i < 4 && styles.menuItemBorder]}>
                    <View style={styles.activityDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityName}>{act.name}</Text>
                      <Text style={styles.activityType}>{act.type}</Text>
                    </View>
                    <Text style={styles.activityDate}>
                      {new Date(act.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 56, backgroundColor: '#111',
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
  headerTitleAccent: { color: '#E34A29', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#888', fontSize: 14 },

  scrollContent: { padding: 16, paddingTop: 20 },

  welcomeCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 16,
  },
  welcomeName: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  welcomeDesc: { color: '#888', fontSize: 13 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16,
  },
  statCard: {
    width: '48%', flexGrow: 1, borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  statCardTop: { marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '900', marginBottom: 2 },
  statLabel: { color: '#999', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },

  menuSection: { marginBottom: 16 },
  menuSectionTitle: {
    color: '#888', fontSize: 11, fontWeight: '900', letterSpacing: 1.5,
    marginBottom: 10, marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#111', borderRadius: 16, borderWidth: 1,
    borderColor: '#1F1F1F', overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#1F1F1F' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  menuIconBg: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
  },
  menuItemTitle: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  menuItemSubtitle: { color: '#777', fontSize: 11 },

  activityItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  activityDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#E34A29',
  },
  activityName: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  activityType: { color: '#888', fontSize: 11, textTransform: 'capitalize', marginTop: 1 },
  activityDate: { color: '#666', fontSize: 11, fontWeight: '500' },
});
