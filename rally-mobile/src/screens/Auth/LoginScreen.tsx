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
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

const t = {
  bg: '#0B0B0E',
  surface: '#16161A',
  border: '#2A2A2E',
  text: '#FAFAF9',
  muted: '#6B6B70',
  dimmed: '#4B4B50',
  label: '#9B9B9F',
  indigo: '#6366F1',
  purple: '#8B5CF6',
};

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();

  const validateEmail = (email: string): boolean => email.endsWith('@nyu.edu');

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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={t.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoArea}>
              <Text style={styles.logo}>rally</Text>
              <Text style={styles.tagline}>Study together. Achieve more.</Text>
            </View>

            <View style={{ height: 60 }} />

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>NYU Email</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="yourname@nyu.edu"
                    placeholderTextColor={t.dimmed}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={t.dimmed}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                </View>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : <View style={{ height: 24 }} />}

            {/* Log In Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>Log In</Text>}
            </TouchableOpacity>

            <View style={{ height: 16 }} />

            {/* Sign Up Link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: t.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontFamily: 'DM Sans',
    fontSize: 48,
    fontWeight: '800',
    color: t.text,
    letterSpacing: -1.5,
  },
  tagline: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: t.muted,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: t.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: t.border,
    padding: 24,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    fontWeight: '500',
    color: t.label,
  },
  inputBox: {
    backgroundColor: t.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.border,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    color: t.text,
    padding: 0,
  },
  errorContainer: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
  },
  loginBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: t.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  loginBtnText: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '600',
    color: t.text,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  signupText: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: t.muted,
  },
  signupLink: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    fontWeight: '600',
    color: t.purple,
  },
});
