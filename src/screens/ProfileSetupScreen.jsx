import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuthStore();

  const handleDone = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await authApi.completeProfile(name.trim());
      updateUser(res.data);
      // Auth state triggers navigation automatically
    } catch (e) {
      Alert.alert('Error', 'Could not save profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {name ? name[0].toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>How should your contacts address you?</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={Colors.textTertiary}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleDone}
        />

        <TouchableOpacity
          style={[styles.button, (!name.trim() || loading) && styles.buttonDisabled]}
          onPress={handleDone}
          disabled={!name.trim() || loading}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.buttonText}>Get started</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarText: { fontSize: 40, fontWeight: '700', color: '#FFF' },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
