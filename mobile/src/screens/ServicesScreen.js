import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar, Activity, FileText, Shield, ChevronRight } from 'lucide-react-native';

const SERVICES = [
  { 
    title: 'Book Group Class', 
    desc: 'Reserve your spot in our high-energy group sessions.',
    icon: Calendar,
    color: '#E34A29',
    screen: 'BookGroupClass',
  },
  { 
    title: 'Book PT Sessions', 
    desc: 'Schedule 1-on-1 time with our elite trainers.',
    icon: Activity,
    color: '#4299e1',
    screen: 'BookPTSession',
  },
  { 
    title: 'PAR-Q', 
    desc: 'Complete your Physical Activity Readiness Questionnaire.',
    icon: FileText,
    color: '#a78bfa',
    screen: 'ParQForm',
  },
  { 
    title: 'PT Contract', 
    desc: 'Review and sign your personal training agreement.',
    icon: FileText,
    color: '#ed8936',
    screen: 'PTContractForm',
  },
  { 
    title: 'Trial Waiver', 
    desc: 'Sign your waiver to get started with a free trial.',
    icon: Shield,
    color: '#38b2ac',
    screen: 'TrialWaiverForm',
  },
];

export default function ServicesScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Manage Your Fitness Journey</Text>
          <Text style={styles.title}>OUR <Text style={styles.highlight}>SERVICES</Text></Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            Access all gym services, book sessions, and complete required forms right from your phone.
          </Text>
        </View>

        {/* Service Cards */}
        {SERVICES.map((service, index) => {
          const IconComponent = service.icon;
          return (
            <TouchableOpacity 
              key={index} 
              style={styles.card}
              onPress={() => navigation.navigate(service.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${service.color}20` }]}>  
                <IconComponent color={service.color} size={24} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{service.title}</Text>
                <Text style={styles.cardDesc}>{service.desc}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <ChevronRight color="#666" size={20} />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Bottom Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            All forms and bookings are synced with your Tara Fitness account. Completed submissions can be viewed in your portal.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#050505',
  },
  scroll: { 
    padding: 24, 
    paddingBottom: 60,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 32,
  },
  eyebrow: { 
    color: '#A0A0A0', 
    fontSize: 10, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 8,
  },
  title: { 
    color: '#FFF', 
    fontSize: 32, 
    fontWeight: '900', 
    textAlign: 'center',
  },
  highlight: { 
    color: '#E34A29',
  },
  divider: { 
    height: 1, 
    width: 40, 
    backgroundColor: '#E34A29', 
    marginVertical: 16,
  },
  subtitle: { 
    color: '#A0A0A0', 
    fontSize: 13, 
    textAlign: 'center', 
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  infoBox: {
    marginTop: 12,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
