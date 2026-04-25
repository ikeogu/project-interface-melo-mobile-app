import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useContactsStore } from '../store/contactsStore';
import { useChatsStore } from '../store/chatsStore';
import Avatar from '../components/Avatar';

export default function NewChatScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const { contacts } = useContactsStore();
  const { openOrCreateChat } = useChatsStore();

  const filtered = query.trim()
    ? contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : contacts;

  const handleSelect = async (contact) => {
    if (loadingId) return;
    setLoadingId(contact.id);
    try {
      const chat = await openOrCreateChat(contact.id);
      navigation.replace('Chat', { chat, contact });
    } catch (e) {
      console.error('openOrCreateChat error:', e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>
        <View style={{ width: 56 }} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search contacts..."
          placeholderTextColor={Colors.textTertiary}
          autoFocus
          returnKeyType="search"
        />
      </View>

      <Text style={styles.sectionLabel}>SELECT A CONTACT</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item, index) => item.id ?? String(index)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
            disabled={!!loadingId}
          >
            <Avatar name={item.name} emoji={item.avatar_emoji} size={46} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {item.specialty_tags?.join(', ') || 'AI Contact'}
              </Text>
            </View>
            {loadingId === item.id
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : null
            }
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={NewChatSeparator}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {query ? 'No contacts found' : 'No contacts yet'}
            </Text>
            <Text style={styles.emptySub}>Add contacts from the Contacts tab</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const newChatSeparatorStyle = { height: 0.5, backgroundColor: '#EEEEEE', marginLeft: 74 };
const NewChatSeparator = () => <View style={newChatSeparatorStyle} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  cancelText: { fontSize: 16, color: Colors.textSecondary, width: 56 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  searchWrap: {
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12, paddingHorizontal: 14, height: 40, justifyContent: 'center',
  },
  searchInput: { fontSize: 15, color: Colors.textPrimary },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    paddingHorizontal: 16, paddingBottom: 6, letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  rowSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  separator: { height: 0.5, backgroundColor: Colors.separator, marginLeft: 74 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
  emptySub: { fontSize: 13, color: Colors.textTertiary, marginTop: 6 },
});
