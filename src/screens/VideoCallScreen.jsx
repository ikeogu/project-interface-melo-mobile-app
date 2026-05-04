import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { callsApi } from '../api/calls';
import { Colors } from '../theme/colors';

export default function VideoCallScreen({ route, navigation }) {
  const { contact } = route.params;
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState('loading'); // loading | active | error
  const [conversationUrl, setConversationUrl] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const webviewRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callsApi.startVideoCall(contact.id);
        if (cancelled) return;
        setConversationUrl(res.data.conversation_url);
        setConversationId(res.data.conversation_id);
        setPhase('active');
      } catch (err) {
        if (cancelled) return;
        const detail = err?.response?.data?.detail || 'Could not start video call.';
        setErrorMsg(detail);
        setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [contact.id]);

  const handleEndCall = async () => {
    if (conversationId) {
      callsApi.endVideoCall(conversationId).catch(() => {});
    }
    navigation.goBack();
  };

  const handleWebViewError = () => {
    Alert.alert('Connection error', 'Lost connection to the video call.', [
      { text: 'End Call', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Loading state */}
      {phase === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Connecting to {contact?.name}…</Text>
        </View>
      )}

      {/* Error state */}
      {phase === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.endBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.endBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active call — Tavus CVI in WebView */}
      {phase === 'active' && conversationUrl && (
        <WebView
          ref={webviewRef}
          source={{ uri: conversationUrl }}
          style={styles.webview}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          onError={handleWebViewError}
          onHttpError={handleWebViewError}
        />
      )}

      {/* End call button — always visible */}
      {phase !== 'loading' && (
        <View style={[styles.endCallBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.endBtn} onPress={handleEndCall}>
            <Text style={styles.endBtnText}>End Call</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A' },
  webview: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  loadingText: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 16 },
  errorText: { color: '#FF6B6B', fontSize: 15, textAlign: 'center' },
  endCallBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  endBtn: {
    width: 120,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
