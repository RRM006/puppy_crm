import api from './api';

export async function getTemplates(params={}) { const r = await api.get('/emails/templates/', { params }); return r.data; }
export async function createTemplate(data) { const r = await api.post('/emails/templates/', data); return r.data; }
export async function updateTemplate(id, data) { const r = await api.put(`/emails/templates/${id}/`, data); return r.data; }
export async function deleteTemplate(id) { const r = await api.delete(`/emails/templates/${id}/`); return r.data; }
export async function previewTemplate(id, data) { const r = await api.post(`/emails/templates/${id}/preview/`, data); return r.data; }
export async function duplicateTemplate(id) { const r = await api.post(`/emails/templates/${id}/duplicate/`); return r.data; }
