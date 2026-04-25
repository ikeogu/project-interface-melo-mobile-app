import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import GroupAvatar from './GroupAvatar';
import { Colors } from '../theme/colors';
import { formatChatTime } from '../utils/format';

function ChatRow({ chat, contact, onPress }) {
  const isGroup = chat.chat_type === 'group' || chat.chat_type === 'mixed';
  const name = chat.name || contact?.name || 'Chat';
  const lastTime = formatChatTime(chat.last_message_at);

  const preview = chat.last_message_preview;
  const isUserMsg = chat.last_message_is_user;
  let previewText;
  if (preview) {
    previewText = isUserMsg ? `You: ${preview}` : preview;
  } else if (isGroup) {
    previewText = chat.participants?.filter(p => p.type === 'contact').map(p => p.name).join(', ');
  } else {
    previewText = contact?.specialty_tags?.[0] || 'AI Contact';
  }

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {isGroup
        ? <GroupAvatar participants={chat.participants} size={52} />
        : <Avatar name={name} emoji={contact?.avatar_emoji} size={52} />
      }
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {!!lastTime && <Text style={styles.time}>{lastTime}</Text>}
        </View>
        <Text
          style={[styles.preview, isUserMsg && styles.previewUser]}
          numberOfLines={1}
        >
          {previewText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ChatRow, (prev, next) =>
  prev.chat.id === next.chat.id &&
  prev.chat.last_message_at === next.chat.last_message_at &&
  prev.chat.last_message_preview === next.chat.last_message_preview &&
  prev.chat.last_message_is_user === next.chat.last_message_is_user &&
  prev.contact?.id === next.contact?.id
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  info: { flex: 1, marginLeft: 14 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  time: { fontSize: 12, color: Colors.textSecondary },
  preview: { fontSize: 14, color: Colors.textSecondary, lineHeight: 18 },
  previewUser: { color: Colors.textTertiary },
});
