import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft } from 'lucide-react-native';
import api from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong';
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
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Account Recovery</Text>
          <Text style={styles.title}>RESET <Text style={styles.highlight}>PASSWORD</Text></Text>
          <View style={styles.divider} />
        </View>

        {!isSubmitted ? (
          <View style={styles.form}>
            <Text style={styles.description}>
              Enter the email associated with your account and we'll send you a secure link to reset your password.
            </Text>

            <View style={styles.inputContainer}>
              <Mail color="#666" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity 
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>SEND RESET LINK</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.submittedContainer}>
            <View style={styles.iconCircle}>
              <Mail color="#E34A29" size={32} />
            </View>
            <Text style={styles.submittedTitle}>Check Your Email</Text>
            <Text style={styles.submittedText}>
              We've sent a secure password reset link to {email}. It will expire in 15 minutes.
            </Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')} 
          style={styles.footerLink}
        >
          <View style={styles.backLink}>
            <ArrowLeft color="#666" size={16} style={styles.backIcon} />
            <Text style={styles.footerText}>Back to Login</Text>
          </View>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  description: {
    color: '#A0A0A0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    marginBottom: 24,
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
  submittedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(227, 74, 41, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  submittedTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  submittedText: {
    color: '#A0A0A0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: 32,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: 6,
  },
  footerText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '600',
  }
});
