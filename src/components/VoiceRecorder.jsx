import React, { useState, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Vibration, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { Colors } from '../theme/colors';

// Android's MediaRecorder throws RuntimeException if stop() is called before
// it has buffered at least one audio frame (~500ms).
const ANDROID_MIN_RECORD_MS = 600;

export default function VoiceRecorder({ onRecordingComplete, onRecordingChange, cancelRef, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);

  // Refs — used for guards because React state is async and pressOut
  // fires before pressIn's awaits finish, so state checks miss the window.
  const pressStartRef = useRef(null);      // timestamp when press began; null = idle
  const didReleaseRef = useRef(false);     // true once finger lifts
  const isRecordingActiveRef = useRef(false); // true only after record() is called

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const startPulse = () => {
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current.start();
  };

  const stopPulse = () => {
    pulseLoopRef.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  const handlePressIn = async () => {
    if (disabled || pressStartRef.current) return;

    // Set refs and UI synchronously before any awaits
    pressStartRef.current = Date.now();
    didReleaseRef.current = false;
    if (cancelRef) cancelRef.current = false;

    setIsRecording(true);
    onRecordingChange?.(true);
    startPulse();
    Vibration.vibrate(30);

    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      pressStartRef.current = null;
      setIsRecording(false);
      onRecordingChange?.(false);
      stopPulse();
      Alert.alert('Permission needed', 'Microphone access is required for voice notes.');
      return;
    }

    await audioRecorder.prepareToRecordAsync();

    // If the user released while we were setting up, bail — pressOut already
    // cleaned up the UI and will return because isRecordingActiveRef is false.
    if (didReleaseRef.current) {
      pressStartRef.current = null;
      return;
    }

    isRecordingActiveRef.current = true;
    audioRecorder.record();
  };

  const handlePressOut = async () => {
    didReleaseRef.current = true;

    const startTime = pressStartRef.current;
    if (!startTime) return; // pressIn never ran or already cleaned up
    pressStartRef.current = null;

    stopPulse();
    setIsRecording(false);
    onRecordingChange?.(false);

    const elapsed = Date.now() - startTime;
    const cancelled = cancelRef?.current ?? false;
    if (cancelRef) cancelRef.current = false;

    // record() was never reached (user released during permissions/prepare setup)
    if (!isRecordingActiveRef.current) return;
    isRecordingActiveRef.current = false;

    // Android needs to buffer at least one frame before stop() succeeds
    if (Platform.OS === 'android' && elapsed < ANDROID_MIN_RECORD_MS) {
      await new Promise(r => setTimeout(r, ANDROID_MIN_RECORD_MS - elapsed));
    }

    try {
      await audioRecorder.stop();
      if (cancelled || elapsed < 400) return; // too short — discard silently
      const uri = audioRecorder.uri;
      if (uri) {
        Vibration.vibrate(30);
        onRecordingComplete?.(uri, Math.floor(elapsed / 1000));
      }
    } catch (e) {
      console.error('Stop recording error:', e);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={[
          styles.micBtn,
          isRecording && styles.micBtnRecording,
          disabled && styles.micBtnDisabled,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        delayPressIn={0}
      >
        <Ionicons name="mic" size={24} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  micBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnRecording: { backgroundColor: Colors.error },
  micBtnDisabled: { opacity: 0.4 },
});
