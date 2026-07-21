import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Phone, Mail, Lock, Calendar } from 'lucide-react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegisterScreen({ navigation }) {
  const { login } = React.useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: ''
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    const { name, phone, email, password, confirmPassword, dob } = formData;

    if (!name || name.trim().length < 2) return Alert.alert('Error', 'Full name must be at least 2 characters.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Alert.alert('Error', 'Invalid email address.');
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) return Alert.alert('Error', 'Enter a valid 10-digit Indian phone number.');
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters.');
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match.');
    if (!dob) return Alert.alert('Error', 'Date of birth is required. Format: YYYY-MM-DD'); // Simplify for now

    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, phone, email, password, dob });
      
      const { user, token } = response.data;
      
      // Update global AuthContext state, React Navigation handles redirect
      await login(user, token);
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Join The Elite</Text>
          <Text style={styles.title}>CREATE <Text style={styles.highlight}>ACCOUNT</Text></Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User color="#666" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone color="#666" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Contact Number (10 digits) *"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
            />
          </View>

          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar color="#666" size={20} style={styles.icon} />
            <Text style={[styles.input, { color: formData.dob ? '#FFF' : '#666', paddingTop: 16, paddingBottom: 16 }]}>
              {formData.dob || "DOB (YYYY-MM-DD) *"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal transparent={true} animationType="slide">
                <View style={styles.modalOverlayPicker}>
                  <View style={styles.modalContentPicker}>
                    <View style={styles.modalHeaderPicker}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.modalDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={formData.dob ? new Date(formData.dob) : new Date()}
                      mode="date"
                      display="spinner"
                      textColor="white"
                      maximumDate={new Date()}
                      onChange={(event, date) => {
                        if (date) {
                          handleChange('dob', date.toISOString().split('T')[0]);
                        }
                      }}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={formData.dob ? new Date(formData.dob) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    handleChange('dob', date.toISOString().split('T')[0]);
                  }
                }}
              />
            )
          )}

          <View style={styles.inputContainer}>
            <Mail color="#666" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color="#666" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor="#666"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color="#666" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#666"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
            />
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
            <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLinkText}>Sign in</Text></Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  eyebrow: {
    color: '#A0A0A0',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  highlight: {
    color: '#E34A29', 
  },
  divider: {
    height: 1,
    width: 60,
    backgroundColor: '#E34A29',
    marginTop: 16,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFF',
    paddingVertical: 16,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#E34A29',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#E34A29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footerLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLinkText: {
    color: '#E34A29',
    fontWeight: 'bold',
  },
  modalOverlayPicker: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContentPicker: {
    backgroundColor: '#151515',
    padding: 16,
    paddingBottom: 30,
  },
  modalHeaderPicker: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  modalDoneText: {
    color: '#E34A29',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
