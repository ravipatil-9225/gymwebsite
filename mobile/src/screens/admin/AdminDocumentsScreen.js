import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import {
  ArrowLeft, CheckCircle, Clock, X,
  FileText, Phone, Mail, ChevronDown, ChevronUp, Trash2
} from 'lucide-react-native';
import api from '../../services/api';

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const FormSection = ({ title, type, forms, loading, onToggle, onDelete, refreshing, onRefresh }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.sectionHeader} 
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.sectionHeaderLeft}>
          <FileText color="#E34A29" size={18} />
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{forms.length}</Text>
          </View>
        </View>
        {expanded ? <ChevronUp color="#666" size={20} /> : <ChevronDown color="#666" size={20} />}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.sectionContent}>
          {loading ? (
            <ActivityIndicator size="small" color="#E34A29" style={{ marginVertical: 20 }} />
          ) : forms.length === 0 ? (
            <Text style={styles.emptyText}>No {title.toLowerCase()} found</Text>
          ) : (
            forms.map(form => (
              <View key={form._id} style={[styles.formCard, form.status === 'resolved' && styles.formCardResolved]}>
                <View style={styles.formTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formName}>{form.name}</Text>
                    <Text style={styles.formContact}>{form.email}</Text>
                    {form.phone && <Text style={styles.formContact}>{form.phone}</Text>}
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(form._id)}>
                    <Trash2 color="#EF4444" size={14} />
                  </TouchableOpacity>
                </View>

                {form.message && (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText}>{form.message}</Text>
                  </View>
                )}

                <View style={styles.formFooter}>
                  <Text style={styles.formDate}>{fmt(form.createdAt)}</Text>
                  <TouchableOpacity
                    style={[styles.statusToggle, form.status === 'resolved' ? styles.statusResolved : styles.statusPending]}
                    onPress={() => onToggle(form)}
                  >
                    {form.status === 'resolved' ? <CheckCircle color="#22C55E" size={12} /> : <Clock color="#F59E0B" size={12} />}
                    <Text style={[styles.statusToggleText, form.status === 'resolved' ? styles.statusResolvedText : styles.statusPendingText]}>
                      {form.status === 'resolved' ? 'Resolved' : 'Pending'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

export default function AdminDocumentsScreen({ navigation }) {
  const [data, setData] = useState({ 'par-q': [], 'trial-waiver': [], 'pt-contract': [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [parq, waiver, pt] = await Promise.all([
        api.get('/admin/forms/par-q'),
        api.get('/admin/forms/trial-waiver'),
        api.get('/admin/forms/pt-contract')
      ]);
      setData({
        'par-q': parq.data,
        'trial-waiver': waiver.data,
        'pt-contract': pt.data
      });
    } catch (err) {
      if (!silent) Alert.alert('Error', 'Failed to load documents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocs(true);
  }, [fetchDocs]);

  const handleToggleStatus = async (form) => {
    try {
      const newStatus = form.status === 'resolved' ? 'pending' : 'resolved';
      await api.put(`/admin/forms/${form._id}`, { status: newStatus });
      fetchDocs(true);
    } catch { Alert.alert('Error', 'Failed to update status.'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Submission', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await api.delete(`/admin/forms/${id}`); fetchDocs(true); }
          catch { Alert.alert('Error', 'Failed to delete.'); }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DOCUMENTS MANAGER</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />}
      >
        <FormSection 
          title="PAR-Q FORMS" 
          type="par-q" 
          forms={data['par-q']} 
          loading={loading} 
          onToggle={handleToggleStatus} 
          onDelete={handleDelete}
        />
        <FormSection 
          title="TRIAL WAIVERS" 
          type="trial-waiver" 
          forms={data['trial-waiver']} 
          loading={loading} 
          onToggle={handleToggleStatus} 
          onDelete={handleDelete}
        />
        <FormSection 
          title="PT CONTRACTS" 
          type="pt-contract" 
          forms={data['pt-contract']} 
          loading={loading} 
          onToggle={handleToggleStatus} 
          onDelete={handleDelete}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  scrollContent: { padding: 16 },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222',
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  countBadge: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { color: '#E34A29', fontSize: 10, fontWeight: '900' },

  sectionContent: { paddingTop: 12 },
  emptyText: { color: '#555', fontSize: 12, paddingVertical: 10, textAlign: 'center' },

  formCard: {
    backgroundColor: '#111', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 12,
  },
  formCardResolved: { borderColor: 'rgba(34,197,94,0.15)' },
  formTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  formName: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  formContact: { color: '#888', fontSize: 11, marginBottom: 2 },
  deleteBtn: { padding: 4 },

  messageBox: {
    backgroundColor: '#1A1A1A', borderRadius: 8, padding: 10, marginTop: 4,
    borderWidth: 1, borderColor: '#222',
  },
  messageText: { color: '#CCC', fontSize: 11, lineHeight: 16 },

  formFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1F1F1F',
  },
  formDate: { color: '#555', fontSize: 10 },
  statusToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  statusResolved: { backgroundColor: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' },
  statusPending: { backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' },
  statusToggleText: { fontSize: 10, fontWeight: '700' },
  statusResolvedText: { color: '#22C55E' },
  statusPendingText: { color: '#F59E0B' },
});
