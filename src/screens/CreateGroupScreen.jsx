import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useContactsStore } from '../store/contactsStore';
import { useChatsStore } from '../store/chatsStore';
import Avatar from '../components/Avatar';

export default function CreateGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const { contacts } = useContactsStore();
  const { createGroupChat } = useChatsStore();

  const canCreate = groupName.trim().length > 0 && selectedIds.size >= 2;

  const toggleContact = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      const chat = await createGroupChat(groupName.trim(), [...selectedIds]);
      // Replace this screen with the new group chat
      navigation.replace('Chat', { chat, contact: null });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Could not create group chat.');
    } finally {
      setLoading(false);
    }
  };

  const selectedContacts = contacts.filter(c => selectedIds.has(c.id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

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

      {/* Selected chips */}
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

      {/* Contacts list */}
      <Text style={styles.sectionLabel}>
        ADD MEMBERS {selectedIds.size > 0 ? `· ${selectedIds.size} selected` : ''}
      </Text>

      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.id);
          return (
            <TouchableOpacity
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
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No contacts yet</Text>
            <Text style={styles.emptySub}>Add some AI contacts first</Text>
          </View>
        }
      />

      {/* Require 2+ hint */}
      {selectedIds.size === 1 && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Select at least one more contact to create a group</Text>
        </View>
      )}
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
  nameInput: {
    flex: 1, fontSize: 16, color: Colors.textPrimary,
  },

  chips: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accentLight,
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.primary },
  chipRemove: { fontSize: 11, color: Colors.primary, opacity: 0.6 },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, letterSpacing: 0.5,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.background,
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
  checkmark: { fontSize: 13, color: '#FFF', fontWeight: '700' },
  separator: { height: 0.5, backgroundColor: Colors.separator, marginLeft: 74 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
  emptySub: { fontSize: 13, color: Colors.textTertiary, marginTop: 6 },

  hint: {
    position: 'absolute', bottom: 32, left: 0, right: 0,
    alignItems: 'center',
  },
  hintText: { fontSize: 13, color: Colors.textSecondary },
});
