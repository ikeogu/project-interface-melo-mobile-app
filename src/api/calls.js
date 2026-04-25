import { apiClient } from './client';

export const callsApi = {
  startVoiceCall: (contact_id) =>
    apiClient.post(`/calls/voice/${contact_id}`),

  startVideoCall: (contact_id) =>
    apiClient.post(`/calls/video/${contact_id}`),
};
