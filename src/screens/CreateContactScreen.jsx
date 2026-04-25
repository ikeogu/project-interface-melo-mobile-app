import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { getApiError } from '../utils/format';
import { useContactsStore } from '../store/contactsStore';

const EMOJI_OPTIONS = ['🤖', '👨‍💼', '👩‍⚕️', '⚖️', '📊', '🧘', '✝️', '🎓', '💡', '🔬'];
const VOICE_OPTIONS = [
  { id: 'af_heart', label: 'Serene', description: 'Warm, calm' },
  { id: 'am_adam', label: 'Vibrant', description: 'Energetic, clear' },
  { id: 'bf_emma', label: 'Refined', description: 'Professional' },
  { id: 'bm_george', label: 'Deep', description: 'Authoritative' },
];

export default function CreateContactScreen({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const { createContact } = useContactsStore();

  const canCreate = name.trim() && description.trim();

  const handleCreate = async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      const contact = await createContact({
        name: name.trim(),
        personality_description: description.trim(),
        avatar_emoji: selectedEmoji,
        voice_id: selectedVoice.id,
        specialty_tags: [],
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', getApiError(e, 'Could not create contact.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Contact</Text>
        <TouchableOpacity onPress={handleCreate} disabled={!canCreate || loading}>
          {loading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={[styles.doneText, !canCreate && styles.doneDisabled]}>Done</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar picker */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{selectedEmoji}</Text>
          </View>
          <Text style={styles.sectionLabel}>Design your custom AI assistant's persona</Text>
        </View>

        {/* Emoji options */}
        <View style={styles.emojiRow}>
          {EMOJI_OPTIONS.map(emoji => (
            <TouchableOpacity
              key={emoji}
              style={[styles.emojiBtn, selectedEmoji === emoji && styles.emojiBtnSelected]}
              onPress={() => setSelectedEmoji(emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Name your contact</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Dr. Sarah"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Describe their personality and expertise</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="A warm, direct GP who gives honest health advice in plain English..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Voice selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Voice selector</Text>
          <View style={styles.voiceGrid}>
            {VOICE_OPTIONS.map(voice => (
              <TouchableOpacity
                key={voice.id}
                style={[styles.voiceCard, selectedVoice.id === voice.id && styles.voiceCardSelected]}
                onPress={() => setSelectedVoice(voice)}
              >
                <Text style={[styles.voiceLabel, selectedVoice.id === voice.id && styles.voiceLabelSelected]}>
                  {voice.label}
                </Text>
                {selectedVoice.id === voice.id && (
                  <View style={styles.voicePlayBtn}>
                    <Text style={styles.voicePlayIcon}>▶</Text>
                  </View>
                )}
                <View style={styles.voiceWave}>
                  {[3, 6, 4, 7, 5, 8, 4, 6, 3].map((h, i) => (
                    <View key={i} style={[
                      styles.wavebar,
                      { height: h * 2 },
                      selectedVoice.id === voice.id && { backgroundColor: '#FFF' }
                    ]} />
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  cancelText: { fontSize: 16, color: Colors.textSecondary },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  doneText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  doneDisabled: { opacity: 0.4 },
  scroll: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarEmoji: { fontSize: 44 },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  emojiRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginBottom: 20,
    justifyContent: 'center',
  },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiBtnSelected: { backgroundColor: Colors.primary },
  emoji: { fontSize: 22 },
  fieldGroup: { paddingHorizontal: 16, marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: Colors.textPrimary,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  voiceGrid: { flexDirection: 'row', gap: 12 },
  voiceCard: {
    flex: 1, borderRadius: 14, padding: 14,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'flex-start',
  },
  voiceCardSelected: { backgroundColor: Colors.primary },
  voiceLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  voiceLabelSelected: { color: '#FFF' },
  voicePlayBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  voicePlayIcon: { fontSize: 10, color: '#FFF', marginLeft: 2 },
  voiceWave: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  wavebar: { width: 3, borderRadius: 2, backgroundColor: Colors.textTertiary },
});
