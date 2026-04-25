import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getApiError } from '../utils/format';
import { useChatsStore } from '../store/chatsStore';
import Avatar from '../components/Avatar';

// ── Card shown in the list ───────────────────────────────────────────────────
function TemplateCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.75}>
      <View style={styles.cardLeft}>
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{item.avatar_emoji || '👥'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description || 'AI group chat'}</Text>
          {item.members?.length > 0 && (
            <View style={styles.miniAvatars}>
              {item.members.slice(0, 4).map((m, i) => (
                <View
                  key={m.id ?? String(i)}
                  style={[styles.miniAvatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }]}
                >
                  <Avatar name={m.name} emoji={m.avatar_emoji} size={22} fontSize={9} />
                </View>
              ))}
              <Text style={styles.miniLabel}>
                {item.members.length} member{item.members.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ── Detail bottom sheet ──────────────────────────────────────────────────────
function TemplateModal({ template, visible, onClose, onCreate, creating }) {
  const insets = useSafeAreaInsets();
  if (!template) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* dim backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* drag handle */}
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.sheetHero}>
            <View style={styles.sheetEmojiCircle}>
              <Text style={styles.sheetEmoji}>{template.avatar_emoji || '👥'}</Text>
            </View>
            <Text style={styles.sheetName}>{template.name}</Text>
            {template.description ? (
              <Text style={styles.sheetDesc}>{template.description}</Text>
            ) : null}
          </View>

          {/* Members */}
          {template.members?.length > 0 && (
            <View>
              <Text style={styles.sectionLabel}>
                MEMBERS · {template.members.length}
              </Text>
              {template.members.map((m, i) => (
                <View key={m.id ?? String(i)} style={styles.memberRow}>
                  <Avatar name={m.name} emoji={m.avatar_emoji} size={44} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    {m.specialty_tags?.length > 0 && (
                      <Text style={styles.memberTags} numberOfLines={1}>
                        {m.specialty_tags.join(' · ')}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
          {template.specialty_tags?.length > 0 && (
            <View>
              <Text style={styles.sectionLabel}>TOPICS</Text>
              <View style={styles.tags}>
                {template.specialty_tags.map((tag, i) => (
                  <View key={`${tag}-${i}`} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 8 }} />
        </ScrollView>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.createBtn, creating && styles.createBtnDisabled]}
          onPress={onCreate}
          disabled={creating}
          activeOpacity={0.85}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="people" size={18} color="#FFF" />
              <Text style={styles.createBtnText}>Create This Group</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
const Separator = () => <View style={styles.separator} />;

export default function GroupTemplatesScreen({ navigation }) {
  const { groupTemplates, fetchGroupTemplates, createFromGroupTemplate } = useChatsStore();
  const [loading, setLoading] = useState(groupTemplates.length === 0);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (groupTemplates.length === 0) {
      fetchGroupTemplates().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleCreate = async () => {
    if (!selected) return;
    const templateKey = selected.template_key ?? selected.key ?? selected.id;
    if (!templateKey) {
      Alert.alert('Error', 'Could not identify this template. Please try again.');
      return;
    }
    setCreating(true);
    try {
      const chat = await createFromGroupTemplate(templateKey);
      setSelected(null);
      navigation.replace('Chat', { chat, contact: null });
    } catch (e) {
      Alert.alert('Error', getApiError(e, 'Could not create group.'));
      setCreating(false);
    }
  };

  const keyExtractor = useCallback(
    (item, index) => item.template_key ?? item.key ?? item.id ?? String(index),
    []
  );

  const renderItem = useCallback(({ item }) => (
    <TemplateCard item={item} onPress={setSelected} />
  ), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textOnPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Group Templates</Text>
          <Text style={styles.headerSub}>Ready-made AI group chats</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      ) : groupTemplates.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={72} color={Colors.textTertiary} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No templates yet</Text>
          <Text style={styles.emptySub}>Check back soon for curated group chat templates</Text>
        </View>
      ) : (
        <FlatList
          data={groupTemplates}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TemplateModal
        template={selected}
        visible={!!selected}
        onClose={() => { if (!creating) setSelected(null); }}
        onCreate={handleCreate}
        creating={creating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textOnPrimary },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  // ── states
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // ── list
  list: { paddingVertical: 8 },
  separator: { height: 0.5, backgroundColor: Colors.separator, marginLeft: 80 },

  // ── card (list row)
  card: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.background,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  emojiCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  miniAvatars: { flexDirection: 'row', alignItems: 'center' },
  miniAvatar: { borderRadius: 11, borderWidth: 1.5, borderColor: Colors.background, overflow: 'hidden' },
  miniLabel: { fontSize: 12, color: Colors.textTertiary, marginLeft: 6 },

  // ── bottom sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 20,
  },

  sheetHero: { alignItems: 'center', marginBottom: 24 },
  sheetEmojiCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  sheetEmoji: { fontSize: 40 },
  sheetName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  sheetDesc: {
    fontSize: 14, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 8,
  },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textTertiary,
    letterSpacing: 0.8, marginBottom: 10, marginTop: 4,
  },

  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, gap: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.separator,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  memberTags: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
  },
  tagText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 14, paddingVertical: 15,
    marginTop: 16,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
