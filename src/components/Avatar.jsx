import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getInitials, getAvatarColor } from '../utils/format';

export default function Avatar({ name, size = 46, imageUrl, emoji, style }) {
  const initials = emoji || getInitials(name);
  const bg = getAvatarColor(name);
  const fontSize = size * 0.38;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, style]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.text, { fontSize }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontWeight: '600' },
});
