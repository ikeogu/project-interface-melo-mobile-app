import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function OTPScreen({ route, navigation }) {
  const { email } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef([]);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const t = setInterval(() => {
      setResendTimer(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (val, idx) => {
    const newCode = [...code];
    newCode[idx] = val.slice(-1);
    setCode(newCode);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const fullCode = code.join('');

  const handleVerify = async () => {
    if (fullCode.length < 6) return;
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, fullCode);
      const { access_token, user, is_new_user, is_profile_complete } = res.data;
      await setAuth(access_token, user);

      if (is_new_user && !is_profile_complete) {
        navigation.replace('ProfileSetup');
      }
      // Main app loads automatically via auth state
    } catch (e) {
      Alert.alert('Invalid code', e.response?.data?.detail || 'Please check the code and try again.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await authApi.sendOtp(email);
      setResendTimer(30);
      Alert.alert('Sent', 'A new code has been sent to your email.');
    } catch {}
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={r => inputs.current[idx] = r}
              style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
              value={digit}
              onChangeText={v => handleChange(v, idx)}
              onKeyPress={e => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={idx === 0}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, (fullCode.length < 6 || loading) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={fullCode.length < 6 || loading}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.buttonText}>Verify</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
          <Text style={[styles.resend, resendTimer > 0 && styles.resendDisabled]}>
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  back: { paddingTop: 60, paddingLeft: 20, paddingBottom: 10 },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  email: { fontWeight: '600', color: Colors.textPrimary },
  codeRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundSecondary,
  },
  codeInputFilled: { borderColor: Colors.primary, backgroundColor: Colors.background },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  resend: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  resendDisabled: { color: Colors.textTertiary },
});
