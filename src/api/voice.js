import * as SecureStore from 'expo-secure-store';
import { apiClient } from './client';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ||
  'https://project-interface-melo-backend-production.up.railway.app';

export const voiceApi = {

  uploadVoiceNote: async (localUri) => {
    // Android can produce .m4a or .mp4 depending on device/OS version.
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'm4a';
    const mimeType = ext === 'mp4' ? 'audio/mp4' : `audio/${ext}`;

    console.log('[Voice] Uploading:', localUri, 'mime:', mimeType);

    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: `voice_${Date.now()}.${ext}`,
      type: mimeType,
    });

    // Use fetch, not Axios — React Native's fetch sets the multipart boundary
    // correctly; Axios with a default JSON Content-Type corrupts it.
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) throw new Error('No auth token — please sign in again.');

    const response = await fetch(`${BASE_URL}/api/v1/voice/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[Voice] Upload failed:', response.status, body);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Voice] Upload succeeded:', data.url);
    return data.url;
  },

  sendVoiceNote: async (chat_id, localUri, duration) => {
    const url = await voiceApi.uploadVoiceNote(localUri);

    const res = await apiClient.post('/messages/', {
      chat_id,
      content_type: 'voice',
      media_url: url,
      text_content: null,
      meta: duration ? { duration } : undefined,
    });

    return res.data;
  },
};
