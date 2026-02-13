import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { signIn, isLoading } = useAuthStore();

  const validateEmail = (email: string): boolean => {
    return email.endsWith('@nyu.edu');
  };

  const handleLogin = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please use your NYU email (@nyu.edu)');
      return;
    }
    
    try {
      await signIn({ email, password });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Rally</Text>
          <Text style={styles.subtitle}>Study together. Achieve more.</Text>
          
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <TextInput
              style={styles.input}
              placeholder="NYU Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
            
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Signup')}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>
                Don't have an account? Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 48,
  },
  form: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
});
