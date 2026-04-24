import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { authApi } from '../api/auth';

export default function EmailScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await authApi.sendOtp(email.trim().toLowerCase());
      navigation.navigate('OTP', { email: email.trim().toLowerCase() });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>A</Text>
        </View>
        <Text style={styles.title}>Welcome to Aura</Text>
        <Text style={styles.subtitle}>Enter your email to get started</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          onSubmitEditing={handleContinue}
        />

        <Text style={styles.hint}>
          We'll send a verification code to this email.
        </Text>

        <TouchableOpacity
          style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.buttonText}>Continue</Text>
          }
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign in with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          {['Google', 'Microsoft', 'Yahoo'].map(provider => (
            <TouchableOpacity key={provider} style={styles.socialBtn} activeOpacity={0.8}>
              <Text style={styles.socialBtnText}>{provider}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoLetter: { fontSize: 34, fontWeight: '700', color: '#FFF' },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  form: { paddingHorizontal: 24 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 8 },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  hint: { fontSize: 13, color: Colors.textSecondary, marginTop: 8, marginBottom: 24 },
  button: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: Colors.textSecondary },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
});
