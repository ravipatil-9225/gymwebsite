import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import {
  ArrowLeft, Users, TrendingUp, Clock, Calendar
} from 'lucide-react-native';
import api from '../../services/api';

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function AdminSummaryScreen({ navigation }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: res } = await api.get(`/admin/summary?month=${month}&year=${year}`);
      setData(res);
    } catch (err) {
      console.error('Summary fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, year]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchSummary(true); }, [fetchSummary]);

  const goToCurrentMonth = () => {
    const d = new Date();
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const summaryCards = [
    { title: 'New Members', value: data?.newMembersCount || 0, icon: <Users color="#4F8EF7" size={20} />, bg: '#1a2744', border: '#2a4070', color: '#4F8EF7' },
    { title: 'Subscriptions', value: data?.subscriptionsCount || 0, icon: <TrendingUp color="#22C55E" size={20} />, bg: '#142e1d', border: '#1f5c33', color: '#22C55E' },
    { title: 'Expirations', value: data?.expirationsCount || 0, icon: <Clock color="#EF4444" size={20} />, bg: '#2e1515', border: '#5c2020', color: '#EF4444' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SUMMARY</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToCurrentMonth}>
          <Text style={styles.monthText}>{MONTHS[month - 1]} {year}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E34A29" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />}
        >
          {/* Stats Cards */}
          <View style={styles.statsRow}>
            {summaryCards.map((card, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: card.bg, borderColor: card.border }]}>
                {card.icon}
                <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                <Text style={styles.statLabel}>{card.title}</Text>
              </View>
            ))}
          </View>

          {/* New Members List */}
          {data?.newMembers?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NEW MEMBERS</Text>
              <View style={styles.listCard}>
                {data.newMembers.map((m, i) => (
                  <View key={m._id} style={[styles.listItem, i < data.newMembers.length - 1 && styles.listItemBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listName}>{m.name}</Text>
                      <Text style={styles.listSub}>{m.email}</Text>
                    </View>
                    <Text style={styles.listDate}>{fmt(m.createdAt)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Subscriptions */}
          {data?.subscriptions?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PLAN SUBSCRIPTIONS</Text>
              <View style={styles.listCard}>
                {data.subscriptions.map((s, i) => (
                  <View key={s._id} style={[styles.listItem, i < data.subscriptions.length - 1 && styles.listItemBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listName}>{s.userName}</Text>
                      <Text style={styles.listSub}>{s.packageName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.listAmount}>₹{s.amountPaid || 0}</Text>
                      <Text style={styles.listDate}>{fmt(s.startDate)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Expirations */}
          {data?.expirations?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PLAN EXPIRATIONS</Text>
              <View style={styles.listCard}>
                {data.expirations.map((e, i) => {
                  const diffDays = Math.ceil((new Date(e.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <View key={e._id} style={[styles.listItem, i < data.expirations.length - 1 && styles.listItemBorder]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listName}>{e.userName}</Text>
                        <Text style={styles.listSub}>{e.packageName}</Text>
                      </View>
                      <View style={[styles.daysBadge, diffDays < 0 ? styles.daysBadgeExpired : diffDays <= 7 ? styles.daysBadgeWarn : styles.daysBadgeOk]}>
                        <Text style={[styles.daysBadgeText, diffDays < 0 ? styles.daysBadgeExpiredText : diffDays <= 7 ? styles.daysBadgeWarnText : styles.daysBadgeOkText]}>
                          {diffDays < 0 ? 'Expired' : `${diffDays}d left`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {(!data?.newMembers?.length && !data?.subscriptions?.length && !data?.expirations?.length) && (
            <View style={styles.emptyContainer}>
              <Calendar color="#333" size={48} />
              <Text style={styles.emptyText}>No data for {MONTHS[month - 1]} {year}</Text>
            </View>
          )}

          <View style={{ height: 30 }} />
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
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },

  monthSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, backgroundColor: '#0A0A0A', gap: 20,
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  monthArrow: { padding: 8 },
  monthArrowText: { color: '#E34A29', fontSize: 28, fontWeight: '300' },
  monthText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '900', marginTop: 8, marginBottom: 2 },
  statLabel: { color: '#999', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  section: { marginBottom: 16 },
  sectionTitle: { color: '#888', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  listCard: {
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1F1F1F', overflow: 'hidden',
  },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  listItemBorder: { borderBottomWidth: 1, borderBottomColor: '#1F1F1F' },
  listName: { color: '#FFF', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  listSub: { color: '#888', fontSize: 11 },
  listDate: { color: '#666', fontSize: 10 },
  listAmount: { color: '#E34A29', fontSize: 13, fontWeight: '700', marginBottom: 2 },

  daysBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  daysBadgeExpired: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  daysBadgeWarn: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' },
  daysBadgeOk: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  daysBadgeText: { fontSize: 10, fontWeight: '700' },
  daysBadgeExpiredText: { color: '#EF4444' },
  daysBadgeWarnText: { color: '#F59E0B' },
  daysBadgeOkText: { color: '#22C55E' },

  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: '#666', fontSize: 13 },
});
