import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, RefreshControl, SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useContactsStore } from '../store/contactsStore';
import { useChatsStore } from '../store/chatsStore';
import ContactRow from '../components/ContactRow';
import { ContactsSkeletonList } from '../components/SkeletonRow';

export default function ContactsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const { contacts, templates, fetchContacts, addFromTemplate, isLoading } = useContactsStore();
  const { openOrCreateChat } = useChatsStore();

  useEffect(() => { fetchContacts(); }, []);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleContactPress = useCallback(async (contact) => {
    const chat = await openOrCreateChat(contact.id);
    navigation.navigate('Chat', { chat, contact });
  }, [openOrCreateChat, navigation]);

  const handleAddTemplate = useCallback(async (template) => {
    await addFromTemplate(template.id);
  }, [addFromTemplate]);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(({ item, section }) => {
    const isTemplate = section.title.includes('TEMPLATES');
    return (
      <ContactRow
        contact={item}
        onPress={isTemplate ? null : () => handleContactPress(item)}
        rightAction={isTemplate ? (
          <TouchableOpacity
            style={styles.addTemplateBtn}
            onPress={() => handleAddTemplate(item)}
          >
            <Text style={styles.addTemplateBtnText}>+ Add</Text>
          </TouchableOpacity>
        ) : null}
      />
    );
  }, [handleContactPress, handleAddTemplate]);

  const sections = [
    { title: 'YOUR CONTACTS', data: filtered },
    { title: 'TEMPLATES — TAP TO ADD', data: templates },
  ].filter(s => s.data.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateContact')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={15} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search contacts..."
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* List — skeletons on first load, real data after */}
      {isLoading && contacts.length === 0 ? (
        <ContactsSkeletonList />
      ) : contacts.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No contacts yet</Text>
          <Text style={styles.emptySubtext}>Tap + to create your first AI contact</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchContacts} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ContactSeparator}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const contactSeparatorStyle = { height: 0.5, backgroundColor: Colors.separator, marginLeft: 74 };
const ContactSeparator = React.memo(() => <View style={contactSeparatorStyle} />);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12, paddingHorizontal: 14, height: 40,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    letterSpacing: 0.5,
    backgroundColor: Colors.background,
  },
  addTemplateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.accent,
  },
  addTemplateBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
  emptySubtext: { fontSize: 13, color: Colors.textTertiary, marginTop: 6 },
});
