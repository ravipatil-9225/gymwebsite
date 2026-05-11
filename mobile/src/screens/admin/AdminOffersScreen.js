import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Image
} from 'react-native';
import { ArrowLeft, Tag, Trash2, Edit, Plus, X, Save } from 'lucide-react-native';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import * as ImagePicker from 'expo-image-picker';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminOffersScreen({ navigation }) {
  const { refreshTrigger } = React.useContext(SocketContext);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchOffers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const { data } = await api.get('/admin/offers'); setOffers(data); }
    catch { if (!silent) Alert.alert('Error', 'Failed to load.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers, refreshTrigger]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchOffers(true); }, [fetchOffers]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditOffer(p => ({ ...p, image: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const handleSave = async () => {
    if (!editOffer) return;
    if (!editOffer.title || !editOffer.description || !editOffer.expiryDate) {
      Alert.alert('Validation Error', 'Title, Description, and Expiry Date are required.');
      return;
    }
    
    // Strict validation for YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editOffer.expiryDate)) {
      Alert.alert('Validation Error', 'Please enter Expiry Date exactly as YYYY-MM-DD (e.g., 2026-12-31).');
      return;
    }

    setEditLoading(true);
    try {
      if (editOffer._id) {
        const { _id, ...offerData } = editOffer;
        await api.put(`/admin/offers/${editOffer._id}`, offerData);
      } else {
        await api.post('/admin/offers', editOffer);
      }
      setEditOffer(null); fetchOffers(true);
    } catch (err) { Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save.'); }
    finally { setEditLoading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Offer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/admin/offers/${id}`); fetchOffers(true); }
        catch { Alert.alert('Error', 'Failed to delete.'); }
      }}
    ]);
  };

  const toggleActive = async (o) => {
    try { await api.put(`/admin/offers/${o._id}`, { isActive: !o.isActive }); fetchOffers(true); }
    catch { Alert.alert('Error', 'Failed to update.'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#FFF" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>OFFERS</Text>
        <TouchableOpacity onPress={() => setEditOffer({ title: '', description: '', discount: '', expiryDate: '', isActive: true, image: '' })}>
          <Plus color="#E34A29" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E34A29" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />}>
          {offers.map(o => (
            <View key={o._id} style={[styles.card, !o.isActive && styles.cardInactive]}>
              <View style={styles.cardTop}>
                {o.image ? (
                  <Image source={{ uri: o.image }} style={styles.listImage} />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerTitle}>{o.title}</Text>
                  <Text style={styles.offerDesc} numberOfLines={2}>{o.description}</Text>
                </View>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{o.discount}</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.expiryText}>Expires: {fmt(o.expiryDate)}</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TouchableOpacity style={[styles.activeToggle, o.isActive ? styles.activeOn : styles.activeOff]} onPress={() => toggleActive(o)}>
                    <Text style={[styles.activeToggleText, o.isActive ? styles.activeOnText : styles.activeOffText]}>{o.isActive ? 'Active' : 'Inactive'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditOffer({ ...o, expiryDate: o.expiryDate ? o.expiryDate.split('T')[0] : '' })}><Edit color="#4F8EF7" size={16} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(o._id)}><Trash2 color="#EF4444" size={16} /></TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {offers.length === 0 && <View style={styles.emptyContainer}><Tag color="#333" size={48} /><Text style={styles.emptyText}>No offers</Text></View>}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      <Modal visible={!!editOffer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editOffer?._id ? 'Edit Offer' : 'New Offer'}</Text>
              <TouchableOpacity onPress={() => setEditOffer(null)}><X color="#FFF" size={20} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {editOffer && [
                { key: 'title', label: 'Title' }, { key: 'description', label: 'Description', multi: true },
                { key: 'discount', label: 'Discount (e.g. 20% OFF)' }, { key: 'expiryDate', label: 'Expiry (YYYY-MM-DD)' },
              ].map(({ key, label, multi }) => (
                <View key={key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{label}</Text>
                  <TextInput style={[styles.formInput, multi && { minHeight: 60 }]} value={editOffer[key] || ''} onChangeText={v => setEditOffer(p => ({ ...p, [key]: v }))} placeholderTextColor="#555" placeholder={label} multiline={multi} />
                </View>
              ))}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Offer Image (Optional)</Text>
                {editOffer?.image ? (
                  <View style={{ position: 'relative', marginTop: 10 }}>
                    <Image source={{ uri: editOffer.image }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setEditOffer(p => ({ ...p, image: '' }))}>
                      <X color="#FFF" size={14} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.pickImageBtn} onPress={handlePickImage}>
                    <Text style={styles.pickImageBtnText}>Select Image</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditOffer(null)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={editLoading}>
                {editLoading ? <ActivityIndicator color="#FFF" size="small" /> : <><Save color="#FFF" size={15} /><Text style={styles.saveBtnText}>Save</Text></>}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#111', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1F1F1F', marginBottom: 12 },
  cardInactive: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  offerTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  offerDesc: { color: '#888', fontSize: 11, lineHeight: 16 },
  discountBadge: { backgroundColor: '#E34A29', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  discountText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1F1F1F', paddingTop: 10 },
  expiryText: { color: '#666', fontSize: 10 },
  activeToggle: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  activeOn: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  activeOff: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  activeToggleText: { fontSize: 10, fontWeight: '700' },
  activeOnText: { color: '#22C55E' },
  activeOffText: { color: '#EF4444' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: '#666', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', borderWidth: 1, borderColor: '#222' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  modalScroll: { padding: 20, maxHeight: 350 },
  modalFooter: { flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: '#222' },
  formGroup: { marginBottom: 14 },
  formLabel: { color: '#888', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  formInput: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', fontSize: 13, borderWidth: 1, borderColor: '#222' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
  cancelBtnText: { color: '#FFF', fontWeight: '600' },
  saveBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E34A29' },
  saveBtnText: { color: '#FFF', fontWeight: '700' },
  listImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#1A1A1A' },
  pickImageBtn: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 14, alignItems: 'center' },
  pickImageBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  imagePreview: { width: '100%', height: 160, borderRadius: 10, resizeMode: 'cover' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 },
});
