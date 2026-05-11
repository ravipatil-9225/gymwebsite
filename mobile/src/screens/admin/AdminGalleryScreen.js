import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, Image
} from 'react-native';
import { ArrowLeft, Image as ImageIcon, Trash2, Edit, Plus, X, Save } from 'lucide-react-native';
import api from '../../services/api';
import { SocketContext } from '../../context/SocketContext';
import * as ImagePicker from 'expo-image-picker';

export default function AdminGalleryScreen({ navigation }) {
  const { refreshTrigger } = React.useContext(SocketContext);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editImg, setEditImg] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchGallery = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const { data } = await api.get('/admin/gallery'); setImages(data); }
    catch { if (!silent) Alert.alert('Error', 'Failed to load.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery, refreshTrigger]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchGallery(true); }, [fetchGallery]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditImg(p => ({ ...p, imageUrl: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const handleSave = async () => {
    if (!editImg) return;
    if (!editImg.imageUrl || !editImg.imageUrl.trim()) {
      Alert.alert('Validation Error', 'You must select an image.');
      return;
    }
    setEditLoading(true);
    try {
      if (editImg._id) {
        const { _id, ...imgData } = editImg;
        await api.put(`/admin/gallery/${editImg._id}`, imgData);
      } else {
        await api.post('/admin/gallery', editImg);
      }
      setEditImg(null); fetchGallery(true);
    } catch { Alert.alert('Error', 'Failed to save.'); }
    finally { setEditLoading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Image', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/admin/gallery/${id}`); fetchGallery(true); }
        catch { Alert.alert('Error', 'Failed to delete.'); }
      }}
    ]);
  };

  const getImgUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/')) return `https://tfc365.com${url}`;
    return url;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#FFF" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>GALLERY</Text>
        <TouchableOpacity onPress={() => setEditImg({ imageUrl: '', title: '', description: '' })}>
          <Plus color="#E34A29" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E34A29" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />}>
          <View style={styles.grid}>
            {images.map(img => (
              <View key={img._id} style={styles.card}>
                {getImgUrl(img.imageUrl) ? (
                  <Image source={{ uri: getImgUrl(img.imageUrl) }} style={styles.cardImg} />
                ) : (
                  <View style={styles.cardImgPlaceholder}><ImageIcon color="#333" size={32} /></View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{img.title || 'Untitled'}</Text>
                  {img.description && <Text style={styles.cardDesc} numberOfLines={1}>{img.description}</Text>}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setEditImg({ ...img })}>
                    <Edit color="#4F8EF7" size={14} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(img._id)}>
                    <Trash2 color="#EF4444" size={14} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          {images.length === 0 && <View style={styles.emptyContainer}><ImageIcon color="#333" size={48} /><Text style={styles.emptyText}>No images</Text></View>}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      <Modal visible={!!editImg} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editImg?._id ? 'Edit Image' : 'Add Image'}</Text>
              <TouchableOpacity onPress={() => setEditImg(null)}><X color="#FFF" size={20} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {editImg && [
                { key: 'title', label: 'Title' },
                { key: 'description', label: 'Description', multi: true },
              ].map(({ key, label, multi }) => (
                <View key={key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{label}</Text>
                  <TextInput style={[styles.formInput, multi && { minHeight: 60 }]} value={editImg[key] || ''} onChangeText={v => setEditImg(p => ({ ...p, [key]: v }))} placeholderTextColor="#555" placeholder={label} multiline={multi} />
                </View>
              ))}
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Gallery Image</Text>
                {editImg?.imageUrl ? (
                  <View style={{ position: 'relative', marginTop: 10 }}>
                    <Image source={{ uri: getImgUrl(editImg.imageUrl) }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setEditImg(p => ({ ...p, imageUrl: '' }))}>
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
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditImg(null)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '48%', flexGrow: 1, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1F1F1F', overflow: 'hidden' },
  cardImg: { width: '100%', height: 120, backgroundColor: '#1A1A1A' },
  cardImgPlaceholder: { width: '100%', height: 120, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { padding: 10 },
  cardTitle: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  cardDesc: { color: '#888', fontSize: 10, marginTop: 2 },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1F1F1F' },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 12, width: '100%' },
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
  previewImg: { width: '100%', height: 180, borderRadius: 12, marginTop: 10, backgroundColor: '#1A1A1A' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
  cancelBtnText: { color: '#FFF', fontWeight: '600' },
  saveBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#E34A29' },
  saveBtnText: { color: '#FFF', fontWeight: '700' },
  pickImageBtn: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 14, alignItems: 'center' },
  pickImageBtnText: { color: '#888', fontWeight: '600', fontSize: 13 },
  imagePreview: { width: '100%', height: 160, borderRadius: 10, resizeMode: 'cover' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 },
});
