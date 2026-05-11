import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Image
} from 'react-native';
import { ArrowLeft, Dumbbell, Trash2, Edit, Plus, X, Save } from 'lucide-react-native';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import * as ImagePicker from 'expo-image-picker';

export default function AdminTrainersScreen({ navigation }) {
  const { refreshTrigger } = React.useContext(SocketContext);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editTrainer, setEditTrainer] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchTrainers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const { data } = await api.get('/admin/trainers'); setTrainers(data); }
    catch { if (!silent) Alert.alert('Error', 'Failed to load.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchTrainers(); }, [fetchTrainers, refreshTrigger]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchTrainers(true); }, [fetchTrainers]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditTrainer(p => ({ ...p, photo: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const handleSave = async () => {
    if (!editTrainer) return;
    if (!editTrainer.name || !editTrainer.specialization) {
      Alert.alert('Validation Error', 'Trainer Name and Specialization are required.');
      return;
    }
    setEditLoading(true);
    try {
      if (editTrainer._id) {
        const { _id, ...trainerData } = editTrainer;
        await api.put(`/admin/trainers/${editTrainer._id}`, trainerData);
      } else {
        await api.post('/admin/trainers', editTrainer);
      }
      setEditTrainer(null); fetchTrainers(true);
    } catch { Alert.alert('Error', 'Failed to save.'); }
    finally { setEditLoading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Trainer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/admin/trainers/${id}`); fetchTrainers(true); }
        catch { Alert.alert('Error', 'Failed to delete.'); }
      }}
    ]);
  };

  const fields = [
    { key: 'name', label: 'Name' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'experience', label: 'Experience' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'description', label: 'Description', multi: true },
    { key: 'instagramId', label: 'Instagram URL' },
    { key: 'contact', label: 'Contact' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#FFF" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>TRAINERS</Text>
        <TouchableOpacity onPress={() => setEditTrainer({ name: '', specialization: '', experience: '', certifications: '', description: '', photo: '', instagramId: '', contact: '' })}>
          <Plus color="#E34A29" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E34A29" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />}>
          {trainers.map(t => (
            <View key={t._id} style={styles.card}>
              <View style={styles.cardTop}>
                {t.photo ? (
                  <Image source={{ uri: t.photo.startsWith('/') ? `https://tfc365.com${t.photo}` : t.photo }} style={styles.trainerImg} />
                ) : (
                  <View style={styles.trainerImgPlaceholder}><Dumbbell color="#E34A29" size={20} /></View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.trainerName}>{t.name}</Text>
                  <Text style={styles.trainerSpec}>{t.specialization}</Text>
                  <Text style={styles.trainerExp}>{t.experience} experience</Text>
                </View>
              </View>
              {t.description && <Text style={styles.trainerDesc} numberOfLines={2}>{t.description}</Text>}
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditTrainer({ ...t })}>
                  <Edit color="#4F8EF7" size={14} /><Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(t._id)}>
                  <Trash2 color="#EF4444" size={14} /><Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {trainers.length === 0 && <View style={styles.emptyContainer}><Dumbbell color="#333" size={48} /><Text style={styles.emptyText}>No trainers</Text></View>}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      <Modal visible={!!editTrainer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editTrainer?._id ? 'Edit Trainer' : 'Add Trainer'}</Text>
              <TouchableOpacity onPress={() => setEditTrainer(null)}><X color="#FFF" size={20} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {editTrainer && fields.map(({ key, label, multi }) => (
                <View key={key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{label}</Text>
                  <TextInput style={[styles.formInput, multi && { minHeight: 60 }]} value={editTrainer[key] || ''} onChangeText={v => setEditTrainer(p => ({ ...p, [key]: v }))} placeholderTextColor="#555" placeholder={label} multiline={multi} />
                </View>
              ))}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Trainer Photo (Optional)</Text>
                {editTrainer?.photo ? (
                  <View style={{ position: 'relative', marginTop: 10 }}>
                    <Image source={{ uri: editTrainer.photo.startsWith('/') ? `https://tfc365.com${editTrainer.photo}` : editTrainer.photo }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setEditTrainer(p => ({ ...p, photo: '' }))}>
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
              <TouchableOpacity style={styles.cancelBtnModal} onPress={() => setEditTrainer(null)}><Text style={styles.cancelBtnModalText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnModal} onPress={handleSave} disabled={editLoading}>
                {editLoading ? <ActivityIndicator color="#FFF" size="small" /> : <><Save color="#FFF" size={15} /><Text style={styles.saveBtnModalText}>Save</Text></>}
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
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  trainerImg: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#1A1A1A' },
  trainerImgPlaceholder: { width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(227,74,41,0.1)', alignItems: 'center', justifyContent: 'center' },
  trainerName: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  trainerSpec: { color: '#E34A29', fontSize: 11, fontWeight: '600', marginTop: 2 },
  trainerExp: { color: '#888', fontSize: 11, marginTop: 2 },
  trainerDesc: { color: '#888', fontSize: 11, lineHeight: 16, marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#1F1F1F', paddingTop: 10 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1A1A1A' },
  editBtnText: { color: '#4F8EF7', fontSize: 11, fontWeight: '700' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1A1A1A' },
  deleteBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: '#666', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', borderWidth: 1, borderColor: '#222' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  modalScroll: { padding: 20, maxHeight: 400 },
  modalFooter: { flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: '#222' },
  formGroup: { marginBottom: 14 },
  formLabel: { color: '#888', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  formInput: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', fontSize: 13, borderWidth: 1, borderColor: '#222' },
  cancelBtnModal: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
  cancelBtnModalText: { color: '#FFF', fontWeight: '600' },
  saveBtnModal: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E34A29' },
  saveBtnModalText: { color: '#FFF', fontWeight: '700' },
  pickImageBtn: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 14, alignItems: 'center' },
  pickImageBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  imagePreview: { width: '100%', height: 160, borderRadius: 10, resizeMode: 'cover' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 },
});
