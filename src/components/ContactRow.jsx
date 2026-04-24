import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { Colors } from '../theme/colors';

function ContactRow({ contact, onPress, rightAction }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Avatar name={contact.name} emoji={contact.avatar_emoji} size={46} />
      <View style={styles.info}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.specialty} numberOfLines={1}>
          {contact.specialty_tags?.join(', ') || 'AI Contact'}
        </Text>
      </View>
      {rightAction || <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

// Ignore onPress/rightAction reference changes — behaviour is identical for a given contact id
export default memo(ContactRow, (prev, next) => prev.contact.id === next.contact.id);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  specialty: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.textTertiary },
});
