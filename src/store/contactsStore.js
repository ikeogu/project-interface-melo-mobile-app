import { create } from 'zustand';
import { contactsApi } from '../api/contacts';

export const useContactsStore = create((set, get) => ({
  contacts: [],
  templates: [],
  isLoading: false,

  fetchContacts: async () => {
    set({ isLoading: true });
    try {
      const [contactsRes, templatesRes] = await Promise.all([
        contactsApi.getMyContacts(),
        contactsApi.getTemplates(),
      ]);
      const myIds = new Set(contactsRes.data.map(c => c.id));
      set({
        contacts: contactsRes.data,
        templates: templatesRes.data.filter(t => !myIds.has(t.id)),
      });
    } catch (e) {
      console.error('fetchContacts error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addFromTemplate: async (template_id) => {
    const res = await contactsApi.addTemplate(template_id);
    set(s => ({
      contacts: [...s.contacts, res.data],
      templates: s.templates.filter(t => t.id !== template_id),
    }));
    return res.data;
  },

  createContact: async (data) => {
    const res = await contactsApi.createContact(data);
    set(s => ({ contacts: [...s.contacts, res.data] }));
    return res.data;
  },

  deleteContact: async (id) => {
    await contactsApi.deleteContact(id);
    set(s => ({ contacts: s.contacts.filter(c => c.id !== id) }));
  },
}));
