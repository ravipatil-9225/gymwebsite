import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Image
} from 'react-native';
import {
  User, Calendar, Activity, ChevronRight, LogOut, Clock,
  TrendingUp, AlertCircle, CheckCircle, Dumbbell, Zap,
  FileText, Phone, MessageSquare, Shield
} from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const getDaysLeft = (endDate) => {
  if (!endDate) return null;
  const diff = new Date(endDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { refreshTrigger } = useContext(SocketContext);

  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [subRes, payRes] = await Promise.allSettled([
        api.get('/subscription/'),
        api.get('/payments/my-payments'),
      ]);
      if (subRes.status === 'fulfilled') setSubscription(subRes.value.data);
      else setSubscription(null);
      if (payRes.status === 'fulfilled') setPayments(payRes.value.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(false); }, [fetchData, refreshTrigger]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  const isExpired = subscription?.status === 'expired';
  const daysLeft = getDaysLeft(subscription?.endDate);
  const overduePayment = payments.find(p => p.verificationStatus === 'overdue');
  const recentPayments = payments.slice(0, 3);

  const quickActions = [
    {
      title: 'Book a Class',
      subtitle: 'Reserve your spot',
      icon: <Calendar color="#E34A29" size={22} />,
      route: 'BookGroupClass',
      bg: 'rgba(227,74,41,0.08)',
      border: 'rgba(227,74,41,0.2)',
    },
    {
      title: 'Book PT Session',
      subtitle: '1-on-1 with a trainer',
      icon: <Dumbbell color="#4299e1" size={22} />,
      route: 'BookPTSession',
      bg: 'rgba(66,153,225,0.08)',
      border: 'rgba(66,153,225,0.2)',
    },
    {
      title: 'View Packages',
      subtitle: 'Upgrade membership',
      icon: <TrendingUp color="#a78bfa" size={22} />,
      route: null,
      tab: 'Package',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.2)',
    },
    {
      title: 'PAR-Q Form',
      subtitle: 'Health questionnaire',
      icon: <FileText color="#ed8936" size={22} />,
      route: 'ParQForm',
      bg: 'rgba(237,137,54,0.08)',
      border: 'rgba(237,137,54,0.2)',
    },
    {
      title: 'Enquiry',
      subtitle: 'Have a question?',
      icon: <Phone color="#38b2ac" size={22} />,
      route: 'Enquiry',
      bg: 'rgba(56,178,172,0.08)',
      border: 'rgba(56,178,172,0.2)',
    },
    {
      title: 'Give Feedback',
      subtitle: 'Share your experience',
      icon: <MessageSquare color="#68d391" size={22} />,
      route: 'Feedback',
      bg: 'rgba(104,211,145,0.08)',
      border: 'rgba(104,211,145,0.2)',
    },
  ];

  const handleNavigate = (action) => {
    if (action.route) {
      navigation.navigate(action.route);
    } else if (action.tab) {
      navigation.navigate('MainTabs', { screen: action.tab });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#E34A29" />
        <Text style={styles.loadingText}>Loading your portal...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />
      }
    >
      {/* ═══ HEADER ═══ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>WELCOME BACK</Text>
          <Text style={styles.userName}>{user?.name?.toUpperCase() || 'MEMBER'}</Text>
        </View>
        <View style={styles.avatarCircle}>
          {user?.profileImage?.url ? (
            <Image source={{ uri: user.profileImage.url }} style={styles.avatarImg} />
          ) : (
            <User color="#E34A29" size={28} />
          )}
        </View>
      </View>

      {/* ═══ OVERDUE ALERT ═══ */}
      {overduePayment && (
        <View style={styles.overdueAlert}>
          <AlertCircle color="#EF4444" size={18} />
          <View style={{ flex: 1 }}>
            <Text style={styles.overdueTitle}>Payment Overdue</Text>
            <Text style={styles.overdueDesc}>
              Your {overduePayment.planName} plan payment is overdue. Please renew to continue access.
            </Text>
          </View>
        </View>
      )}

      {/* ═══ SUBSCRIPTION CARD ═══ */}
      <View style={[styles.subCard, isExpired && styles.subCardExpired]}>
        <View style={styles.subCardHeader}>
          <View style={styles.subIconBg}>
            <Zap color="#E34A29" size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.subCardLabel}>MEMBERSHIP STATUS</Text>
            <Text style={styles.subCardPlan}>
              {subscription ? subscription.planName : 'No Active Plan'}
            </Text>
          </View>
          {subscription && (
            <View style={[styles.statusBadge, isExpired ? styles.statusExpired : styles.statusActive]}>
              {isExpired
                ? <AlertCircle color="#EF4444" size={11} />
                : <CheckCircle color="#22C55E" size={11} />}
              <Text style={[styles.statusText, isExpired ? styles.statusTextExpired : styles.statusTextActive]}>
                {isExpired ? 'EXPIRED' : 'ACTIVE'}
              </Text>
            </View>
          )}
        </View>

        {subscription ? (
          <View style={styles.subDetails}>
            <View style={styles.subRow}>
              <Text style={styles.subLabel}>Renewal Date</Text>
              <View style={styles.subValueRow}>
                <Clock color={isExpired ? '#EF4444' : '#A0A0A0'} size={14} />
                <Text style={[styles.subValue, isExpired && styles.subValueExpired]}>
                  {formatDate(subscription.endDate)}
                </Text>
              </View>
            </View>
            {daysLeft !== null && !isExpired && (
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>Days Remaining</Text>
                <Text style={[styles.subValue, daysLeft <= 7 && styles.subValueWarning]}>
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                  {daysLeft <= 7 && ' ⚠️'}
                </Text>
              </View>
            )}
            {isExpired && (
              <TouchableOpacity
                style={styles.renewBtn}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Package' })}
              >
                <TrendingUp color="#FFF" size={16} />
                <Text style={styles.renewBtnText}>RENEW MEMBERSHIP</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.renewBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Package' })}
          >
            <TrendingUp color="#FFF" size={16} />
            <Text style={styles.renewBtnText}>VIEW PLANS & JOIN</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ═══ QUICK ACTIONS ═══ */}
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.actionCard, { backgroundColor: action.bg, borderColor: action.border }]}
            onPress={() => handleNavigate(action)}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>{action.icon}</View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ═══ RECENT PAYMENTS ═══ */}
      {recentPayments.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>RECENT PAYMENTS</Text>
          <View style={styles.paymentsCard}>
            {recentPayments.map((pay, i) => {
              const isVerified = pay.verificationStatus === 'verified';
              const isPending = pay.verificationStatus === 'pending';
              const isOverdue = pay.verificationStatus === 'overdue';
              return (
                <View
                  key={pay._id || i}
                  style={[styles.paymentRow, i < recentPayments.length - 1 && styles.paymentRowBorder]}
                >
                  <View style={styles.paymentLeft}>
                    <View style={[
                      styles.payDot,
                      isVerified && styles.payDotGreen,
                      isPending && styles.payDotYellow,
                      isOverdue && styles.payDotRed,
                    ]} />
                    <View>
                      <Text style={styles.payPlan}>{pay.planName}</Text>
                      <Text style={styles.payDate}>{formatDate(pay.createdAt || pay.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.paymentRight}>
                    {pay.amount ? (
                      <Text style={styles.payAmount}>₹{pay.amount}</Text>
                    ) : null}
                    <View style={[
                      styles.payStatusBadge,
                      isVerified && { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
                      isPending && { backgroundColor: 'rgba(250,204,21,0.1)', borderColor: 'rgba(250,204,21,0.3)' },
                      isOverdue && { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
                    ]}>
                      <Text style={[
                        styles.payStatusText,
                        isVerified && { color: '#22C55E' },
                        isPending && { color: '#FACC15' },
                        isOverdue && { color: '#EF4444' },
                      ]}>
                        {(pay.verificationStatus || 'unknown').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* ═══ ADMIN SHORTCUT ═══ */}
      {user?.role === 'admin' && (
        <>
          <Text style={styles.sectionTitle}>ADMIN</Text>
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => navigation.navigate('AdminPanel')}
          >
            <View style={styles.adminLeft}>
              <Shield color="#A855F7" size={22} />
              <View>
                <Text style={styles.adminTitle}>Admin Management</Text>
                <Text style={styles.adminSub}>Users, Payments, Content & Reports</Text>
              </View>
            </View>
            <ChevronRight color="#A855F7" size={20} />
          </TouchableOpacity>
        </>
      )}

      {/* ═══ ACCOUNT SETTINGS SHORTCUT ═══ */}
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => navigation.navigate('Settings')}
      >
        <User color="#E34A29" size={18} />
        <Text style={styles.settingsBtnText}>View Full Profile & Settings</Text>
        <ChevronRight color="#666" size={18} />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 13, letterSpacing: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { color: '#555', fontSize: 10, letterSpacing: 2, fontWeight: 'bold', marginBottom: 4 },
  userName: { color: '#E34A29', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(227,74,41,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(227,74,41,0.4)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },

  // ── Overdue Alert ──
  overdueAlert: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 14, padding: 14, marginBottom: 16,
  },
  overdueTitle: { color: '#EF4444', fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  overdueDesc: { color: '#EF4444', fontSize: 11, opacity: 0.8, lineHeight: 16 },

  // ── Subscription Card ──
  subCard: {
    backgroundColor: '#111', borderRadius: 20, borderWidth: 1, borderColor: '#1F1F1F',
    padding: 20, marginBottom: 24,
  },
  subCardExpired: { borderColor: 'rgba(239,68,68,0.25)' },
  subCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  subIconBg: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(227,74,41,0.1)', borderWidth: 1, borderColor: 'rgba(227,74,41,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  subCardLabel: { color: '#555', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 3 },
  subCardPlan: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  statusActive: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  statusExpired: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  statusText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  statusTextActive: { color: '#22C55E' },
  statusTextExpired: { color: '#EF4444' },

  subDetails: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 14 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subLabel: { color: '#666', fontSize: 12 },
  subValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subValue: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  subValueExpired: { color: '#EF4444' },
  subValueWarning: { color: '#F59E0B' },

  renewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#E34A29', borderRadius: 12, paddingVertical: 13, marginTop: 8,
    shadowColor: '#E34A29', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  renewBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },

  // ── Section Title ──
  sectionTitle: {
    color: '#555', fontSize: 10, fontWeight: '900', letterSpacing: 2,
    marginBottom: 12, marginLeft: 2,
  },

  // ── Quick Actions Grid ──
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: {
    width: '31%', flexGrow: 1,
    borderWidth: 1, borderRadius: 16, padding: 14,
    alignItems: 'flex-start',
  },
  actionIcon: { marginBottom: 10 },
  actionTitle: { color: '#FFF', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  actionSubtitle: { color: '#666', fontSize: 10, lineHeight: 14 },

  // ── Recent Payments ──
  paymentsCard: {
    backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 24,
    overflow: 'hidden',
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  paymentRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  payDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#555' },
  payDotGreen: { backgroundColor: '#22C55E' },
  payDotYellow: { backgroundColor: '#FACC15' },
  payDotRed: { backgroundColor: '#EF4444' },
  payPlan: { color: '#FFF', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  payDate: { color: '#555', fontSize: 11 },
  paymentRight: { alignItems: 'flex-end', gap: 4 },
  payAmount: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  payStatusBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  payStatusText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },

  // ── Admin Card ──
  adminCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(168,85,247,0.06)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)',
    borderRadius: 16, padding: 16, marginBottom: 24,
  },
  adminLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  adminTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  adminSub: { color: '#888', fontSize: 11 },

  // ── Settings Shortcut ──
  settingsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1F1F1F',
    borderRadius: 14, padding: 16, marginBottom: 10,
  },
  settingsBtnText: { flex: 1, color: '#CCC', fontSize: 14, fontWeight: '500' },
});
