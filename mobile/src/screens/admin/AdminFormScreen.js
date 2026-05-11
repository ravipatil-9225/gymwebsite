import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import {
  ArrowLeft, Trash2, CheckCircle, Clock, X,
  MessageSquare, Phone, Mail, Calendar
} from 'lucide-react-native';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AdminFormScreen({ navigation, route }) {
  const { title, type } = route.params;
  const { refreshTrigger } = React.useContext(SocketContext);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchForms = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(`/admin/forms/${type}`);
      setForms(data);
    } catch (err) {
      if (!silent) Alert.alert('Error', 'Failed to load submissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type]);

  useEffect(() => { fetchForms(); }, [fetchForms, refreshTrigger]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchForms(true); }, [fetchForms]);

  const handleToggleStatus = async (form) => {
    try {
      const newStatus = form.status === 'resolved' ? 'pending' : 'resolved';
      await api.put(`/admin/forms/${form._id}`, { status: newStatus });
      fetchForms(true);
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Submission', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/forms/${id}`);
            fetchForms(true);
          } catch { Alert.alert('Error', 'Failed to delete.'); }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title.toUpperCase()}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E34A29" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />}
        >
          <Text style={styles.countText}>{forms.length} submission{forms.length !== 1 ? 's' : ''}</Text>

          {forms.map(form => (
            <View key={form._id} style={[styles.formCard, form.status === 'resolved' && styles.formCardResolved]}>
              {/* Header Row */}
              <View style={styles.formTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formName}>{form.name}</Text>
                  <View style={styles.formContactRow}>
                    <Mail color="#666" size={11} />
                    <Text style={styles.formContact}>{form.email}</Text>
                  </View>
                  {form.phone && (
                    <View style={styles.formContactRow}>
                      <Phone color="#666" size={11} />
                      <Text style={styles.formContact}>{form.phone}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Details */}
              {form.service && (
                <View style={styles.formDetail}>
                  <Text style={styles.formDetailLabel}>Service:</Text>
                  <Text style={styles.formDetailValue}>{form.service}</Text>
                </View>
              )}
              {form.date && (
                <View style={styles.formDetail}>
                  <Text style={styles.formDetailLabel}>Date:</Text>
                  <Text style={styles.formDetailValue}>{form.date}</Text>
                </View>
              )}
              {form.rating && (
                <View style={styles.formDetail}>
                  <Text style={styles.formDetailLabel}>Rating:</Text>
                  <Text style={styles.formDetailValue}>{'⭐'.repeat(form.rating)} ({form.rating}/5)</Text>
                </View>
              )}
              {form.message && (
                <View style={styles.messageBox}>
                  <Text style={styles.messageLabel}>Message:</Text>
                  <Text style={styles.messageText}>{form.message}</Text>
                </View>
              )}

              {/* Footer */}
              <View style={styles.formFooter}>
                <Text style={styles.formDate}>{fmt(form.createdAt)}</Text>
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.statusToggle, form.status === 'resolved' ? styles.statusResolved : styles.statusPending]}
                    onPress={() => handleToggleStatus(form)}
                  >
                    {form.status === 'resolved' ? <CheckCircle color="#22C55E" size={12} /> : <Clock color="#F59E0B" size={12} />}
                    <Text style={[styles.statusToggleText, form.status === 'resolved' ? styles.statusResolvedText : styles.statusPendingText]}>
                      {form.status === 'resolved' ? 'Resolved' : 'Pending'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteSmallBtn} onPress={() => handleDelete(form._id)}>
                    <Trash2 color="#EF4444" size={14} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {forms.length === 0 && (
            <View style={styles.emptyContainer}>
              <MessageSquare color="#333" size={48} />
              <Text style={styles.emptyText}>No submissions found</Text>
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
  headerTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.5, flex: 1, textAlign: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  countText: { color: '#666', fontSize: 11, marginBottom: 12, fontWeight: '600' },

  formCard: {
    backgroundColor: '#111', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 12,
  },
  formCardResolved: { borderColor: 'rgba(34,197,94,0.2)' },

  formTop: { marginBottom: 10 },
  formName: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  formContactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  formContact: { color: '#888', fontSize: 11 },

  formDetail: { flexDirection: 'row', marginBottom: 4 },
  formDetailLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginRight: 6 },
  formDetailValue: { color: '#CCC', fontSize: 12, flex: 1 },

  messageBox: {
    backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: '#222',
  },
  messageLabel: { color: '#888', fontSize: 10, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
  messageText: { color: '#CCC', fontSize: 12, lineHeight: 18 },

  formFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1F1F1F',
  },
  formDate: { color: '#555', fontSize: 10 },
  formActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  statusToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  statusResolved: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  statusPending: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' },
  statusToggleText: { fontSize: 10, fontWeight: '700' },
  statusResolvedText: { color: '#22C55E' },
  statusPendingText: { color: '#F59E0B' },

  deleteSmallBtn: { padding: 6 },

  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: '#666', fontSize: 13 },
});
