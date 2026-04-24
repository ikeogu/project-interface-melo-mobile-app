import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/Avatar';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { label: 'Account', icon: '👤' },
    { label: 'Privacy', icon: '🔒' },
    { label: 'Notifications', icon: '🔔' },
    { label: 'Help', icon: '❓' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Me</Text>
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <Avatar name={user?.display_name} size={72} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.display_name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Menu */}
      {menuItems.map((item, idx) => (
        <TouchableOpacity key={item.label} style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  profileInfo: { marginLeft: 16 },
  profileName: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
  profileEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  menuIcon: { fontSize: 20, width: 36 },
  menuLabel: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  menuChevron: { fontSize: 22, color: Colors.textTertiary },
  logoutBtn: {
    margin: 24,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.error },
});
