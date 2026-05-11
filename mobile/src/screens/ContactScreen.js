import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform
} from 'react-native';
import { ArrowLeft, Phone, MapPin, AtSign, Clock } from 'lucide-react-native';

export default function ContactScreen({ navigation }) {

  const openLink = (url) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>WE'RE HERE FOR YOU</Text>
          <Text style={styles.title}>CONTACT <Text style={{ color: '#E34A29', fontWeight: '300' }}>DETAILS</Text></Text>
          <View style={styles.headerDivider} />
          <Text style={styles.subtitle}>
            Whether you want to drop by for a tour, give us a call, or send a message on social media, we are always ready to help you on your fitness journey.
          </Text>
        </View>

        {/* Direct Contact */}
        <View style={styles.sectionSection}>
          <Text style={styles.sectionHeading}>Direct Contact</Text>
          
          {/* Phone */}
          <TouchableOpacity style={styles.contactCard} onPress={() => openLink('tel:+919960552750')}>
            <View style={styles.iconBoxPrimary}>
              <Phone color="#E34A29" size={20} />
            </View>
            <View style={styles.cardTextCont}>
              <Text style={styles.cardLabel}>TARACHAND PARAMAR</Text>
              <Text style={styles.cardValue}>+91 99605 52750</Text>
            </View>
          </TouchableOpacity>

          {/* WhatsApp */}
          <TouchableOpacity style={styles.contactCard} onPress={() => openLink('https://wa.me/919960552750')}>
            <View style={[styles.iconBoxPrimary, { backgroundColor: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.2)' }]}>
              {/* Fallback to phone icon tinted green for Whatsapp since we don't have lucide whatsapp icon */}
              <Phone color="#25D366" size={20} />
            </View>
            <View style={styles.cardTextCont}>
              <Text style={styles.cardLabel}>WHATSAPP US</Text>
              <Text style={[styles.cardValue, { color: '#25D366' }]}>Message on WhatsApp</Text>
            </View>
          </TouchableOpacity>

          {/* Instagram */}
          <View style={styles.contactCard}>
            <View style={[styles.iconBoxPrimary, { backgroundColor: 'rgba(225,48,108,0.1)', borderColor: 'rgba(225,48,108,0.2)' }]}>
              <AtSign color="#E1306C" size={20} />
            </View>
            <View style={styles.cardTextCont}>
              <Text style={styles.cardLabel}>FOLLOW US</Text>
              <TouchableOpacity onPress={() => openLink('https://www.instagram.com/tara_.parmar')}>
                <Text style={[styles.cardValue, { color: '#E1306C', marginBottom: 6 }]}>@tara_.parmar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink('https://www.instagram.com/tara_fitness_centre')}>
                <Text style={[styles.cardValue, { color: '#E1306C' }]}>@tara_fitness_centre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Location & Hours */}
        <View style={styles.sectionSection}>
          <Text style={styles.sectionHeading}>Our Location</Text>
          
          {/* Location */}
          <TouchableOpacity style={styles.contactCard} onPress={() => openLink('https://maps.app.goo.gl/BANt7yyCSZReYRpw6')}>
            <View style={styles.iconBoxPrimary}>
              <MapPin color="#E34A29" size={20} />
            </View>
            <View style={styles.cardTextCont}>
              <Text style={styles.cardLabel}>TARA FITNESS CENTER</Text>
              <Text style={[styles.cardValue, { fontSize: 14, lineHeight: 22, fontWeight: 'normal' }]}>
                Shop No 1, Kalamba Rd,{'\n'}
                opp. Surveynagar, Ramkrishna Nagar,{'\n'}
                Survey Nagar, Kolhapur,{'\n'}
                Maharashtra 416007
              </Text>
            </View>
          </TouchableOpacity>

          {/* Hours */}
          <View style={styles.contactCard}>
            <View style={styles.iconBoxPrimary}>
              <Clock color="#E34A29" size={20} />
            </View>
            <View style={styles.cardTextCont}>
              <Text style={styles.cardLabel}>OPENING HOURS</Text>
              <Text style={[styles.cardValue, { fontSize: 15, fontWeight: 'normal', marginBottom: 4 }]}>Mon - Sat: 5:00 AM – 10:00 AM</Text>
              <Text style={[styles.cardValue, { fontSize: 15, fontWeight: 'normal', marginBottom: 4 }]}>Mon - Sat: 4:00 PM – 9:00 PM</Text>
              <Text style={[styles.cardValue, { fontSize: 15, fontWeight: 'normal', color: '#666' }]}>Sunday: Closed</Text>
            </View>
          </View>
        </View>

      </ScrollView>
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
  scroll: { padding: 20, paddingBottom: 60 },

  pageHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  eyebrow: { color: '#E34A29', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  headerDivider: { width: 60, height: 2, backgroundColor: '#E34A29', marginVertical: 14 },
  subtitle: { color: '#888', fontSize: 13, textAlign: 'center', paddingHorizontal: 10, lineHeight: 20 },

  sectionSection: { marginBottom: 30 },
  sectionHeading: { color: '#FFF', fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10, marginBottom: 16 },

  contactCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  iconBoxPrimary: { 
    width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(227, 74, 41, 0.1)', 
    borderWidth: 1, borderColor: 'rgba(227, 74, 41, 0.2)', alignItems: 'center', justifyContent: 'center',
    marginRight: 16
  },
  cardTextCont: { flex: 1, justifyContent: 'center' },
  cardLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  cardValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
