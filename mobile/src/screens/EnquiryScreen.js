import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { ArrowLeft, User, Mail, Phone, MessageSquare, CheckCircle } from 'lucide-react-native';
import api from '../services/api';

export default function EnquiryScreen({ navigation }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, submitting, success
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (formData.name.trim().length < 2) return setError('Full name must be at least 2 characters.');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return setError('Please enter a valid email.');

    const phoneRegex = /^[6-9]\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      return setError('Please enter a valid 10-digit mobile number.');
    }

    if (!formData.message.trim()) return setError('Please tell us about your goals.');

    setStatus('submitting');
    setError('');

    try {
      await api.post('/join', formData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus('idle');
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle color="#22C55E" size={60} />
          </View>
          <Text style={styles.successTitle}>REQUEST RECEIVED</Text>
          <Text style={styles.successText}>
            Thank you for taking the first step. Our team will reach out to you shortly.
          </Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backHomeText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ENQUIRY</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>TAKE THE FIRST STEP</Text>
          <Text style={styles.title}>JOIN TARA FITNESS</Text>
          <Text style={styles.subtitle}>
            Leave your details and we'll reach out to discuss your goals.
          </Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Full Name *', key: 'name', icon: <User color="#666" size={18} /> },
            { label: 'Email Address *', key: 'email', icon: <AtSign color="#666" size={18} />, keyboard: 'email-address' },
            { label: 'Phone Number (Optional)', key: 'phone', icon: <Phone color="#666" size={18} />, keyboard: 'phone-pad' },
          ].map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrapper}>
                {field.icon}
                <TextInput
                  style={styles.input}
                  placeholder={field.label.replace(' *', '')}
                  placeholderTextColor="#444"
                  value={formData[field.key]}
                  onChangeText={(v) => { setFormData(p => ({ ...p, [field.key]: v })); setError(''); }}
                  keyboardType={field.keyboard || 'default'}
                  autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                />
              </View>
            </View>
          ))}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fitness Goals *</Text>
            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12, height: 120 }]}>
              <MessageSquare color="#666" size={18} style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                placeholder="Tell us about your goals..."
                placeholderTextColor="#444"
                value={formData.message}
                onChangeText={(v) => { setFormData(p => ({ ...p, message: v })); setError(''); }}
                multiline
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.submitBtn, status === 'submitting' && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>SUBMIT REQUEST</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Reuse AtSign since it wasn't in the list
const AtSign = Mail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 60, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222',
  },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  scroll: { padding: 24 },
  pageHeader: { alignItems: 'center', marginBottom: 32 },
  eyebrow: { color: '#E34A29', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#888', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  form: { gap: 20 },
  inputGroup: {},
  label: { color: '#888', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#111',
    borderRadius: 12, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#222',
  },
  input: { flex: 1, color: '#FFF', fontSize: 14 },
  submitBtn: {
    backgroundColor: '#E34A29', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 10, shadowColor: '#E34A29', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },
  errorText: { color: '#EF4444', fontSize: 12, textAlign: 'center', fontWeight: '600' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(34,197,94,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  successText: { color: '#AAA', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  backHomeBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, borderWidth: 1, borderColor: '#333' },
  backHomeText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});
