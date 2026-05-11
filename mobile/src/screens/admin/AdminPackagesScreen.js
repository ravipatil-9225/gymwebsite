import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput
} from 'react-native';
import {
  ArrowLeft, Package, Trash2, Edit, Plus, X, Save, Tag, DollarSign
} from 'lucide-react-native';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';

export default function AdminPackagesScreen({ navigation }) {
  const { refreshTrigger } = React.useContext(SocketContext);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchPackages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/admin/packages');
      setPackages(data);
    } catch (err) {
      if (!silent) Alert.alert('Error', 'Failed to load packages.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages, refreshTrigger]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchPackages(true); }, [fetchPackages]);

  const handleSave = async () => {
    if (!editPkg) return;
    if (!editPkg.name || !editPkg.price || !editPkg.duration) {
      Alert.alert('Validation Error', 'Name, Price, and Duration are required.');
      return;
    }
    setEditLoading(true);
    try {
      if (editPkg._id) {
        const { _id, ...pkgData } = editPkg;
        await api.put(`/admin/packages/${editPkg._id}`, pkgData);
      } else {
        await api.post('/admin/packages', editPkg);
      }
      setEditPkg(null);
      fetchPackages(true);
    } catch { Alert.alert('Error', 'Failed to save.'); }
    finally { setEditLoading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Package', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/admin/packages/${id}`); fetchPackages(true); }
        catch { Alert.alert('Error', 'Failed to delete.'); }
      }}
    ]);
  };

  const handleToggleActive = async (pkg) => {
    try {
      await api.put(`/admin/packages/${pkg._id}`, { isActive: !pkg.isActive });
      fetchPackages(true);
    } catch { Alert.alert('Error', 'Failed to update.'); }
  };

  // Group by category
  const grouped = packages.reduce((acc, p) => {
    const cat = p.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PACKAGES</Text>
        <TouchableOpacity onPress={() => setEditPkg({ name: '', category: '', description: '', price: '', duration: '', features: [], isActive: true })}>
          <Plus color="#E34A29" size={24} />
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
          {Object.entries(grouped).map(([category, pkgs]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{category}</Text>
              {pkgs.map(pkg => (
                <View key={pkg._id} style={[styles.pkgCard, !pkg.isActive && styles.pkgCardInactive]}>
                  <View style={styles.pkgTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pkgName}>{pkg.name}</Text>
                      <Text style={styles.pkgDuration}>{pkg.duration}</Text>
                    </View>
                    <Text style={styles.pkgPrice}>₹{pkg.price?.toLocaleString('en-IN')}</Text>
                  </View>
                  {pkg.description && <Text style={styles.pkgDesc} numberOfLines={2}>{pkg.description}</Text>}
                  {pkg.features?.length > 0 && (
                    <View style={styles.featuresList}>
                      {pkg.features.slice(0, 3).map((f, i) => (
                        <Text key={i} style={styles.featureItem}>• {f}</Text>
                      ))}
                      {pkg.features.length > 3 && <Text style={styles.featureMore}>+{pkg.features.length - 3} more</Text>}
                    </View>
                  )}
                  <View style={styles.pkgActions}>
                    <TouchableOpacity
                      style={[styles.activeToggle, pkg.isActive ? styles.activeOn : styles.activeOff]}
                      onPress={() => handleToggleActive(pkg)}
                    >
                      <Text style={[styles.activeToggleText, pkg.isActive ? styles.activeOnText : styles.activeOffText]}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => setEditPkg({ ...pkg, features: pkg.features || [] })}>
                        <Edit color="#4F8EF7" size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(pkg._id)}>
                        <Trash2 color="#EF4444" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}
          {packages.length === 0 && (
            <View style={styles.emptyContainer}>
              <Package color="#333" size={48} />
              <Text style={styles.emptyText}>No packages found</Text>
            </View>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Edit/Create Modal */}
      <Modal visible={!!editPkg} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editPkg?._id ? 'Edit Package' : 'New Package'}</Text>
              <TouchableOpacity onPress={() => setEditPkg(null)}><X color="#FFF" size={20} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {editPkg && ['name', 'category', 'description', 'duration'].map(key => (
                <View key={key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editPkg[key] || ''}
                    onChangeText={v => setEditPkg(p => ({ ...p, [key]: v }))}
                    placeholderTextColor="#555"
                    placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                    multiline={key === 'description'}
                  />
                </View>
              ))}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Price (₹)</Text>
                <TextInput
                  style={styles.formInput}
                  value={String(editPkg?.price || '')}
                  onChangeText={v => setEditPkg(p => ({ ...p, price: Number(v) || 0 }))}
                  keyboardType="numeric"
                  placeholderTextColor="#555"
                  placeholder="Price"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Features (comma separated)</Text>
                <TextInput
                  style={[styles.formInput, { minHeight: 60 }]}
                  value={(editPkg?.features || []).join(', ')}
                  onChangeText={v => setEditPkg(p => ({ ...p, features: v.split(',').map(f => f.trim()).filter(Boolean) }))}
                  placeholderTextColor="#555"
                  placeholder="Feature 1, Feature 2..."
                  multiline
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditPkg(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={editLoading}>
                {editLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <><Save color="#FFF" size={15} /><Text style={styles.saveBtnText}>Save</Text></>
                )}
              </TouchableOpacity>
            </View>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { color: '#E34A29', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  pkgCard: {
    backgroundColor: '#111', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 10,
  },
  pkgCardInactive: { opacity: 0.5 },
  pkgTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  pkgName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  pkgDuration: { color: '#888', fontSize: 11, marginTop: 2 },
  pkgPrice: { color: '#E34A29', fontSize: 18, fontWeight: '900' },
  pkgDesc: { color: '#888', fontSize: 11, marginBottom: 8, lineHeight: 16 },
  featuresList: { marginBottom: 8 },
  featureItem: { color: '#AAA', fontSize: 11, marginBottom: 2 },
  featureMore: { color: '#666', fontSize: 10, fontStyle: 'italic' },
  pkgActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1F1F1F', paddingTop: 10 },
  activeToggle: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  activeOn: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  activeOff: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  activeToggleText: { fontSize: 10, fontWeight: '700' },
  activeOnText: { color: '#22C55E' },
  activeOffText: { color: '#EF4444' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: '#666', fontSize: 13 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', borderWidth: 1, borderColor: '#222' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  modalScroll: { padding: 20, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: '#222' },
  formGroup: { marginBottom: 14 },
  formLabel: { color: '#888', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  formInput: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', fontSize: 13, borderWidth: 1, borderColor: '#222' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
  cancelBtnText: { color: '#FFF', fontWeight: '600' },
  saveBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E34A29' },
  saveBtnText: { color: '#FFF', fontWeight: '700' },
});
