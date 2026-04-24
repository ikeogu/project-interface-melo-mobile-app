import { apiClient } from './client';

export const contactsApi = {
  getMyContacts: () =>
    apiClient.get('/contacts/'),

  getTemplates: () =>
    apiClient.get('/contacts/templates'),

  addTemplate: (template_id) =>
    apiClient.post('/contacts/add-template', { template_id }),

  createContact: (data) =>
    apiClient.post('/contacts/', data),

  deleteContact: (id) =>
    apiClient.delete(`/contacts/${id}`),

  getContact: (id) =>
    apiClient.get(`/contacts/${id}`),
};
