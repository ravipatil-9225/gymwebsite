import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { User, Mail, Phone, ChevronLeft } from 'lucide-react-native';
import api from '../../services/api';

const TRIAL_OPTIONS = ['1 Day Trial', '3 Day Trial', '1 Week Trial'];

export default function TrialWaiverFormScreen({ navigation }) {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    type: 'trial-waiver', name: '', email: '', phone: '', inquiryFor: '',
    clientDate: today, parentDate: today, witnessDate: today,
  });
  const [status, setStatus] = useState('idle');
  const [agreed, setAgreed] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.inquiryFor) {
      return Alert.alert('Error', 'Please fill in all required fields.');
    }
    if (!agreed) {
      return Alert.alert('Error', 'Please agree to the waiver by checking the acknowledgment box.');
    }
    setStatus('submitting');
    try {
      const response = await api.post('/forms', {
        type: formData.type, name: formData.name, email: formData.email, phone: formData.phone,
        message: `Inquiry For: ${formData.inquiryFor} | Client Signed: Yes (${formData.clientDate}) | Parent Signed: N/A (${formData.parentDate}) | Witness Signed: N/A (${formData.witnessDate})`,
      });
      if (response.data.success) setStatus('success');
      else { setStatus('error'); Alert.alert('Error', response.data.message || 'Something went wrong.'); }
    } catch (error) {
      setStatus('error');
      Alert.alert('Error', error.response?.data?.message || 'Network error.');
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}><Text style={styles.successCheck}>✓</Text></View>
          <Text style={styles.successTitle}>WAIVER SIGNED</Text>
          <Text style={styles.successText}>Thank you. Your trial waiver has been recorded securely. Welcome to Tara Fitness!</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#E34A29" size={20} /><Text style={styles.backText}>Services</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>TRIAL <Text style={styles.highlight}>WAIVER</Text></Text>
          <Text style={styles.subtitle}>Trial Waiver and Release Form</Text>
          <View style={styles.divider} />
        </View>

        {/* Waiver text */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Physical exercise can be strenuous and subject to risk of serious injury; we urge you to obtain a physical examination from a doctor before using any exercise equipment or participating in any exercise activity.
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            You agree that by participating in physical exercise or training activities, you do so entirely at your own risk. You agree that you are voluntarily participating in these activities and assume all risks of injury, illness, or death. We are also not responsible for any loss of your personal property.
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={[styles.infoText, { color: '#FFF', fontWeight: '600' }]}>
            By checking the box below, you accept full responsibility for your own health and well-being and you acknowledge that no responsibility is assumed by the leaders of the program.
          </Text>
        </View>

        {/* Personal Info */}
        <View style={styles.inputRow}>
          <User color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Client Name *" placeholderTextColor="#666" value={formData.name} onChangeText={v => handleChange('name', v)} />
        </View>
        <View style={styles.inputRow}>
          <Mail color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Email Address *" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={v => handleChange('email', v)} />
        </View>
        <View style={styles.inputRow}>
          <Phone color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Mobile Number *" placeholderTextColor="#666" keyboardType="phone-pad" maxLength={10} value={formData.phone} onChangeText={v => handleChange('phone', v)} />
        </View>

        {/* Trial Type */}
        <Text style={styles.label}>TRIAL TYPE</Text>
        <View style={styles.optionsRow}>
          {TRIAL_OPTIONS.map(opt => (
            <TouchableOpacity key={opt} style={[styles.optionChip, formData.inquiryFor === opt && styles.optionChipActive]} onPress={() => handleChange('inquiryFor', opt)}>
              <Text style={[styles.optionText, formData.inquiryFor === opt && styles.optionTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Acknowledgment */}
        <TouchableOpacity style={styles.checkRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkText}>I have read, understood and accurately completed this form. I confirm that I am voluntarily engaging in an acceptable level of exercise and my participation involves a risk of injury.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={status === 'submitting'}>
          {status === 'submitting' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>SUBMIT WAIVER</Text>}
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
  header: { alignItems: 'center', marginBottom: 24 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#888', fontSize: 12, marginTop: 4 },
  highlight: { color: '#E34A29' },
  divider: { height: 1, width: 40, backgroundColor: '#E34A29', marginTop: 12 },
  infoBox: { backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 14 },
  infoText: { color: '#888', fontSize: 12, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', paddingHorizontal: 16, marginBottom: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', paddingVertical: 16, fontSize: 14 },
  label: { color: '#888', fontSize: 10, letterSpacing: 2, fontWeight: 'bold', marginBottom: 10, marginTop: 6 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  optionChip: { backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  optionChipActive: { backgroundColor: '#E34A29', borderColor: '#E34A29' },
  optionText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  optionTextActive: { color: '#FFF' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, marginTop: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#444', backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  checkboxChecked: { backgroundColor: '#E34A29', borderColor: '#E34A29' },
  checkmark: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  checkText: { flex: 1, color: '#A0A0A0', fontSize: 12, lineHeight: 18 },
  submitBtn: { backgroundColor: '#E34A29', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#E34A29', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(34, 197, 94, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successCheck: { color: '#4ADE80', fontSize: 40 },
  successTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  successText: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
