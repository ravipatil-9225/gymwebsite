import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { ArrowLeft, Tag, Calendar, BadgePercent } from 'lucide-react-native';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function OffersScreen({ navigation }) {
  const { refreshTrigger } = React.useContext(SocketContext);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOffers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/public/offers');
      // Only show active offers to regular users
      setOffers(data.filter(o => o.isActive !== false));
    } catch (err) {
      if (!silent) Alert.alert('Error', 'Failed to load offers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers, refreshTrigger]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOffers(true);
  }, [fetchOffers]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXCLUSIVE OFFERS</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E34A29" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E34A29" colors={['#E34A29']} />
          }
        >
          <View style={styles.banner}>
            <BadgePercent color="#FFF" size={40} />
            <View>
              <Text style={styles.bannerTitle}>MEMBERS ONLY DEALS</Text>
              <Text style={styles.bannerSubtitle}>Save big on your next subscription</Text>
            </View>
          </View>

          {offers.map((offer) => (
            <View key={offer._id} style={styles.offerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{offer.discount}</Text>
                </View>
                <View style={styles.expiryBox}>
                  <Calendar color="#666" size={12} />
                  <Text style={styles.expiryText}>{fmt(offer.expiryDate)}</Text>
                </View>
              </View>

              <Text style={styles.title}>{offer.title}</Text>
              <Text style={styles.description}>{offer.description}</Text>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.claimBtn}
                onPress={() => navigation.navigate('Package')}
              >
                <Text style={styles.claimBtnText}>VIEW PACKAGES</Text>
              </TouchableOpacity>
            </View>
          ))}

          {offers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Tag color="#333" size={60} />
              <Text style={styles.emptyText}>No active offers at the moment.</Text>
              <Text style={styles.emptySub}>Check back later for exclusive deals!</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#E34A29',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  offerCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(227, 74, 41, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(227, 74, 41, 0.3)',
  },
  badgeText: {
    color: '#E34A29',
    fontSize: 11,
    fontWeight: '900',
  },
  expiryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#AAA',
    fontSize: 13,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 16,
  },
  claimBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  claimBtnText: {
    color: '#E34A29',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
  },
  emptySub: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
  },
});
