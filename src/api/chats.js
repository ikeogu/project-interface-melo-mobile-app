import { apiClient } from './client';

export const chatsApi = {
  getChats: () =>
    apiClient.get('/chats/'),

  createDirectChat: (contact_id) =>
    apiClient.post('/chats/direct', { contact_id }),

  createGroupChat: (name, contact_ids, user_ids = []) =>
    apiClient.post('/chats/group', { name, contact_ids, ...(user_ids.length ? { user_ids } : {}) }),

  getMessages: (chat_id) =>
    apiClient.get(`/messages/${chat_id}`),

  sendMessage: (chat_id, text_content, content_type = 'text', media_url = null) =>
    apiClient.post('/messages/', { chat_id, text_content, content_type, media_url }),

  // Phase 2 — group templates
  getGroupTemplates: () =>
    apiClient.get('/chats/group-templates'),

  createFromGroupTemplate: (template_key) =>
    apiClient.post('/chats/from-group-template', { template_key }),

  // Phase 2 — mixed groups
  inviteToChat: (chat_id, email) =>
    apiClient.post(`/chats/${chat_id}/invite`, { email }),
};
