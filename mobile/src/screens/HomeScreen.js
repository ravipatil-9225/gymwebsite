import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { ArrowRight, HelpCircle, MessageSquare, User as UserIcon, Phone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    members: '500+',
    years: '10+',
    services: '7',
    trainers: '2'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/public/stats');
        setStats({
          members: `${data.members}+`,
          years: `${data.years}+`,
          services: data.services.toString(),
          trainers: data.trainers.toString()
        });
      } catch (err) {
        console.log('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. HERO SECTION */}
      <View style={styles.heroSection}>
        <Text style={styles.heroEyebrow}>TARA FITNESS CENTRE · KOLHAPUR</Text>
        <View style={styles.heroTitleContainer}>
          <Text style={styles.heroTopWord}>OBTAIN</Text>
          <Text style={styles.heroMainWord}>FITNESS</Text>
          <Text style={styles.heroBottomWord}>GOAL</Text>
        </View>
        
        <Text style={styles.heroSubtitle}>
          Transform your body. Elevate your mind. Kolhapur's most dedicated fitness centre.
        </Text>

        <View style={styles.heroButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Package')}
          >
            <Text style={styles.primaryButtonText}>VIEW MEMBERSHIPS</Text>
            <ArrowRight color="#FFF" size={16} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.members}</Text>
            <Text style={styles.statLabel}>MEMBERS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.years}</Text>
            <Text style={styles.statLabel}>YEARS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.services}</Text>
            <Text style={styles.statLabel}>SERVICES</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.trainers}</Text>
            <Text style={styles.statLabel}>TRAINERS</Text>
          </View>
        </View>
      </View>

      {/* 2. QUICK LINKS SECTION */}
      <View style={styles.quickLinksSection}>
        <Text style={styles.qlEyebrow}>Explore</Text>
        <Text style={styles.qlTitle}>QUICK <Text style={styles.highlight}>LINKS</Text></Text>
        
        <View style={styles.gridContainer}>
          <TouchableOpacity style={[styles.gridCard, { borderTopColor: '#e67e22', borderTopWidth: 2 }]} onPress={() => navigation.navigate('Enquiry')}>
            <HelpCircle color="#e67e22" size={24} />
            <Text style={styles.cardTitle}>Enquiry</Text>
            <Text style={styles.cardDesc}>Have questions? Drop us a line.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { borderTopColor: '#9f7aea', borderTopWidth: 2 }]} onPress={() => navigation.navigate('Feedback')}>
            <MessageSquare color="#9f7aea" size={24} />
            <Text style={styles.cardTitle}>Feedback</Text>
            <Text style={styles.cardDesc}>Give us your genuine suggestions.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { borderTopColor: '#38b2ac', borderTopWidth: 2 }]} onPress={() => navigation.navigate('Trainer')}>
            <UserIcon color="#38b2ac" size={24} />
            <Text style={styles.cardTitle}>Our Trainers</Text>
            <Text style={styles.cardDesc}>Achievements & Qualifications.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { borderTopColor: '#48bb78', borderTopWidth: 2 }]} onPress={() => navigation.navigate('Contact')}>
            <Phone color="#48bb78" size={24} />
            <Text style={styles.cardTitle}>Contact Us</Text>
            <Text style={styles.cardDesc}>We are here to help you.</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  heroSection: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  heroEyebrow: {
    color: '#E34A29',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  heroTitleContainer: {
    alignItems: 'center',
  },
  heroTopWord: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: -10,
  },
  heroMainWord: {
    color: '#FFF',
    fontSize: 60,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroBottomWord: {
    color: '#E34A29',
    fontSize: 45,
    fontWeight: '900',
    marginTop: -10,
  },
  heroSubtitle: {
    color: '#A0A0A0',
    textAlign: 'center',
    marginVertical: 24,
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  heroButtons: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#E34A29',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statNumber: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1,
  },
  quickLinksSection: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    alignItems: 'center',
  },
  qlEyebrow: {
    color: '#A0A0A0',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },
  qlTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 24,
  },
  highlight: {
    color: '#E34A29',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
    height: 140,
  },
  cardTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    fontSize: 14,
  },
  cardDesc: {
    color: '#888',
    fontSize: 11,
    lineHeight: 16,
  }
});
