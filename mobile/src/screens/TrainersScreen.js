import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  ActivityIndicator, Linking, RefreshControl, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Activity, Calendar, ArrowRight } from 'lucide-react-native';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';

const COLORS = ['#E34A29', '#4299e1', '#a78bfa', '#ed8936'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TrainersScreen() {
  const navigation = useNavigation();
  const { refreshTrigger } = React.useContext(SocketContext);
  const [trainersData, setTrainersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrainers = async () => {
    try {
      const { data } = await api.get('/public/trainers');
      const { STATIC_URL } = require('../services/api');
      const formatted = data.map((t, i) => ({
        id: t._id, 
        name: t.name, 
        role: t.specialization,
        image: t.photo ? (t.photo.startsWith('http') ? t.photo : STATIC_URL + t.photo) : '', 
        bio: t.description || t.experience || '',
        experience: t.experience || '',
        specialties: t.certifications ? t.certifications.split(',').map(s => s.trim()) : [],
        instagram: t.instagram || t.instagramId || '',
        contact: t.contact || '',
        accentColor: COLORS[i % COLORS.length]
      }));
      setTrainersData(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTrainers(); }, [refreshTrigger]);
  const onRefresh = () => { setRefreshing(true); fetchTrainers(); };

  const openInstagram = (url) => {
    if (url) Linking.openURL(url).catch(() => console.log('Invalid URL'));
  };

  if (loading && trainersData.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E34A29" />
        <Text style={styles.loadingText}>Loading trainers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Meet The Team</Text>
          <Text style={styles.title}>ELITE <Text style={styles.highlight}>TRAINERS</Text></Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            Our certified trainers bring years of expertise and genuine passion to every session.
          </Text>
        </View>
        
        {/* Trainer Cards */}
        {trainersData.map((trainer) => (
          <View key={trainer.id} style={[styles.card, { borderTopColor: trainer.accentColor, borderTopWidth: 2 }]}>
            {/* Image Section */}
            <View style={styles.imageContainer}>
              {trainer.image ? (
                <Image source={{ uri: trainer.image }} style={styles.image} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: `${trainer.accentColor}15` }]}>
                  <Text style={[styles.avatarText, { color: `${trainer.accentColor}40` }]}>
                    {trainer.name.charAt(0)}
                  </Text>
                </View>
              )}
              {/* Gradient overlay at bottom */}
              <View style={styles.imageGradient} />
            </View>

            {/* Content Section */}
            <View style={styles.content}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{trainer.name}</Text>
                  <Text style={[styles.role, { color: trainer.accentColor }]}>{trainer.role}</Text>
                </View>
                {trainer.instagram ? (
                  <TouchableOpacity 
                    style={styles.socialBtn}
                    onPress={() => openInstagram(trainer.instagram)}
                  >
                    <Text style={styles.socialIcon}>📷</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Experience Badge */}
              {trainer.experience ? (
                <View style={[styles.expBadge, { backgroundColor: `${trainer.accentColor}15`, borderColor: `${trainer.accentColor}30` }]}>
                  <Text style={[styles.expText, { color: trainer.accentColor }]}>
                    💪 {trainer.experience} Experience
                  </Text>
                </View>
              ) : null}

              {/* Bio */}
              <Text style={styles.bio}>{trainer.bio}</Text>

              {/* Specialties */}
              {trainer.specialties.length > 0 && (
                <View style={styles.specsContainer}>
                  <View style={styles.specsHeader}>
                    <Activity color={trainer.accentColor} size={14} />
                    <Text style={styles.specsTitle}>SPECIALIST IN</Text>
                  </View>
                  <View style={styles.specsTags}>
                    {trainer.specialties.map((spec, i) => (
                      <View key={i} style={[styles.specTag, { backgroundColor: `${trainer.accentColor}12`, borderColor: `${trainer.accentColor}30` }]}>
                        <Text style={[styles.specTagText, { color: trainer.accentColor }]}>{spec}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Book Session Button */}
              <TouchableOpacity 
                style={[styles.bookBtn, { backgroundColor: trainer.accentColor }]}
                onPress={() => navigation.navigate('BookPTSession', { trainer: trainer.name })}
              >
                <Calendar color="#FFF" size={16} />
                <Text style={styles.bookBtnText}>BOOK A SESSION</Text>
                <ArrowRight color="#FFF" size={14} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {trainersData.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No trainers available at the moment.</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footerText}>
          All trainers are certified professionals. Book a session to start your transformation journey.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  scroll: { padding: 20, paddingBottom: 60 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  
  // Header
  header: { alignItems: 'center', marginBottom: 32 },
  eyebrow: { color: '#A0A0A0', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  highlight: { color: '#E34A29' },
  divider: { height: 1, width: 40, backgroundColor: '#E34A29', marginVertical: 14 },
  subtitle: { color: '#A0A0A0', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  
  // Card
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  
  // Image
  imageContainer: { height: 300, width: '100%', position: 'relative', backgroundColor: '#0a0a0a' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 100, fontWeight: '900' },
  imageGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
    // Simulated gradient with semi-transparent overlay
    backgroundColor: 'transparent',
  },
  
  // Content
  content: { padding: 22 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 4, letterSpacing: 0.5 },
  role: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  socialBtn: { 
    width: 42, height: 42, borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center' 
  },
  socialIcon: { fontSize: 18 },
  
  // Experience
  expBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 14 },
  expText: { fontSize: 12, fontWeight: 'bold' },
  
  // Bio
  bio: { color: '#888', fontSize: 14, lineHeight: 22, marginBottom: 18 },
  
  // Specialties
  specsContainer: { marginBottom: 20 },
  specsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  specsTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginLeft: 6, color: 'rgba(255,255,255,0.35)' },
  specsTags: { flexDirection: 'row', flexWrap: 'wrap' },
  specTag: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  specTagText: { fontSize: 11, fontWeight: '700' },
  
  // Book Button
  bookBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    paddingVertical: 16, borderRadius: 14, gap: 8,
    shadowColor: '#E34A29', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  bookBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },
  
  // Empty & Footer
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 14 },
  footerText: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 18 },
});
