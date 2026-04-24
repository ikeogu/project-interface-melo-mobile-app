import { apiClient } from './client';

export const chatsApi = {
  getChats: () =>
    apiClient.get('/chats/'),

  createDirectChat: (contact_id) =>
    apiClient.post('/chats/direct', { contact_id }),

  createGroupChat: (name, contact_ids) =>
    apiClient.post('/chats/group', { name, contact_ids }),

  getMessages: (chat_id) =>
    apiClient.get(`/messages/${chat_id}`),

  sendMessage: (chat_id, text_content, content_type = 'text', media_url = null) =>
    apiClient.post('/messages/', { chat_id, text_content, content_type, media_url }),
};
