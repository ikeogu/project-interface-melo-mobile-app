import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getApiError } from '../utils/format';
import { useContactsStore } from '../store/contactsStore';
import { useChatsStore } from '../store/chatsStore';
import Avatar from '../components/Avatar';

export default function CreateGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [inviteEmails, setInviteEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);

  const { contacts } = useContactsStore();
  const { createGroupChat, inviteToChat } = useChatsStore();

  const canCreate = groupName.trim().length > 0 && selectedIds.size >= 2;

  const toggleContact = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (inviteEmails.includes(email)) {
      setEmailInput('');
      return;
    }
    setInviteEmails(prev => [...prev, email]);
    setEmailInput('');
  };

  const removeEmail = (email) => {
    setInviteEmails(prev => prev.filter(e => e !== email));
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      const chat = await createGroupChat(groupName.trim(), [...selectedIds]);
      // Send invites for any real-user emails
      if (inviteEmails.length > 0) {
        await Promise.all(inviteEmails.map(email => inviteToChat(chat.id, email)));
      }
      navigation.replace('Chat', { chat, contact: null });
    } catch (e) {
      Alert.alert('Error', getApiError(e, 'Could not create group chat.'));
    } finally {
      setLoading(false);
    }
  };

  const selectedContacts = contacts.filter(c => selectedIds.has(c.id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Group</Text>
          <TouchableOpacity onPress={handleCreate} disabled={!canCreate || loading}>
            {loading
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={[styles.createText, !canCreate && styles.createDisabled]}>Create</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Group name */}
          <View style={styles.nameRow}>
            <View style={styles.nameIconCircle}>
              <Text style={styles.nameIcon}>👥</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group name"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
              maxLength={60}
              returnKeyType="done"
            />
          </View>

          {/* Selected AI contact chips */}
          {selectedContacts.length > 0 && (
            <View style={styles.chips}>
              {selectedContacts.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.chip}
                  onPress={() => toggleContact(c.id)}
                >
                  <Avatar name={c.name} emoji={c.avatar_emoji} size={22} />
                  <Text style={styles.chipText}>{c.name}</Text>
                  <Text style={styles.chipRemove}>✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* AI Contacts list */}
          <Text style={styles.sectionLabel}>
            AI MEMBERS {selectedIds.size > 0 ? `· ${selectedIds.size} selected` : ''}
          </Text>

          {contacts.map(item => {
            const selected = selectedIds.has(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                onPress={() => toggleContact(item.id)}
                activeOpacity={0.7}
              >
                <Avatar name={item.name} emoji={item.avatar_emoji} size={46} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {item.specialty_tags?.join(', ') || 'AI Contact'}
                  </Text>
                </View>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}

          {contacts.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No contacts yet</Text>
              <Text style={styles.emptySub}>Add some AI contacts first</Text>
            </View>
          )}

          {/* Invite real users */}
          <Text style={styles.sectionLabel} style={[styles.sectionLabel, { marginTop: 8 }]}>
            INVITE REAL USERS (OPTIONAL)
          </Text>
          <Text style={styles.inviteHint}>
            Invite friends or colleagues by email — they'll join as real participants.
          </Text>

          {/* Email chips */}
          {inviteEmails.length > 0 && (
            <View style={styles.chips}>
              {inviteEmails.map(email => (
                <TouchableOpacity
                  key={email}
                  style={[styles.chip, styles.emailChip]}
                  onPress={() => removeEmail(email)}
                >
                  <Ionicons name="person-outline" size={14} color={Colors.primary} />
                  <Text style={styles.chipText} numberOfLines={1}>{email}</Text>
                  <Text style={styles.chipRemove}>✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Email input */}
          <View style={styles.emailRow}>
            <TextInput
              ref={emailRef}
              style={styles.emailInput}
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="Enter email address"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={addEmail}
            />
            <TouchableOpacity
              style={[styles.addEmailBtn, !emailInput.trim() && styles.addEmailBtnDisabled]}
              onPress={addEmail}
              disabled={!emailInput.trim()}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Bottom hint */}
        {selectedIds.size === 1 && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>Select at least one more AI contact to create a group</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  cancelText: { fontSize: 16, color: Colors.textSecondary },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  createText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  createDisabled: { opacity: 0.35 },

  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 12,
  },
  nameIconCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  nameIcon: { fontSize: 22 },
  nameInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },

  chips: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accentLight,
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5,
    maxWidth: 180,
  },
  emailChip: { backgroundColor: Colors.backgroundSecondary },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.primary, flexShrink: 1 },
  chipRemove: { fontSize: 11, color: Colors.primary, opacity: 0.6 },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, letterSpacing: 0.5,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: 0.5, borderBottomColor: Colors.separator,
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  rowSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },

  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
  emptySub: { fontSize: 13, color: Colors.textTertiary, marginTop: 6 },

  inviteHint: {
    fontSize: 13, color: Colors.textSecondary,
    paddingHorizontal: 16, paddingBottom: 10, lineHeight: 18,
  },

  emailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  emailInput: {
    flex: 1, height: 44,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10, paddingHorizontal: 14,
    fontSize: 15, color: Colors.textPrimary,
  },
  addEmailBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  addEmailBtnDisabled: { opacity: 0.35 },

  hint: {
    position: 'absolute', bottom: 32, left: 0, right: 0,
    alignItems: 'center',
  },
  hintText: { fontSize: 13, color: Colors.textSecondary },
});
