import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Colors } from '../theme/colors';

// Deterministic waveform bars based on message id seed
const BAR_HEIGHTS = [6, 14, 9, 18, 11, 22, 15, 8, 20, 12, 17, 7, 16, 21, 10, 18, 13, 19, 8, 15, 11, 20, 9, 17, 14, 6, 18, 12];

function getBars(seed, count = 28) {
  return Array.from({ length: count }, (_, i) => BAR_HEIGHTS[(i + seed) % BAR_HEIGHTS.length]);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (Math.floor(secs) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatMsgTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function VoiceNoteBubble({ message, isUser, senderName }) {
  const seed = message.id?.charCodeAt(0) ?? 0;
  const bars = getBars(seed);

  const player = useAudioPlayer(message.media_url ? { uri: message.media_url } : null);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status?.playing ?? false;
  const isLoading = !!message.media_url && status == null;
  const positionSecs = status?.currentTime ?? 0;
  const durationSecs = status?.duration ?? message.meta?.duration ?? 0;
  const progress = durationSecs > 0 ? positionSecs / durationSecs : 0;

  const accentColor = isUser ? Colors.primaryDark : Colors.primary;
  const mutedColor = isUser ? 'rgba(0,0,0,0.2)' : Colors.backgroundTertiary;

  const handlePlayPause = () => {
    if (!message.media_url || isLoading) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAgent]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>

        {!isUser && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}

        <View style={styles.playerRow}>
          {/* Play / Pause button */}
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: accentColor }]}
            onPress={handlePlayPause}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            )}
          </TouchableOpacity>

          {/* Waveform + time */}
          <View style={styles.waveWrap}>
            <View style={styles.waveform}>
              {bars.map((h, i) => {
                const played = i / bars.length <= progress;
                return (
                  <View
                    key={i}
                    style={[
                      styles.bar,
                      { height: h, backgroundColor: played ? accentColor : mutedColor },
                    ]}
                  />
                );
              })}
            </View>
            <Text style={[styles.duration, { color: Colors.textSecondary }]}>
              {isPlaying ? formatTime(positionSecs) : formatTime(durationSecs)}
            </Text>
          </View>
        </View>

        {/* Transcription (Whisper text from agent voice notes) */}
        {!!message.transcription && (
          <Text style={styles.transcription}>{message.transcription}</Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {message.pending && <Text style={styles.status}>sending…</Text>}
          {message.failed && <Text style={[styles.status, styles.failed]}>failed</Text>}
          <Text style={styles.time}>{formatMsgTime(message.created_at)}</Text>
          {isUser && <Text style={styles.tick}>✓✓</Text>}
        </View>
      </View>
    </View>
  );
}

export default memo(VoiceNoteBubble, (prev, next) =>
  prev.message.id === next.message.id &&
  prev.message.pending === next.message.pending &&
  prev.message.failed === next.message.failed &&
  prev.message.media_url === next.message.media_url &&
  prev.senderName === next.senderName
);

const styles = StyleSheet.create({
  wrapper: { marginVertical: 2, paddingHorizontal: 8, maxWidth: '82%' },
  wrapperUser: { alignSelf: 'flex-end' },
  wrapperAgent: { alignSelf: 'flex-start' },

  bubble: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 10 },
  bubbleUser: { backgroundColor: Colors.bubbleUser, borderTopRightRadius: 2 },
  bubbleAgent: {
    backgroundColor: Colors.bubbleAgent,
    borderTopLeftRadius: 2,
    borderWidth: 0.5,
    borderColor: Colors.bubbleAgentBorder,
  },

  senderName: {
    fontSize: 12, fontWeight: '600',
    color: Colors.primary, marginBottom: 6,
  },

  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 200,
  },
  playBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { fontSize: 14, color: '#FFF', marginLeft: 2 },

  waveWrap: { flex: 1, gap: 4 },
  waveform: {
    flexDirection: 'row', alignItems: 'center',
    gap: 2.5, height: 30,
  },
  bar: { width: 3, borderRadius: 2 },
  duration: { fontSize: 11 },

  transcription: {
    fontSize: 13, color: Colors.textSecondary,
    marginTop: 8, fontStyle: 'italic', lineHeight: 18,
  },

  footer: {
    flexDirection: 'row', justifyContent: 'flex-end',
    alignItems: 'center', gap: 4, marginTop: 6,
  },
  time: { fontSize: 11, color: Colors.textSecondary },
  tick: { fontSize: 11, color: Colors.primary },
  status: { fontSize: 11, color: Colors.textSecondary },
  failed: { color: Colors.error },
});
