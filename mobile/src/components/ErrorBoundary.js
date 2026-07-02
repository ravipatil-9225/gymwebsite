import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('❌ App Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconBg}>
            <AlertTriangle color="#E34A29" size={40} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app ran into an unexpected error. Please try again.
          </Text>
          {this.state.error?.message ? (
            <ScrollView style={styles.errorBox}>
              <Text style={styles.errorText}>{this.state.error.message}</Text>
            </ScrollView>
          ) : null}
          <TouchableOpacity style={styles.retryBtn} onPress={this.handleReset}>
            <RefreshCw color="#FFF" size={18} />
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconBg: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(227,74,41,0.1)',
    borderWidth: 1, borderColor: 'rgba(227,74,41,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 12, textAlign: 'center',
  },
  subtitle: {
    color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  errorBox: {
    maxHeight: 120, backgroundColor: '#111', borderRadius: 12,
    borderWidth: 1, borderColor: '#222', padding: 12, width: '100%', marginBottom: 24,
  },
  errorText: { color: '#EF4444', fontSize: 11, fontFamily: 'monospace' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E34A29', paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#E34A29', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  retryText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
});

export default ErrorBoundary;
