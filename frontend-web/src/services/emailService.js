import api from './api';

export async function getEmailAccounts() { const r = await api.get('/emails/accounts/'); return r.data; }
export async function connectGmail() { const r = await api.get('/emails/connect-gmail/'); return r.data; }
export async function addSMTPAccount(data) { const r = await api.post('/emails/accounts/', data); return r.data; }
export async function syncAccount(id) { const r = await api.post(`/emails/accounts/${id}/sync/`); return r.data; }
export async function getInbox(params = {}) { const r = await api.get('/emails/inbox/', { params }); return r.data; }
export async function getThread(id) { const r = await api.get(`/emails/threads/${id}/`); return r.data; }
export async function sendEmail(data) { const r = await api.post('/emails/send/', data); return r.data; }
export async function replyEmail(id, data) { const r = await api.post(`/emails/${id}/reply/`, data); return r.data; }
export async function markAsRead(threadId) { const r = await api.post(`/emails/threads/${threadId}/mark-read/`); return r.data; }
export async function starThread(threadId) { const r = await api.post(`/emails/threads/${threadId}/star/`); return r.data; }
export async function deleteEmail(id) { const r = await api.delete(`/emails/${id}/`); return r.data; }
export async function searchEmails(q) { const r = await api.get('/emails/search/', { params: { q } }); return r.data; }
