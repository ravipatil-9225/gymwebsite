import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { ArrowLeft, MessageSquare, CheckCircle, Star } from 'lucide-react-native';
import api from '../services/api';

export default function FeedbackScreen({ navigation }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '', rating: 5 });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.name.trim()) return setError('Please enter your name.');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return setError('Please enter a valid email.');

    if (!formData.message.trim()) return setError('Please share your thoughts.');

    setStatus('submitting');
    setError('');

    try {
      await api.post('/forms', { ...formData, type: 'feedback' });
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '', rating: 5 });
    } catch (err) {
      setStatus('idle');
      setError(err.response?.data?.message || 'Something went wrong.');
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle color="#22C55E" size={60} />
          </View>
          <Text style={styles.successTitle}>THANK YOU!</Text>
          <Text style={styles.successText}>
            We value your feedback. It helps us improve Tara Fitness for everyone.
          </Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backHomeText}>DONE</Text>
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
        <Text style={styles.headerTitle}>FEEDBACK</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>YOUR VOICE MATTERS</Text>
          <Text style={styles.title}>SHARE FEEDBACK</Text>
          <Text style={styles.subtitle}>
            Tell us about your experience or give us suggestions.
          </Text>
        </View>

        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Rate your experience</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setFormData(p => ({ ...p, rating: s }))}>
                <Star 
                  size={32} 
                  color={s <= formData.rating ? '#F59E0B' : '#333'} 
                  fill={s <= formData.rating ? '#F59E0B' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#444"
                value={formData.name}
                onChangeText={(v) => { setFormData(p => ({ ...p, name: v })); setError(''); }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#444"
                value={formData.email}
                onChangeText={(v) => { setFormData(p => ({ ...p, email: v })); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone (Optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor="#444"
                value={formData.phone}
                onChangeText={(v) => { setFormData(p => ({ ...p, phone: v })); setError(''); }}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Suggestion / Feedback *</Text>
            <View style={[styles.inputWrapper, { height: 120, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput
                style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                placeholder="Tell us what's on your mind..."
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
            {status === 'submitting' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>SEND FEEDBACK</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  ratingSection: { alignItems: 'center', marginBottom: 32 },
  ratingLabel: { color: '#888', fontSize: 12, fontWeight: '700', marginBottom: 16 },
  stars: { flexDirection: 'row', gap: 12 },
  form: { gap: 20 },
  inputGroup: {},
  label: { color: '#888', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  inputWrapper: {
    backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#222',
    justifyContent: 'center',
  },
  input: { color: '#FFF', fontSize: 14 },
  submitBtn: {
    backgroundColor: '#E34A29', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 10,
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
