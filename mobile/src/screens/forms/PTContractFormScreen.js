import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { User, Mail, ChevronLeft } from 'lucide-react-native';
import api from '../../services/api';

export default function PTContractFormScreen({ navigation }) {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    type: 'pt-contract', name: '', email: '',
    clientDate: today, parentDate: today, witnessDate: today,
  });
  const [status, setStatus] = useState('idle');
  const [agreed, setAgreed] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      return Alert.alert('Error', 'Please fill in your name and email.');
    }
    if (!agreed) {
      return Alert.alert('Error', 'Please agree to the terms by checking the acknowledgment box.');
    }
    setStatus('submitting');
    try {
      const response = await api.post('/forms', {
        type: formData.type, name: formData.name, email: formData.email,
        message: `Client Signed: Yes (${formData.clientDate}) | Parent Signed: N/A (${formData.parentDate}) | Witness Signed: N/A (${formData.witnessDate})`,
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
          <Text style={styles.successTitle}>CONTRACT SECURED</Text>
          <Text style={styles.successText}>Your Personal Training contract has been received. Your trainer will reach out to begin your first phase.</Text>
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
          <Text style={styles.title}>PT <Text style={styles.highlight}>CONTRACT</Text></Text>
          <Text style={styles.subtitle}>Personal Training Contract</Text>
          <View style={styles.divider} />
        </View>

        {/* Contract text */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Congratulations on your decision to participate in an exercise program! With the help of your personal trainer, you greatly improve your ability to accomplish your training goals faster, safer, and with maximum benefits.
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTextBold}>Terms & Conditions:</Text>
          <Text style={styles.infoText}>{'\n'}1. All sessions must be fully paid prior to session date.</Text>
          <Text style={styles.infoText}>{'\n'}2. Sessions not cancelled 24 hours in advance will be forfeited.</Text>
          <Text style={styles.infoText}>{'\n'}3. Clients arriving late will receive the remaining scheduled session time.</Text>
          <Text style={styles.infoText}>{'\n'}4. Expiration policy:{'\n'}   • 8 sessions — 60 days{'\n'}   • 12 sessions — 90 days{'\n'}   • 24 sessions — 150 days{'\n'}   • Managed Programming — 30 days</Text>
          <Text style={styles.infoText}>{'\n'}5. No refunds will be issued for any reason.</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTextBold}>Online Training Conditions:</Text>
          <Text style={styles.infoText}>{'\n'}1. Online cancellations subject to the same 24-hour rule.</Text>
          <Text style={styles.infoText}>{'\n'}2. If only one person attends partner training, they are still booked at the partner rate.</Text>
          <Text style={styles.infoText}>{'\n'}3. Same terms apply as above.</Text>
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

        {/* Acknowledgment */}
        <TouchableOpacity style={styles.checkRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkText}>I have read, understood and accept full responsibility for my health and well-being. I acknowledge the terms above and agree to the contract.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={status === 'submitting'}>
          {status === 'submitting' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>SUBMIT CONTRACT</Text>}
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
  infoTextBold: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', paddingHorizontal: 16, marginBottom: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', paddingVertical: 16, fontSize: 14 },
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
