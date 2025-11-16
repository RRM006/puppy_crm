import api from './api';
import { deriveScope } from './scopeUtil';

// Scope util fallback if not provided
export const getScopeForRole = (role) => deriveScope ? deriveScope(role) : (role === 'ceo' || role === 'manager') ? 'all' : role === 'sales_manager' ? 'team' : 'self';

const baseParams = (startDate, endDate, scope) => ({ start_date: startDate, end_date: endDate, scope });

export const getSummary = async (startDate, endDate, scope) => (await api.get('/reports/summary', { params: baseParams(startDate, endDate, scope) })).data;
export const getLeadsBySource = async (startDate, endDate, scope) => (await api.get('/reports/leads-by-source', { params: baseParams(startDate, endDate, scope) })).data;
export const getLeadsByStatus = async (startDate, endDate, scope) => (await api.get('/reports/leads-by-status', { params: baseParams(startDate, endDate, scope) })).data;
export const getDealsByStage = async (startDate, endDate, scope) => (await api.get('/reports/deals-by-stage', { params: baseParams(startDate, endDate, scope) })).data;
export const getRevenueTrend = async (startDate, endDate, scope) => (await api.get('/reports/revenue-trend', { params: baseParams(startDate, endDate, scope) })).data;
export const getDealsWonLost = async (startDate, endDate, scope) => (await api.get('/reports/deals-won-lost', { params: baseParams(startDate, endDate, scope) })).data;
export const getTopPerformers = async (startDate, endDate, scope) => (await api.get('/reports/top-performers', { params: baseParams(startDate, endDate, scope) })).data;
export const getRecentWonDeals = async (startDate, endDate, scope) => (await api.get('/reports/recent-won-deals', { params: baseParams(startDate, endDate, scope) })).data;
export const getDealsClosingThisMonth = async (startDate, endDate, scope) => (await api.get('/reports/deals-closing-this-month', { params: baseParams(startDate, endDate, scope) })).data;
export const getOverdueDeals = async (startDate, endDate, scope) => (await api.get('/reports/overdue-deals', { params: baseParams(startDate, endDate, scope) })).data;

export default {
  getScopeForRole,
  getSummary,
  getLeadsBySource,
  getLeadsByStatus,
  getDealsByStage,
  getRevenueTrend,
  getDealsWonLost,
  getTopPerformers,
  getRecentWonDeals,
  getDealsClosingThisMonth,
  getOverdueDeals,
};
