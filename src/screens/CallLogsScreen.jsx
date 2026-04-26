import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useCallsStore } from '../store/callsStore';
import Avatar from '../components/Avatar';
import { formatChatTime } from '../utils/format';

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDuration(secs) {
  if (!secs || secs < 1) return null;
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function subtitle(log) {
  const dur = formatDuration(log.duration_seconds);
  if (dur) return dur;
  if (log.turn_count > 0) return `${log.turn_count} turn${log.turn_count !== 1 ? 's' : ''}`;
  return 'Completed';
}

// ── Row ───────────────────────────────────────────────────────────────────────

function CallRow({ log, onCallBack }) {
  return (
    <View style={styles.row}>
      <Avatar
        name={log.contact_name}
        emoji={log.contact_avatar_emoji}
        size={48}
      />

      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {log.contact_name}
        </Text>
        <View style={styles.rowSub}>
          <Ionicons name="call-outline" size={13} color={Colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.rowSubText}>{subtitle(log)}</Text>
          <Text style={styles.rowDot}>·</Text>
          <Text style={styles.rowTime}>{formatChatTime(log.called_at)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.callBackBtn}
        onPress={() => onCallBack(log)}
        activeOpacity={0.7}
      >
        <Ionicons name="call" size={18} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const RowSeparator = () => <View style={styles.separator} />;

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CallLogsScreen({ navigation }) {
  const { callLogs, isLoading, fetchCallHistory } = useCallsStore();

  useEffect(() => { fetchCallHistory(); }, []);

  // Refresh when returning from a VoiceCall so the new entry appears
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchCallHistory);
    return unsub;
  }, [navigation]);

  const handleCallBack = useCallback((log) => {
    navigation.navigate('VoiceCall', {
      contact: {
        id: log.contact_id,
        name: log.contact_name,
        avatar_emoji: log.contact_avatar_emoji,
      },
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <CallRow log={item} onCallBack={handleCallBack} />
  ), [handleCallBack]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calls</Text>
      </View>

      <FlatList
        data={callLogs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={RowSeparator}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchCallHistory} />
        }
        contentContainerStyle={callLogs.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="call-outline" size={40} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No recent calls</Text>
              <Text style={styles.emptySub}>
                Call an AI contact and your history will appear here
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

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

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary, marginBottom: 3 },
  rowSub: { flexDirection: 'row', alignItems: 'center' },
  rowSubText: { fontSize: 13, color: Colors.textSecondary },
  rowDot: { fontSize: 13, color: Colors.textTertiary, marginHorizontal: 5 },
  rowTime: { fontSize: 13, color: Colors.textTertiary },

  callBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  separator: { height: 0.5, backgroundColor: Colors.separator, marginLeft: 76 },

  emptyContainer: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
