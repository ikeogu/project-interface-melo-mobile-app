import React from 'react';
import { View, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { Colors } from '../theme/colors';

// Shows two overlapping mini-circles (front = first contact, back = second).
// For 1 contact falls back to a regular Avatar.
export default function GroupAvatar({ participants, size = 50 }) {
  const contacts = (participants ?? []).filter(p => p.type === 'contact');

  if (contacts.length === 0) {
    return <Avatar name="Group" size={size} />;
  }
  if (contacts.length === 1) {
    return <Avatar name={contacts[0].name} emoji={contacts[0].avatar_emoji} size={size} />;
  }

  const mini = Math.round(size * 0.68);

  return (
    <View style={{ width: size, height: size }}>
      {/* Back circle — bottom-left, rendered first (behind) */}
      <View style={[styles.back, { bottom: 0, left: 0 }]}>
        <Avatar
          name={contacts[1].name}
          emoji={contacts[1].avatar_emoji}
          size={mini}
        />
      </View>

      {/* Front circle — top-right, white border to separate from back */}
      <View style={[
        styles.front,
        { top: 0, right: 0, borderRadius: mini / 2 + 2 },
      ]}>
        <Avatar
          name={contacts[0].name}
          emoji={contacts[0].avatar_emoji}
          size={mini}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute' },
  front: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.background,
  },
});
