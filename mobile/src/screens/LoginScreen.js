import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, Lock } from 'lucide-react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = React.useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both your Email or Apple ID and password.');
      return;
    }

    setLoading(true);
    try {
      // Connects exactly to your existing /api/auth/login endpoint
      const response = await api.post('/auth/login', { email, password });
      
      const { user, token } = response.data;
      
      // Update global AuthContext state, React Navigation handles redirect
      await login(user, token);
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid credentials or network error.';
      Alert.alert('Login Failed', msg);
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
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Welcome Back</Text>
        <Text style={styles.title}>MEMBER <Text style={styles.highlight}>LOGIN</Text></Text>
        <View style={styles.divider} />
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Mail color="#666" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email or Apple ID"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Lock color="#666" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.forgotButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>SIGN IN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerLink}>
          <Text style={styles.footerText}>New to Tara Fitness? <Text style={styles.footerLinkText}>Create an account</Text></Text>
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
    fontSize: 32,
    fontWeight: '900',
  },
  highlight: {
    color: '#E34A29', // Matching the primary color from tailwind config
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#E34A29',
    fontSize: 13,
    fontWeight: 'bold',
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
  footerLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  footerLinkText: {
    color: '#E34A29',
    fontWeight: 'bold',
  }
});
