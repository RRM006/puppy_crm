import axios from 'axios';
import { getAccessToken } from './authService';

// Base axios instance (reuse token logic)
const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to derive scope from role
export const deriveScope = (role) => {
  if (!role) return 'self';
  const normalized = role.toLowerCase();
  if (normalized === 'ceo' || normalized === 'manager') return 'all';
  if (normalized === 'sales manager') return 'team';
  return 'self';
};

// Fetch all report datasets in one aggregated request (preferred backend route)
export const getAggregatedReports = async ({ startDate, endDate, scope }) => {
  const params = { start_date: startDate, end_date: endDate, scope };
  const { data } = await api.get('/reports', { params });
  return data;
};

// Fallback individual endpoints (in case aggregated not implemented)
export const getReportSummary = async ({ startDate, endDate, scope }) => {
  const params = { start_date: startDate, end_date: endDate, scope };
  const { data } = await api.get('/reports/summary', { params });
  return data;
};

export const getLeadsBySource = async (params) => (await api.get('/reports/leads-by-source', { params })).data;
export const getLeadsByStatus = async (params) => (await api.get('/reports/leads-by-status', { params })).data;
export const getDealsByStage = async (params) => (await api.get('/reports/deals-by-stage', { params })).data;
export const getRevenueTrend = async (params) => (await api.get('/reports/revenue-trend', { params })).data;
export const getDealsWonLost = async (params) => (await api.get('/reports/deals-won-lost', { params })).data;
export const getTopPerformers = async (params) => (await api.get('/reports/top-performers', { params })).data;
export const getRecentWonDeals = async (params) => (await api.get('/reports/recent-won-deals', { params })).data;
export const getDealsClosingThisMonth = async (params) => (await api.get('/reports/deals-closing-this-month', { params })).data;
export const getOverdueDeals = async (params) => (await api.get('/reports/overdue-deals', { params })).data;

// Utility export helpers
export const exportCSV = (rows, filename) => {
  if (!rows || rows.length === 0) return;
  const header = Object.keys(rows[0]);
  const csv = [header.join(',')]
    .concat(rows.map(r => header.map(h => JSON.stringify(r[h] ?? '')).join(',')))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPDF = async (summary, charts, tables) => {
  // Dynamic import jsPDF
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
  const doc = new jsPDF();
  let y = 12;
  doc.setFontSize(18);
  doc.text('CRM Reports', 14, y); y += 8;
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y); y += 6;
  doc.text('Summary:', 14, y); y += 6;
  Object.entries(summary || {}).forEach(([k, v]) => {
    doc.text(`${k}: ${v}`, 18, y); y += 6;
  });
  y += 4;
  tables?.forEach((table, idx) => {
    if (y > 260) { doc.addPage(); y = 12; }
    doc.text(table.title, 14, y); y += 6;
    (table.rows || []).slice(0, 20).forEach(r => {
      const line = Object.values(r).join(' | ').slice(0, 100);
      doc.text(line, 18, y); y += 6;
    });
    y += 4;
  });
  doc.save('crm_report.pdf');
};

export default {
  deriveScope,
  getAggregatedReports,
  getReportSummary,
  getLeadsBySource,
  getLeadsByStatus,
  getDealsByStage,
  getRevenueTrend,
  getDealsWonLost,
  getTopPerformers,
  getRecentWonDeals,
  getDealsClosingThisMonth,
  getOverdueDeals,
  exportCSV,
  exportPDF,
};
