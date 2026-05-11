import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, Image
} from 'react-native';
import {
  ArrowLeft, HandCoins, CheckCircle, XCircle, Clock,
  X, AlertCircle, CreditCard, Banknote, Trash2, Eye
} from 'lucide-react-native';
import { SocketContext } from '../../context/SocketContext';
import api from '../../services/api';

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusColors = {
  pending: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#F59E0B', label: 'Pending' },
  cash_pending: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#F59E0B', label: 'Cash Pending' },
  auto_verified: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22C55E', label: 'Auto Verified' },
  manually_verified: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22C55E', label: 'Verified' },
  cash_collected: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22C55E', label: 'Cash Collected' },
  failed_verification: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#EF4444', label: 'Failed' },
  overdue: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#EF4444', label: 'Overdue' },
};

export default function AdminPaymentsScreen({ navigation, route }) {
  const { refreshTrigger } = React.useContext(SocketContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(route.params?.initialFilter || 'all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/admin/payments');
      setPayments(data);
    } catch (err) {
      if (!silent) Alert.alert('Error', 'Failed to load payments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, refreshTrigger]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchPayments(true); }, [fetchPayments]);

  const getFiltered = () => {
    if (filter === 'all') return payments;
    if (filter === 'pending') return payments.filter(p => ['pending', 'cash_pending'].includes(p.verificationStatus));
    if (filter === 'verified') return payments.filter(p => ['auto_verified', 'manually_verified', 'cash_collected'].includes(p.verificationStatus));
    if (filter === 'failed') return payments.filter(p => ['failed_verification', 'overdue'].includes(p.verificationStatus));
    return payments;
  };

  const handleVerify = async (id, status) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/payments/${id}`, { verificationStatus: status });
      setSelectedPayment(null);
      fetchPayments(true);
      Alert.alert('Success', 'Payment updated successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Payment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/payments/${id}`);
            fetchPayments(true);
          } catch { Alert.alert('Error', 'Failed to delete.'); }
        }
      }
    ]);
  };

  const filtered = getFiltered();
  const pendingCount = payments.filter(p => ['pending', 'cash_pending'].includes(p.verificationStatus)).length;

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: `Pending (${pendingCount})` },
    { key: 'verified', label: 'Verified' },
    { key: 'failed', label: 'Failed' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PAYMENTS</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E34A29" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />}
        >
          {filtered.map(p => {
            const sc = statusColors[p.verificationStatus] || statusColors.pending;
            const isCash = p.paymentMethod === 'cash_on_bench';

            return (
              <TouchableOpacity key={p._id} style={styles.paymentCard} onPress={() => setSelectedPayment(p)}>
                <View style={styles.paymentTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentUser} numberOfLines={1}>{p.userName || p.email}</Text>
                    <Text style={styles.paymentPlan} numberOfLines={1}>{p.planName}</Text>
                  </View>
                  <View>
                    <Text style={styles.paymentAmount}>₹{(p.finalAmount || p.planPrice || 0).toLocaleString('en-IN')}</Text>
                    {p.discount > 0 && (
                      <Text style={styles.paymentDiscount}>
                        -{p.discountType === 'percentage' ? `${p.discount}%` : `₹${p.discount}`}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.paymentBottom}>
                  <View style={styles.paymentMeta}>
                    {isCash ? <Banknote color="#F59E0B" size={12} /> : <CreditCard color="#4F8EF7" size={12} />}
                    <Text style={styles.paymentMethodText}>{isCash ? 'Cash' : 'UPI'}</Text>
                    <Text style={styles.paymentDate}>{fmt(p.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.emptyContainer}>
              <HandCoins color="#333" size={48} />
              <Text style={styles.emptyText}>No payments found</Text>
            </View>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Payment Detail Modal */}
      <Modal visible={!!selectedPayment} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Details</Text>
              <TouchableOpacity onPress={() => setSelectedPayment(null)}>
                <X color="#FFF" size={20} />
              </TouchableOpacity>
            </View>

            {selectedPayment && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.detailSection}>
                  {[
                    { label: 'Member', value: selectedPayment.userName || selectedPayment.email },
                    { label: 'Email', value: selectedPayment.email },
                    { label: 'Plan', value: selectedPayment.planName },
                    { label: 'Amount', value: `₹${(selectedPayment.finalAmount || selectedPayment.planPrice || 0).toLocaleString('en-IN')}` },
                    { label: 'Original Price', value: `₹${(selectedPayment.originalAmount || selectedPayment.planPrice || 0).toLocaleString('en-IN')}` },
                    { label: 'Method', value: selectedPayment.paymentMethod === 'cash_on_bench' ? 'Cash on Bench' : 'UPI / Online' },
                    { label: 'UTR / Ref', value: selectedPayment.utrNumber || '—' },
                    { label: 'Submitted', value: fmt(selectedPayment.createdAt) },
                    { label: 'Status', value: (statusColors[selectedPayment.verificationStatus] || statusColors.pending).label },
                  ].map((d, i) => (
                    <View key={i} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{d.label}</Text>
                      <Text style={styles.detailValue}>{d.value}</Text>
                    </View>
                  ))}
                </View>

                {selectedPayment.screenshot?.url && (
                  <View style={styles.screenshotSection}>
                    <Text style={styles.screenshotLabel}>Payment Screenshot</Text>
                    <Image source={{ uri: selectedPayment.screenshot.url }} style={styles.screenshot} resizeMode="contain" />
                  </View>
                )}

                {/* Actions */}
                {!['auto_verified', 'manually_verified', 'cash_collected'].includes(selectedPayment.verificationStatus) && (
                  <View style={styles.actionSection}>
                    <Text style={styles.actionTitle}>Quick Actions</Text>
                    <TouchableOpacity
                      style={[styles.verifyBtn, { backgroundColor: '#22C55E' }]}
                      onPress={() => handleVerify(selectedPayment._id,
                        selectedPayment.paymentMethod === 'cash_on_bench' ? 'cash_collected' : 'manually_verified'
                      )}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                        <>
                          <CheckCircle color="#FFF" size={16} />
                          <Text style={styles.verifyBtnText}>
                            {selectedPayment.paymentMethod === 'cash_on_bench' ? 'Mark Cash Collected' : 'Verify Payment'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.verifyBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleVerify(selectedPayment._id, 'failed_verification')}
                      disabled={actionLoading}
                    >
                      <XCircle color="#FFF" size={16} />
                      <Text style={styles.verifyBtnText}>Mark as Failed</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => { setSelectedPayment(null); handleDelete(selectedPayment._id); }}
                >
                  <Trash2 color="#EF4444" size={16} />
                  <Text style={styles.deleteBtnText}>Delete Payment</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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

  filterWrapper: {
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  filterBar: { 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    gap: 10,
    alignItems: 'center'
  },
  filterTab: {
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 20,
    backgroundColor: '#1A1A1A', 
    borderWidth: 1, 
    borderColor: '#333',
  },
  filterTabActive: { 
    backgroundColor: '#E34A29', 
    borderColor: '#E34A29',
    shadowColor: '#E34A29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  filterTabText: { color: '#888', fontSize: 13, fontWeight: '700' },
  filterTabTextActive: { color: '#FFF' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },

  paymentCard: {
    backgroundColor: '#111', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 10,
  },
  paymentTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  paymentUser: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  paymentPlan: { color: '#888', fontSize: 12 },
  paymentAmount: { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'right' },
  paymentDiscount: { color: '#22C55E', fontSize: 10, fontWeight: '600', textAlign: 'right' },
  paymentBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentMethodText: { color: '#888', fontSize: 11, fontWeight: '500' },
  paymentDate: { color: '#666', fontSize: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: '#666', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', borderWidth: 1, borderColor: '#222',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#222',
  },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  modalScroll: { padding: 20 },

  detailSection: { marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  detailLabel: { color: '#888', fontSize: 12 },
  detailValue: { color: '#FFF', fontSize: 12, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  screenshotSection: { marginBottom: 20 },
  screenshotLabel: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  screenshot: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#1A1A1A' },

  actionSection: { marginBottom: 20, gap: 10 },
  actionTitle: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
  },
  verifyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)',
    marginBottom: 30,
  },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
});
