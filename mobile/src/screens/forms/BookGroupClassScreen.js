import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { User, Mail, Phone, Calendar, ChevronLeft } from 'lucide-react-native';
import api from '../../services/api';

const CLASS_OPTIONS = ['HIIT Blast', 'Strength Foundations', 'Cardio Core', 'Yoga Flow'];

export default function BookGroupClassScreen({ navigation }) {
  const [formData, setFormData] = useState({
    type: 'group-class',
    name: '', email: '', phone: '', service: 'HIIT Blast', date: '', message: ''
  });
  const [status, setStatus] = useState('idle');
  const [selectedClass, setSelectedClass] = useState('HIIT Blast');

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.date) {
      return Alert.alert('Error', 'Please fill in all required fields (Name, Email, Date).');
    }
    setStatus('submitting');
    try {
      const response = await api.post('/forms', { ...formData, service: selectedClass });
      if (response.data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        Alert.alert('Error', response.data.message || 'Something went wrong.');
      }
    } catch (error) {
      setStatus('error');
      Alert.alert('Error', error.response?.data?.message || 'Network error.');
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successTitle}>BOOKING RECEIVED</Text>
          <Text style={styles.successText}>
            Your spot has been tentatively reserved! Check your email for confirmation details.
          </Text>
          <TouchableOpacity style={styles.againBtn} onPress={() => { setStatus('idle'); setFormData({ ...formData, name: '', email: '', phone: '', date: '', message: '' }); }}>
            <Text style={styles.againBtnText}>Book Another Class</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#E34A29" size={20} />
          <Text style={styles.backText}>Services</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Sweat Together</Text>
          <Text style={styles.title}>BOOK GROUP <Text style={styles.highlight}>CLASS</Text></Text>
          <View style={styles.divider} />
        </View>

        {/* Form */}
        <View style={styles.inputRow}>
          <User color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Full Name *" placeholderTextColor="#666"
            value={formData.name} onChangeText={v => handleChange('name', v)} />
        </View>

        <View style={styles.inputRow}>
          <Mail color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Email Address *" placeholderTextColor="#666"
            keyboardType="email-address" autoCapitalize="none"
            value={formData.email} onChangeText={v => handleChange('email', v)} />
        </View>

        <View style={styles.inputRow}>
          <Phone color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#666"
            keyboardType="phone-pad" maxLength={10}
            value={formData.phone} onChangeText={v => handleChange('phone', v)} />
        </View>

        <View style={styles.inputRow}>
          <Calendar color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Date & Time (e.g. 2026-04-20 10:00) *" placeholderTextColor="#666"
            value={formData.date} onChangeText={v => handleChange('date', v)} />
        </View>

        {/* Class Selector */}
        <Text style={styles.label}>SELECT CLASS</Text>
        <View style={styles.optionsRow}>
          {CLASS_OPTIONS.map(opt => (
            <TouchableOpacity key={opt}
              style={[styles.optionChip, selectedClass === opt && styles.optionChipActive]}
              onPress={() => setSelectedClass(opt)}>
              <Text style={[styles.optionText, selectedClass === opt && styles.optionTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message */}
        <TextInput style={styles.textArea} placeholder="Any injuries or notes?" placeholderTextColor="#666"
          multiline numberOfLines={4} textAlignVertical="top"
          value={formData.message} onChangeText={v => handleChange('message', v)} />

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={status === 'submitting'}>
          {status === 'submitting' ? <ActivityIndicator color="#FFF" /> :
            <Text style={styles.submitText}>CONFIRM BOOKING</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  scroll: { padding: 24, paddingBottom: 60 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: '#E34A29', fontWeight: 'bold', fontSize: 14 },
  header: { alignItems: 'center', marginBottom: 30 },
  eyebrow: { color: '#E34A29', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  highlight: { color: '#E34A29' },
  divider: { height: 1, width: 40, backgroundColor: '#E34A29', marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', paddingHorizontal: 16, marginBottom: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', paddingVertical: 16, fontSize: 14 },
  label: { color: '#888', fontSize: 10, letterSpacing: 2, fontWeight: 'bold', marginBottom: 10, marginTop: 6 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  optionChip: { backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  optionChipActive: { backgroundColor: '#E34A29', borderColor: '#E34A29' },
  optionText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  optionTextActive: { color: '#FFF' },
  textArea: { backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', color: '#FFF', padding: 16, fontSize: 14, minHeight: 100, marginBottom: 20 },
  submitBtn: { backgroundColor: '#E34A29', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#E34A29', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(34, 197, 94, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successCheck: { color: '#4ADE80', fontSize: 40 },
  successTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  successText: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  againBtn: { marginTop: 24 },
  againBtnText: { color: '#E34A29', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
});
