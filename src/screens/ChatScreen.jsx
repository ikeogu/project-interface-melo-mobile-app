import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard, Alert, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useChatsStore } from '../store/chatsStore';
import { useAuthStore } from '../store/authStore';
import MessageBubble from '../components/MessageBubble';
import VoiceNoteBubble from '../components/VoiceNoteBubble';
import VoiceRecorder from '../components/VoiceRecorder';
import Avatar from '../components/Avatar';
import GroupAvatar from '../components/GroupAvatar';
import { wsConnect, wsDisconnect } from '../utils/websocket';
import { voiceApi } from '../api/voice';

// Fixed waveform pattern for the recording indicator
const WAVE_HEIGHTS = [20, 28, 14, 24, 18, 26, 16, 22];
const WAVE_DURATIONS = [250, 180, 320, 210, 280, 195, 260, 230];

function formatRecordingTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ChatScreen({ route, navigation }) {
  const { chat, contact } = route.params;
  const isGroup = chat.chat_type === 'group';
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingContacts, setTypingContacts] = useState(new Set());
  const typingTimersRef = useRef(new Map());
  const [uploadingVoice, setUploadingVoice] = useState(false);

  // Recording state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const cancelRecordingRef = useRef(false);
  const recordingTimerRef = useRef(null);

  // Animated waveform bars shown in the input bar during recording
  const waveAnims = useRef(WAVE_HEIGHTS.map(() => new Animated.Value(4))).current;
  const waveLoopsRef = useRef([]);

  const flatListRef = useRef();
  const { messages, fetchMessages, sendMessage, appendMessage } = useChatsStore();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const chatMessages = messages[chat.id] || [];
  const contactName = contact?.name || chat.name || 'Chat';

  useEffect(() => {
    loadMessages();
    setupWebSocket();
    return () => wsDisconnect();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    await fetchMessages(chat.id);
    setLoading(false);
  };

  const setupWebSocket = () => {
    if (!user?.id) return;
    wsConnect(user.id, (data) => {
      if (data.type === 'message' && data.payload.chat_id === chat.id) {
        appendMessage(chat.id, data.payload);
        const cName = data.payload.meta?.contact_name || '_agent';
        clearTimeout(typingTimersRef.current.get(cName));
        typingTimersRef.current.delete(cName);
        setTypingContacts(prev => {
          const next = new Set(prev);
          next.delete(cName);
          return next;
        });
        scrollToBottom();
      }
      if (data.type === 'typing' && data.payload.chat_id === chat.id) {
        const cName = data.payload.meta?.contact_name || '_agent';
        clearTimeout(typingTimersRef.current.get(cName));
        setTypingContacts(prev => new Set([...prev, cName]));
        const timer = setTimeout(() => {
          setTypingContacts(prev => {
            const next = new Set(prev);
            next.delete(cName);
            return next;
          });
          typingTimersRef.current.delete(cName);
        }, 8000);
        typingTimersRef.current.set(cName, timer);
        scrollToBottom();
      }
    });
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // ─── Recording wave animation ────────────────────────────────────────────────

  const startWaveAnimation = () => {
    waveLoopsRef.current.forEach(l => l?.stop());
    waveLoopsRef.current = waveAnims.map((anim, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: WAVE_HEIGHTS[i],
            duration: WAVE_DURATIONS[i],
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 4,
            duration: WAVE_DURATIONS[i],
            useNativeDriver: false,
          }),
        ])
      );
      // Stagger bar starts so they animate out of sync (more natural)
      setTimeout(() => loop.start(), i * 55);
      return loop;
    });
  };

  const stopWaveAnimation = () => {
    waveLoopsRef.current.forEach(l => l?.stop());
    waveAnims.forEach(a =>
      Animated.timing(a, { toValue: 4, duration: 120, useNativeDriver: false }).start()
    );
  };

  // Called by VoiceRecorder when press starts / ends
  const handleRecordingChange = (recording) => {
    if (recording) {
      setIsVoiceRecording(true);
      setRecordingDuration(0);
      cancelRecordingRef.current = false;
      startWaveAnimation();
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setIsVoiceRecording(false);
      setRecordingDuration(0);
      stopWaveAnimation();
    }
  };

  // ─── Send handlers ───────────────────────────────────────────────────────────

  const handleSendText = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    Keyboard.dismiss();
    if (!isGroup) {
      setTypingContacts(new Set(['_agent']));
    }
    await sendMessage(chat.id, text);
    scrollToBottom();
  };

  const handleVoiceRecorded = async (localUri, duration) => {
    if (!localUri) return;
    setUploadingVoice(true);

    const tempId = `temp-voice-${Date.now()}`;
    appendMessage(chat.id, {
      id: tempId,
      chat_id: chat.id,
      sender_type: 'user',
      content_type: 'voice',
      media_url: localUri,
      text_content: null,
      created_at: new Date().toISOString(),
      pending: true,
      meta: { duration },
    });
    scrollToBottom();
    if (!isGroup) {
      setTypingContacts(new Set(['_agent']));
    }

    try {
      const sent = await voiceApi.sendVoiceNote(chat.id, localUri, duration);
      useChatsStore.setState(s => ({
        messages: {
          ...s.messages,
          [chat.id]: s.messages[chat.id].map(m =>
            m.id === tempId ? { ...sent, pending: false } : m
          ),
        },
      }));
      scrollToBottom();
    } catch (e) {
      console.error('Voice note failed:', e?.response?.status, e?.response?.data, e?.message);
      useChatsStore.setState(s => ({
        messages: {
          ...s.messages,
          [chat.id]: s.messages[chat.id].map(m =>
            m.id === tempId ? { ...m, pending: false, failed: true } : m
          ),
        },
      }));
      Alert.alert('Failed', 'Could not send voice note. Please try again.');
      setTypingContacts(new Set());
    } finally {
      setUploadingVoice(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const keyExtractor = useCallback((item) => item.id, []);

  const renderMessage = useCallback(({ item }) => {
    const isUser = item.sender_type === 'user';
    const senderName = isUser
      ? null
      : (isGroup ? (item.meta?.contact_name || contactName) : contactName);
    if (item.content_type === 'voice') {
      return <VoiceNoteBubble message={item} isUser={isUser} senderName={senderName} />;
    }
    return <MessageBubble message={item} senderName={senderName} />;
  }, [isGroup, contactName]);

  // Right-side button in the input bar
  const renderRightControl = () => {
    if (uploadingVoice) {
      return (
        <View style={styles.sendBtn}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      );
    }
    if (input.trim()) {
      return (
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendText}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      );
    }
    return (
      <VoiceRecorder
        onRecordingComplete={handleVoiceRecorded}
        onRecordingChange={handleRecordingChange}
        cancelRef={cancelRecordingRef}
        disabled={uploadingVoice}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.primary }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            {isGroup
              ? <GroupAvatar participants={chat.participants} size={38} />
              : <Avatar name={contactName} emoji={contact?.avatar_emoji} size={38} />
            }
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{contactName}</Text>
              <Text style={styles.headerStatus} numberOfLines={1}>
                {isGroup
                  ? `${chat.participants?.filter(p => p.type === 'contact').length ?? 0} members`
                  : typingContacts.size > 0 ? 'typing...' : 'Online'
                }
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('VideoCall', { contact })}
            >
              <Text style={styles.actionIcon}>□</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>☎</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              typingContacts.size > 0 ? (
                <View>
                  {[...typingContacts].map(name => (
                    <View key={name} style={styles.typingWrap}>
                      {isGroup && (
                        <Text style={styles.typingSender}>
                          {name === '_agent' ? contactName : name}
                        </Text>
                      )}
                      <View style={styles.typingBubble}>
                        <Text style={styles.typingDots}>• • •</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null
            }
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {isVoiceRecording ? (
            /* ── Recording state ── */
            <View style={styles.recordingRow}>
              <View style={styles.recDot} />
              <Text style={styles.recTimer}>{formatRecordingTime(recordingDuration)}</Text>
              <View style={styles.recWaveform}>
                {waveAnims.map((anim, i) => (
                  <Animated.View
                    key={i}
                    style={[styles.recBar, { height: anim }]}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={styles.cancelRecBtn}
                onPress={() => { cancelRecordingRef.current = true; }}
              >
                <Text style={styles.cancelRecText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Normal state ── */
            <>
              <TouchableOpacity style={styles.inputIconBtn}>
                <Text style={styles.inputIcon}>☺</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Message"
                placeholderTextColor={Colors.textTertiary}
                multiline
                maxLength={2000}
                returnKeyType="default"
                blurOnSubmit={false}
              />
              {!input.trim() && (
                <TouchableOpacity style={styles.inputIconBtn}>
                  <Text style={styles.inputIcon}>⊕</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Mic / Send / Upload — always on the right */}
          {renderRightControl()}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 8, gap: 4,
    backgroundColor: Colors.primary,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 22, color: '#FFF' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: {},
  headerName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  headerActions: { flexDirection: 'row' },
  actionBtn: { padding: 8 },
  actionIcon: { fontSize: 18, color: '#FFF' },

  // ── Messages ──
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingVertical: 12, paddingHorizontal: 4 },
  typingWrap: { paddingHorizontal: 12, paddingBottom: 4, alignSelf: 'flex-start', maxWidth: '75%' },
  typingSender: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2, marginLeft: 2 },
  typingBubble: {
    backgroundColor: Colors.bubbleAgent,
    borderRadius: 12, borderTopLeftRadius: 2,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 0.5, borderColor: Colors.bubbleAgentBorder,
  },
  typingDots: { fontSize: 16, color: Colors.textSecondary, letterSpacing: 4 },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingTop: 8,
    backgroundColor: Colors.background,
    gap: 6,
    borderTopWidth: 0.5, borderTopColor: Colors.border,
  },
  inputIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  inputIcon: { fontSize: 20, color: Colors.textSecondary },
  input: {
    flex: 1, minHeight: 36, maxHeight: 120,
    backgroundColor: Colors.background,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 15, color: Colors.textPrimary,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: 16, color: '#FFF' },

  // ── Recording bar (replaces input contents when recording) ──
  recordingRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 36,
  },
  recDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.error,
  },
  recTimer: {
    fontSize: 14, fontWeight: '600', color: Colors.error, minWidth: 38,
  },
  recWaveform: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  recBar: {
    width: 3, borderRadius: 2, backgroundColor: Colors.primary,
  },
  cancelRecBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelRecText: { fontSize: 13, color: Colors.textSecondary },
});
