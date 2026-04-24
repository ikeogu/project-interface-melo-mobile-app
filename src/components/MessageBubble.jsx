import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { formatMessageTime } from '../utils/format';

function MessageBubble({ message, senderName }) {
  const isUser = message.sender_type === 'user';

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAgent]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
        {!isUser && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        <Text style={[styles.text, isUser && styles.textUser]}>
          {message.text_content || message.transcription || ''}
        </Text>
        <View style={styles.footer}>
          {message.pending && <Text style={styles.status}>sending…</Text>}
          {message.failed && <Text style={[styles.status, styles.failed]}>failed</Text>}
          <Text style={[styles.time, isUser && styles.timeUser]}>
            {formatMessageTime(message.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default memo(MessageBubble, (prev, next) =>
  prev.message.id === next.message.id &&
  prev.message.pending === next.message.pending &&
  prev.message.failed === next.message.failed &&
  prev.senderName === next.senderName
);

const styles = StyleSheet.create({
  wrapper: { marginVertical: 2, paddingHorizontal: 12, maxWidth: '80%' },
  wrapperUser: { alignSelf: 'flex-end' },
  wrapperAgent: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleUser: { backgroundColor: Colors.bubbleUser, borderTopRightRadius: 2 },
  bubbleAgent: {
    backgroundColor: Colors.bubbleAgent,
    borderTopLeftRadius: 2,
    borderWidth: 0.5,
    borderColor: Colors.bubbleAgentBorder,
  },
  senderName: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginBottom: 2 },
  text: { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  textUser: { color: Colors.textPrimary },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3, gap: 4 },
  time: { fontSize: 11, color: Colors.textSecondary },
  timeUser: { color: Colors.textSecondary },
  status: { fontSize: 11, color: Colors.textSecondary },
  failed: { color: Colors.error },
});
