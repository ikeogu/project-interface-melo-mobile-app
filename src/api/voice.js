import * as SecureStore from 'expo-secure-store';
import { apiClient } from './client';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ||
  'https://project-interface-melo-backend-production.up.railway.app';

export const voiceApi = {

  uploadVoiceNote: async (localUri) => {
    // Derive extension + MIME type from the actual file URI.
    // Android can produce .m4a or .mp4 depending on device / OS version.
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'm4a';
    const mimeType = ext === 'mp4' ? 'audio/mp4' : `audio/${ext}`;

    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: `voice_${Date.now()}.${ext}`,
      type: mimeType,
    });

    // Use fetch instead of Axios for the file upload.
    // React Native's native fetch sets the multipart/form-data boundary
    // automatically and correctly — Axios can mangle it when an instance-level
    // Content-Type: application/json default is present.
    const token = await SecureStore.getItemAsync('access_token');
    const response = await fetch(`${BASE_URL}/api/v1/voice/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type — fetch sets it with the correct boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('Upload failed:', response.status, body);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Upload succeeded, url:', data.url);
    return data.url;
  },

  sendVoiceNote: async (chat_id, localUri, duration) => {
    const url = await voiceApi.uploadVoiceNote(localUri);

    const res = await apiClient.post('/messages/', {
      chat_id,
      content_type: 'voice',
      media_url: url,
      text_content: null,
    });

    return res.data;
  },
};
