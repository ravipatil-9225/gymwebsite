import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  ActivityIndicator, Modal, Dimensions, FlatList 
} from 'react-native';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react-native';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GalleryScreen({ navigation }) {
  const { refreshTrigger } = React.useContext(SocketContext);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data } = await api.get('/public/gallery');
        const { STATIC_URL } = require('../services/api');
        const activePhotos = data.filter(g => g.isActive).map((g, i) => ({
          id: g._id || i, 
          src: g.imageUrl?.startsWith('http') ? g.imageUrl : STATIC_URL + g.imageUrl, 
          caption: g.title || g.category || 'Gym Facility'
        }));
        setPhotos(activePhotos);
      } catch(e) { 
        console.error('Gallery fetching error:', e); 
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [refreshTrigger]);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((i) => (i - 1 + photos.length) % photos.length);
    }
  };

  const nextPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((i) => (i + 1) % photos.length);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gallery</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <ImageIcon size={24} color="#E34A29" style={{ marginBottom: 8 }} />
          <Text style={styles.eyebrow}>Our Facility</Text>
          <Text style={styles.title}>PHOTO <Text style={{ color: '#E34A29', fontWeight: '300' }}>GALLERY</Text></Text>
          <View style={styles.headerDivider} />
          <Text style={styles.subtitle}>
            Experience our world-class facility through the lens. Tap any photo to explore.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#E34A29" />
          </View>
        ) : (
          <View style={styles.grid}>
            {photos.map((photo, idx) => (
              <TouchableOpacity
                key={photo.id}
                onPress={() => openLightbox(idx)}
                style={[
                  styles.gridItem,
                  idx === 0 ? styles.gridItemLarge : styles.gridItemSmall
                ]}
                activeOpacity={0.8}
              >
                <Image source={{ uri: photo.src }} style={styles.image} />
                <View style={styles.overlay}>
                  <Text style={styles.captionText}>{photo.caption}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {!loading && photos.length === 0 && (
          <Text style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>No photos available.</Text>
        )}
        
        {!loading && photos.length > 0 && (
          <Text style={styles.footerText}>{photos.length} photos • Tap to open fullscreen</Text>
        )}
      </ScrollView>

      {/* Lightbox / Fullscreen Modal */}
      <Modal visible={lightboxIndex !== null} transparent={true} animationType="fade" onRequestClose={closeLightbox}>
        <View style={styles.lightboxContainer}>
          {/* Close button */}
          <TouchableOpacity style={styles.lbCloseBtn} onPress={closeLightbox}>
            <X color="#FFF" size={28} />
          </TouchableOpacity>

          {/* Navigation left */}
          <TouchableOpacity style={styles.lbPrevBtn} onPress={prevPhoto}>
            <ChevronLeft color="#FFF" size={32} />
          </TouchableOpacity>

          {/* Image */}
          {lightboxIndex !== null && (
            <View style={styles.lbImageWrapper}>
              <Image 
                source={{ uri: photos[lightboxIndex]?.src }} 
                style={styles.lbImage} 
                resizeMode="contain" 
              />
              <View style={styles.lbCaptionBox}>
                <Text style={styles.lbCaptionTitle}>{photos[lightboxIndex]?.caption}</Text>
                <Text style={styles.lbCaptionCounter}>{lightboxIndex + 1} / {photos.length}</Text>
              </View>
            </View>
          )}

          {/* Navigation right */}
          <TouchableOpacity style={styles.lbNextBtn} onPress={nextPhoto}>
            <ChevronRight color="#FFF" size={32} />
          </TouchableOpacity>

        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 20, paddingTop: 60, backgroundColor: '#111', 
    borderBottomWidth: 1, borderBottomColor: '#222' 
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  scroll: { padding: 16, paddingBottom: 60 },
  
  pageHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  eyebrow: { color: '#E34A29', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  headerDivider: { width: 60, height: 2, backgroundColor: '#E34A29', marginVertical: 14 },
  subtitle: { color: '#888', fontSize: 13, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  
  loaderContainer: { paddingVertical: 40, alignItems: 'center' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { 
    marginBottom: 12, borderRadius: 12, overflow: 'hidden', 
    borderWidth: 1, borderColor: '#222', backgroundColor: '#111' 
  },
  gridItemLarge: { width: '100%', height: 200 },
  gridItemSmall: { width: '48%', height: 140 },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 10
  },
  captionText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  footerText: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 20 },
  
  // Lightbox
  lightboxContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  lbCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  lbPrevBtn: { position: 'absolute', left: 10, top: '50%', zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30 },
  lbNextBtn: { position: 'absolute', right: 10, top: '50%', zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30 },
  lbImageWrapper: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  lbImage: { width: '100%', height: '70%' },
  lbCaptionBox: { position: 'absolute', bottom: 60, alignItems: 'center' },
  lbCaptionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  lbCaptionCounter: { color: '#888', fontSize: 13 },
});
