import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, StatusBar, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// LiveKit native modules are not available in Expo Go — guarded at runtime
let Room, RoomEvent, AudioSession;
try {
  ({ Room, RoomEvent } = require('livekit-client'));
  ({ AudioSession } = require('@livekit/react-native'));
} catch {}
import Avatar from '../components/Avatar';
import { callsApi } from '../api/calls';

export default function VoiceCallScreen({ route, navigation }) {
  const { contact } = route.params;
  const insets = useSafeAreaInsets();

  const [callStatus, setCallStatus] = useState('connecting'); // connecting | active | ended
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  const liveKitAvailable = !!Room;
  const roomRef = useRef(liveKitAvailable ? new Room() : null);
  const durationRef = useRef(null);

  // Pulse ring animations
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  // Connect to LiveKit room
  useEffect(() => {
    if (!liveKitAvailable) {
      setErrorMsg('Voice calls require a full EAS build.\nNot available in Expo Go.');
      setCallStatus('ended');
      return;
    }

    let cancelled = false;

    const connect = async () => {
      try {
        const res = await callsApi.startVoiceCall(contact.id);
        const { token, livekit_url } = res.data;

        if (cancelled) return;

        const room = roomRef.current;

        room.on(RoomEvent.Connected, () => {
          if (!cancelled) setCallStatus('active');
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled && callStatus !== 'ended') {
            setCallStatus('ended');
            setTimeout(() => navigation.goBack(), 600);
          }
        });

        await AudioSession.startAudioSession();
        await room.connect(livekit_url, token, { autoSubscribe: true });
        await room.localParticipant.setMicrophoneEnabled(true);

        // Default to speaker output
        if (Platform.OS === 'ios') {
          await AudioSession.selectAudioOutput('force_speaker');
        } else {
          await AudioSession.selectAudioOutput('speaker');
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[VoiceCall] connect error:', e);
          setErrorMsg('Could not start the call. Please try again.');
          setCallStatus('ended');
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
      AudioSession?.stopAudioSession().catch(() => {});
    };
  }, []);

  // Duration timer
  useEffect(() => {
    if (callStatus === 'active') {
      durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(durationRef.current);
  }, [callStatus]);

  // Pulse ring loop
  useEffect(() => {
    const makePulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const l1 = makePulse(ring1, 0);
    const l2 = makePulse(ring2, 600);
    const l3 = makePulse(ring3, 1200);
    l1.start(); l2.start(); l3.start();

    return () => { l1.stop(); l2.stop(); l3.stop(); };
  }, []);

  const handleMute = async () => {
    const next = !isMuted;
    try {
      await roomRef.current?.localParticipant.setMicrophoneEnabled(!next);
      setIsMuted(next);
    } catch (e) {
      console.warn('[VoiceCall] mute error:', e);
    }
  };

  const handleSpeaker = async () => {
    const next = !isSpeaker;
    try {
      if (Platform.OS === 'ios') {
        await AudioSession?.selectAudioOutput(next ? 'force_speaker' : 'default');
      } else {
        await AudioSession?.selectAudioOutput(next ? 'speaker' : 'earpiece');
      }
      setIsSpeaker(next);
    } catch (e) {
      console.warn('[VoiceCall] speaker error:', e);
    }
  };

  const handleEndCall = async () => {
    setCallStatus('ended');
    clearInterval(durationRef.current);
    try {
      await roomRef.current?.disconnect();
      await AudioSession?.stopAudioSession();
    } catch {}
    setTimeout(() => navigation.goBack(), 600);
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const ringStyle = (anim) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.35, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Back / minimise chevron */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-down" size={28} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      {/* Centre */}
      <View style={styles.center}>
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.ring, ringStyle(ring3)]} />
          <Animated.View style={[styles.ring, ringStyle(ring2)]} />
          <Animated.View style={[styles.ring, ringStyle(ring1)]} />
          <View style={styles.avatarWrap}>
            <Avatar
              name={contact?.name}
              emoji={contact?.avatar_emoji}
              size={110}
              fontSize={44}
            />
          </View>
        </View>

        <Text style={styles.contactName}>{contact?.name || 'Contact'}</Text>

        <View style={styles.statusRow}>
          {callStatus === 'active' && <View style={styles.activeDot} />}
          <Text style={[styles.statusText, !!errorMsg && styles.statusError]}>
            {callStatus === 'connecting' ? 'Connecting...'
              : callStatus === 'ended' ? (errorMsg || 'Call ended')
              : formatDuration(duration)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 28) }]}>

        {/* Mute */}
        <View style={styles.controlCol}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={handleMute}
            disabled={callStatus !== 'active'}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={26}
              color="#FFF"
            />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </View>

        {/* End call */}
        <View style={styles.controlCol}>
          <TouchableOpacity
            style={styles.endBtn}
            onPress={handleEndCall}
            activeOpacity={0.85}
          >
            <Ionicons
              name="call"
              size={30}
              color="#FFF"
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>End</Text>
        </View>

        {/* Speaker */}
        <View style={styles.controlCol}>
          <TouchableOpacity
            style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
            onPress={handleSpeaker}
            disabled={callStatus !== 'active'}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isSpeaker ? 'volume-high' : 'volume-mute'}
              size={26}
              color="#FFF"
            />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>{isSpeaker ? 'Speaker' : 'Earpiece'}</Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3D2E',
    alignItems: 'center',
  },

  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  ringWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: '#25D366',
    backgroundColor: 'rgba(37,211,102,0.08)',
  },
  avatarWrap: {
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },

  contactName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#25D366',
  },
  statusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statusError: {
    fontSize: 14,
    color: 'rgba(255,160,160,0.9)',
    lineHeight: 20,
  },

  controls: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 40,
    paddingHorizontal: 32,
    paddingTop: 28,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  controlCol: {
    alignItems: 'center',
    gap: 10,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(37,211,102,0.35)',
  },
  controlLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  endBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
});
