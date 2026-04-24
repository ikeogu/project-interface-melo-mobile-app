import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useChatsStore } from '../store/chatsStore';
import { useContactsStore } from '../store/contactsStore';
import ChatRow from '../components/ChatRow';
import { ChatsSkeletonList } from '../components/SkeletonRow';

export default function ChatsScreen({ navigation }) {
  const { chats, fetchChats, isLoading } = useChatsStore();
  const { contacts } = useContactsStore();

  useEffect(() => { fetchChats(); }, []);

  const handleNewChat = () => {
    Alert.alert('New Chat', null, [
      { text: 'New Direct Chat', onPress: () => navigation.navigate('NewChat') },
      { text: 'New Group Chat', onPress: () => navigation.navigate('CreateGroup') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getContact = useCallback((chat) => {
    const p = chat.participants?.find(p => p.type === 'contact');
    return contacts.find(c => c.id === p?.id);
  }, [contacts]);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(({ item }) => {
    const contact = getContact(item);
    return (
      <ChatRow
        chat={item}
        contact={contact}
        onPress={() => navigation.navigate('Chat', { chat: item, contact })}
      />
    );
  }, [getContact, navigation]);

  const sorted = [...chats].sort((a, b) =>
    new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleNewChat}>
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={15} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Chats..."
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Section label */}
      {chats.length > 0 && (
        <Text style={styles.sectionHeader}>YOUR CHATS</Text>
      )}

      {isLoading && chats.length === 0 ? (
        <ChatsSkeletonList />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchChats} tintColor={Colors.primary} />}
          ItemSeparatorComponent={ChatSeparator}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={72} color={Colors.textTertiary} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No chats yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation with an AI contact</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('NewChat')}>
                <Ionicons name="chatbubble-outline" size={16} color="#FFF" />
                <Text style={styles.emptyBtnText}>New Direct Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.emptyBtn, styles.emptyBtnOutline]} onPress={() => navigation.navigate('CreateGroup')}>
                <Ionicons name="people-outline" size={16} color={Colors.primary} />
                <Text style={styles.emptyBtnOutlineText}>New Group Chat</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Floating action button */}
      <TouchableOpacity style={styles.fab} onPress={handleNewChat} activeOpacity={0.85}>
        <Ionicons name="create-outline" size={26} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const ChatSeparator = React.memo(() => <View style={separatorStyle} />);

const separatorStyle = { height: 0.5, backgroundColor: Colors.separator, marginLeft: 82 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12, paddingHorizontal: 14, height: 40,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  sectionHeader: {
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, letterSpacing: 0.5,
  },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, color: Colors.textPrimary, fontWeight: '600', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8, lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16, paddingHorizontal: 28, paddingVertical: 13,
    backgroundColor: Colors.primary, borderRadius: 28,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  emptyBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  emptyBtnOutlineText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
