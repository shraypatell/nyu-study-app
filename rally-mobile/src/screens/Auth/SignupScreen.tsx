import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { GlassCard, GlassButton, GlassInput } from '../../components';
import { AnimatedGradientBackground } from '../../components/AnimatedGradientBackground';
import { colors, spacing, typography } from '../../theme/colors';

interface SignupScreenProps {
  navigation: any;
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { signUp, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();

  const validateEmail = (email: string): boolean => {
    return email.endsWith('@nyu.edu');
  };

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleSignup = async () => {
    setError('');
    setSuccess(false);
    
    if (!email || !username || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please use your NYU email (@nyu.edu)');
      return;
    }
    
    if (!validateUsername(username)) {
      setError('Username must be 3-20 characters, alphanumeric/underscore only');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    try {
      await signUp({ email, password, username });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <AnimatedGradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Join Rally</Text>
            <Text style={styles.subtitle}>Study together. Achieve more.</Text>
            
            {success ? (
              <GlassCard style={styles.form}>
                <Text style={styles.message}>
                  Check your NYU email to confirm your account!
                </Text>
                <GlassButton
                  title="Back to Login"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.button}
                />
              </GlassCard>
            ) : (
              <GlassCard style={styles.form}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                
                <GlassInput
                  placeholder="NYU Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                
                <GlassInput
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                
                <GlassInput
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
                
                <GlassButton
                  title={isLoading ? '' : 'Sign Up'}
                  onPress={handleSignup}
                  loading={isLoading}
                  style={styles.button}
                />
                
                <GlassButton
                  title="Already have an account? Log in"
                  onPress={() => navigation.navigate('Login')}
                  variant="ghost"
                  style={styles.linkButton}
                />
              </GlassCard>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.md,
    textAlign: 'center',
    color: colors.foreground,
    opacity: 0.8,
    marginBottom: spacing.xxl,
  },
  message: {
    fontSize: typography.md,
    textAlign: 'center',
    color: colors.foreground,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  form: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sm,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
  linkButton: {
    marginTop: spacing.md,
  },
});
