import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { User, Mail, Phone, ChevronLeft } from 'lucide-react-native';
import api from '../../services/api';

const QUESTIONS = [
  { id: 'q1', text: 'Has your doctor ever said you have a heart condition and that you should only do physical activity recommended by a doctor?' },
  { id: 'q2', text: 'Do you feel pain in your chest when you do physical activity?' },
  { id: 'q3', text: 'In the past month, have you had a chest pain when you were not doing physical activity?' },
  { id: 'q4', text: 'Do you lose balance because of dizziness or do you ever lose consciousness?' },
  { id: 'q5', text: 'Do you have a bone or joint problem that could be made worse by a change in your physical activity?' },
  { id: 'q6', text: 'Is your doctor currently prescribing medication for your blood pressure or heart condition?' },
  { id: 'q7', text: 'Do you know of any other reason why you should not take part in physical activity?' },
];

const INQUIRY_OPTIONS = ['General Gym Use', 'Personal Training', 'Group Classes'];

export default function ParQFormScreen({ navigation }) {
  const [formData, setFormData] = useState({
    type: 'par-q', name: '', dob: '', email: '', phone: '', inquiryFor: '',
    q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', comment: ''
  });
  const [status, setStatus] = useState('idle');

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.dob || !formData.inquiryFor) {
      return Alert.alert('Error', 'Please fill in all personal detail fields.');
    }
    const unanswered = QUESTIONS.find(q => !formData[q.id]);
    if (unanswered) return Alert.alert('Error', 'Please answer all health questions.');

    setStatus('submitting');
    try {
      const message = `DOB: ${formData.dob} | Inquiry For: ${formData.inquiryFor} | Q1:${formData.q1} | Q2:${formData.q2} | Q3:${formData.q3} | Q4:${formData.q4} | Q5:${formData.q5} | Q6:${formData.q6} | Q7:${formData.q7} | Comments: ${formData.comment}`;
      const response = await api.post('/forms', { type: formData.type, name: formData.name, email: formData.email, phone: formData.phone, message });
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
          <Text style={styles.successTitle}>PAR-Q SUBMITTED</Text>
          <Text style={styles.successText}>Thank you for completing your Physical Activity Readiness Questionnaire. Our team will review your responses.</Text>
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
          <Text style={styles.title}>PAR-Q <Text style={styles.highlight}>FORM</Text></Text>
          <Text style={styles.subtitle}>Physical Activity Readiness Questionnaire</Text>
          <View style={styles.divider} />
        </View>

        {/* Personal Info */}
        <View style={styles.inputRow}>
          <User color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Full Name *" placeholderTextColor="#666" value={formData.name} onChangeText={v => handleChange('name', v)} />
        </View>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, { paddingLeft: 0 }]} placeholder="Date of Birth (YYYY-MM-DD) *" placeholderTextColor="#666" value={formData.dob} onChangeText={v => handleChange('dob', v)} />
        </View>
        <View style={styles.inputRow}>
          <Mail color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Email *" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={v => handleChange('email', v)} />
        </View>
        <View style={styles.inputRow}>
          <Phone color="#666" size={18} style={styles.icon} />
          <TextInput style={styles.input} placeholder="Mobile Number *" placeholderTextColor="#666" keyboardType="phone-pad" maxLength={10} value={formData.phone} onChangeText={v => handleChange('phone', v)} />
        </View>

        {/* Inquiry For */}
        <Text style={styles.label}>INQUIRY FOR</Text>
        <View style={styles.optionsRow}>
          {INQUIRY_OPTIONS.map(opt => (
            <TouchableOpacity key={opt} style={[styles.optionChip, formData.inquiryFor === opt && styles.optionChipActive]} onPress={() => handleChange('inquiryFor', opt)}>
              <Text style={[styles.optionText, formData.inquiryFor === opt && styles.optionTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Please read each question carefully and answer honestly by selecting YES or NO.</Text>
        </View>

        {/* Questions */}
        {QUESTIONS.map(q => (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionText}>{q.text}</Text>
            <View style={styles.radioRow}>
              <TouchableOpacity style={[styles.radioBtn, formData[q.id] === 'Yes' && styles.radioBtnActive]} onPress={() => handleChange(q.id, 'Yes')}>
                <Text style={[styles.radioText, formData[q.id] === 'Yes' && styles.radioTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.radioBtn, formData[q.id] === 'No' && styles.radioBtnActiveNo]} onPress={() => handleChange(q.id, 'No')}>
                <Text style={[styles.radioText, formData[q.id] === 'No' && styles.radioTextActive]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Comment */}
        <Text style={styles.label}>IF YES, PLEASE COMMENT</Text>
        <TextInput style={styles.textArea} placeholder="Additional comments..." placeholderTextColor="#666"
          multiline numberOfLines={3} textAlignVertical="top" value={formData.comment} onChangeText={v => handleChange('comment', v)} />

        {/* Info boxes */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTextBold}>If you answered YES to one or more questions:</Text>
          <Text style={styles.infoText}>You should consult with your doctor to clarify that it's safe for you to become physically active.</Text>
        </View>
        <View style={[styles.infoBox, { marginTop: 10 }]}>
          <Text style={styles.infoTextBold}>If you answered NO to ALL questions:</Text>
          <Text style={styles.infoText}>It is reasonably safe for you to participate in physical activity.</Text>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={status === 'submitting'}>
          {status === 'submitting' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>SUBMIT PAR-Q</Text>}
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
  title: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#888', fontSize: 12, marginTop: 4 },
  highlight: { color: '#E34A29' },
  divider: { height: 1, width: 40, backgroundColor: '#E34A29', marginTop: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', paddingHorizontal: 16, marginBottom: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', paddingVertical: 16, fontSize: 14 },
  label: { color: '#888', fontSize: 10, letterSpacing: 2, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  optionChip: { backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  optionChipActive: { backgroundColor: '#E34A29', borderColor: '#E34A29' },
  optionText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  optionTextActive: { color: '#FFF' },
  infoBox: { backgroundColor: '#111', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 16 },
  infoText: { color: '#888', fontSize: 12, lineHeight: 18 },
  infoTextBold: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  questionCard: { backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 10 },
  questionText: { color: '#ccc', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  radioRow: { flexDirection: 'row', gap: 12 },
  radioBtn: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#333', backgroundColor: '#0a0a0a' },
  radioBtnActive: { backgroundColor: '#E34A29', borderColor: '#E34A29' },
  radioBtnActiveNo: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  radioText: { color: '#888', fontWeight: 'bold', fontSize: 13 },
  radioTextActive: { color: '#FFF' },
  textArea: { backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', color: '#FFF', padding: 16, fontSize: 14, minHeight: 80, marginBottom: 20 },
  submitBtn: { backgroundColor: '#E34A29', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#E34A29', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(34, 197, 94, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successCheck: { color: '#4ADE80', fontSize: 40 },
  successTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  successText: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
