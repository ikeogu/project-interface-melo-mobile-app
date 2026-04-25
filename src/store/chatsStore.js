import { create } from 'zustand';
import { chatsApi } from '../api/chats';

const getMsgPreview = (msg) => {
  if (!msg) return null;
  if (msg.content_type === 'voice') return '🎙 Voice message';
  return msg.text_content || null;
};

export const useChatsStore = create((set, get) => ({
  chats: [],
  messages: {},
  groupTemplates: [],
  isLoading: false,

  fetchChats: async () => {
    set({ isLoading: true });
    try {
      const res = await chatsApi.getChats();
      set({ chats: res.data });
    } catch (e) {
      console.error('fetchChats error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (chat_id) => {
    const res = await chatsApi.getMessages(chat_id);
    const msgs = res.data;
    const lastMsg = msgs[msgs.length - 1];
    set(s => ({
      messages: { ...s.messages, [chat_id]: msgs },
      ...(lastMsg ? {
        chats: s.chats.map(c => c.id === chat_id
          ? { ...c, last_message_preview: getMsgPreview(lastMsg), last_message_is_user: lastMsg.sender_type === 'user' }
          : c
        ),
      } : {}),
    }));
    return msgs;
  },

  sendMessage: async (chat_id, text) => {
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      chat_id,
      sender_type: 'user',
      content_type: 'text',
      text_content: text,
      created_at: new Date().toISOString(),
      pending: true,
    };

    set(s => ({
      messages: {
        ...s.messages,
        [chat_id]: [...(s.messages[chat_id] || []), tempMsg],
      },
      chats: s.chats.map(c =>
        c.id === chat_id
          ? { ...c, last_message_preview: text, last_message_is_user: true }
          : c
      ),
    }));

    try {
      const res = await chatsApi.sendMessage(chat_id, text);
      const confirmedUserMsg = { ...res.data, pending: false };

      set(s => ({
        messages: {
          ...s.messages,
          [chat_id]: s.messages[chat_id].map(m =>
            m.id === tempId ? confirmedUserMsg : m
          ),
        },
        chats: s.chats.map(c =>
          c.id === chat_id
            ? { ...c, last_message_at: confirmedUserMsg.created_at, last_message_preview: confirmedUserMsg.text_content, last_message_is_user: true }
            : c
        ),
      }));

      return confirmedUserMsg;
    } catch (e) {
      set(s => ({
        messages: {
          ...s.messages,
          [chat_id]: s.messages[chat_id].map(m =>
            m.id === tempId ? { ...m, pending: false, failed: true } : m
          ),
        },
      }));
    }
  },

  appendMessage: (chat_id, message) => {
    set(s => {
      const existing = (s.messages[chat_id] || []).find(m => m.id === message.id);
      if (existing) return s;
      return {
        messages: {
          ...s.messages,
          [chat_id]: [...(s.messages[chat_id] || []), message],
        },
        chats: s.chats.map(c =>
          c.id === chat_id
            ? { ...c, last_message_at: message.created_at, last_message_preview: getMsgPreview(message), last_message_is_user: false }
            : c
        ),
      };
    });
  },

  fetchGroupTemplates: async () => {
    try {
      const res = await chatsApi.getGroupTemplates();
      set({ groupTemplates: res.data });
    } catch (e) {
      console.error('fetchGroupTemplates error:', e);
    }
  },

  createFromGroupTemplate: async (template_key) => {
    const res = await chatsApi.createFromGroupTemplate(template_key);
    set(s => ({ chats: [res.data, ...s.chats] }));
    return res.data;
  },

  createGroupChat: async (name, contact_ids, user_ids = []) => {
    const res = await chatsApi.createGroupChat(name, contact_ids, user_ids);
    set(s => ({ chats: [res.data, ...s.chats] }));
    return res.data;
  },

  inviteToChat: async (chat_id, email) => {
    await chatsApi.inviteToChat(chat_id, email);
  },

  openOrCreateChat: async (contact_id) => {
    const existing = get().chats.find(c =>
      c.chat_type === 'direct' &&
      c.participants?.some(p => p.id === contact_id && p.type === 'contact')
    );
    if (existing) return existing;

    const res = await chatsApi.createDirectChat(contact_id);
    set(s => ({ chats: [res.data, ...s.chats] }));
    return res.data;
  },
}));
