import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Basic mobile email service mapping to backend endpoints.
// Assumes token stored under 'authToken'. Adjust if different.
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://127.0.0.1:8000/api/emails';

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchThreads = async (params = {}) => {
  const res = await client.get('/inbox/', { params });
  return res.data; // Expect list of threads
};

export const fetchThread = async (id) => {
  const res = await client.get(`/threads/${id}/`);
  return res.data;
};

export const markThreadRead = async (id) => client.post(`/threads/${id}/mark-read/`);
export const toggleStar = async (id) => client.post(`/threads/${id}/star/`);
export const sendEmail = async (payload) => {
  const res = await client.post('/send/', payload);
  return res.data;
};
export const replyEmail = async (emailId, payload) => {
  const res = await client.post(`/emails/${emailId}/reply/`, payload);
  return res.data;
};
export const suggestReply = async (emailId) => {
  const res = await client.post(`/emails/${emailId}/suggest-reply/`);
  return res.data;
};
export const fetchCategories = async () => {
  const res = await client.get('/categories/');
  return res.data;
};
export const searchEmails = async (q) => {
  const res = await client.get('/search/', { params: { q } });
  return res.data;
};
export const fetchTemplates = async (params={}) => {
  const res = await client.get('/templates/', { params });
  return res.data;
};
export const previewTemplate = async (payload) => {
  const res = await client.post('/templates/preview/', payload);
  return res.data;
};
export const duplicateTemplate = async (id) => {
  const res = await client.post(`/templates/${id}/duplicate/`);
  return res.data;
};
export const fetchAccounts = async () => {
  const res = await client.get('/accounts/');
  return res.data;
};
export const syncAccount = async (id) => client.post(`/accounts/${id}/sync/`);
export const setDefaultAccount = async (id) => client.post(`/accounts/${id}/set-default/`);

export default {
  fetchThreads,
  fetchThread,
  markThreadRead,
  toggleStar,
  sendEmail,
  replyEmail,
  suggestReply,
  fetchCategories,
  searchEmails,
  fetchTemplates,
  previewTemplate,
  duplicateTemplate,
  fetchAccounts,
  syncAccount,
  setDefaultAccount,
};