import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar,
} from 'react-native';
import { Colors } from '../theme/colors';
import Avatar from '../components/Avatar';

const { width, height } = Dimensions.get('window');

export default function VideoCallScreen({ route, navigation }) {
  const { contact } = route.params;
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting | active | ended

  useEffect(() => {
    // Simulate connecting
    const connectTimer = setTimeout(() => setCallStatus('active'), 1500);

    // Duration counter
    let durationTimer;
    if (callStatus === 'active') {
      durationTimer = setInterval(() => setCallDuration(d => d + 1), 1000);
    }

    return () => {
      clearTimeout(connectTimer);
      clearInterval(durationTimer);
    };
  }, [callStatus]);

  useEffect(() => {
    let t;
    if (callStatus === 'connecting') {
      t = setTimeout(() => setCallStatus('active'), 1500);
    }
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let t;
    if (callStatus === 'active') {
      t = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(t);
  }, [callStatus]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => navigation.goBack(), 800);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* AI Avatar — full screen background */}
      <View style={styles.avatarBackground}>
        <Avatar name={contact?.name} emoji={contact?.avatar_emoji} size={160} />
      </View>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.callInfo}>
          <Text style={styles.contactName}>{contact?.name || 'Contact'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, callStatus === 'active' && styles.statusDotActive]} />
            <Text style={styles.statusText}>
              {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}
            </Text>
          </View>
        </View>
      </View>

      {/* User self-view (picture-in-picture) */}
      <View style={styles.selfView}>
        <View style={styles.selfViewInner}>
          <Text style={styles.selfViewText}>You</Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎙'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
          onPress={() => setIsCameraOff(!isCameraOff)}
        >
          <Text style={styles.controlIcon}>{isCameraOff ? '📷' : '🎥'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A' },
  avatarBackground: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A3A2A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 24, color: '#FFF', lineHeight: 30 },
  callInfo: {},
  contactName: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#888' },
  statusDotActive: { backgroundColor: '#4CAF50' },
  statusText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  selfView: {
    position: 'absolute',
    bottom: 130,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  selfViewInner: {
    flex: 1,
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfViewText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  controlIcon: { fontSize: 24 },
  endBtn: {
    width: 80, height: 60, borderRadius: 30,
    backgroundColor: '#E53935',
    alignItems: 'center', justifyContent: 'center',
  },
  endBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
