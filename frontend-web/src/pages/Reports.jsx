import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import reportService, {
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
} from '../services/reportService';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
  FunnelChart, Funnel, LabelList,
  ResponsiveContainer,
} from 'recharts';
import './Reports.css'; // optional stylesheet if needed

const COLORS = ['#4c6fff', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ef4444'];

export default function Reports() {
  const { userRole } = useAuth();
  const scope = deriveScope(userRole);

  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const defaultEnd = today.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});
  const [leadsBySource, setLeadsBySource] = useState([]);
  const [leadsByStatus, setLeadsByStatus] = useState([]);
  const [dealsByStage, setDealsByStage] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [dealsWonLost, setDealsWonLost] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentWonDeals, setRecentWonDeals] = useState([]);
  const [closingThisMonth, setClosingThisMonth] = useState([]);
  const [overdueDeals, setOverdueDeals] = useState([]);
  const [useAggregated, setUseAggregated] = useState(true);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, scope]);

  const params = useMemo(() => ({ startDate, endDate, scope }), [startDate, endDate, scope]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      if (useAggregated) {
        const data = await getAggregatedReports(params);
        // Expect backend aggregated structure, fallback if keys absent
        setSummary(data.summary || {});
        setLeadsBySource(data.leads_by_source || []);
        setLeadsByStatus(data.leads_by_status || []);
        setDealsByStage(data.deals_by_stage || []);
        setRevenueTrend(data.revenue_trend || []);
        setDealsWonLost(data.deals_won_lost || []);
        setTopPerformers(data.top_performers || []);
        setRecentWonDeals(data.recent_won_deals || []);
        setClosingThisMonth(data.deals_closing_this_month || []);
        setOverdueDeals(data.overdue_deals || []);
      } else {
        const baseParams = { start_date: startDate, end_date: endDate, scope };
        const [summaryData, src, status, stage, rev, wonLost, top, recent, closing, overdue] = await Promise.all([
          getReportSummary(baseParams),
          getLeadsBySource(baseParams),
          getLeadsByStatus(baseParams),
          getDealsByStage(baseParams),
          getRevenueTrend(baseParams),
          getDealsWonLost(baseParams),
          getTopPerformers(baseParams),
          getRecentWonDeals(baseParams),
          getDealsClosingThisMonth(baseParams),
          getOverdueDeals(baseParams),
        ]);
        setSummary(summaryData || {});
        setLeadsBySource(src || []);
        setLeadsByStatus(status || []);
        setDealsByStage(stage || []);
        setRevenueTrend(rev || []);
        setDealsWonLost(wonLost || []);
        setTopPerformers(top || []);
        setRecentWonDeals(recent || []);
        setClosingThisMonth(closing || []);
        setOverdueDeals(overdue || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load reports');
      // fallback to individual endpoints if aggregated fails first time
      if (useAggregated) {
        setUseAggregated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportCSV(recentWonDeals, 'recent_won_deals');
    exportCSV(closingThisMonth, 'deals_closing_this_month');
    exportCSV(overdueDeals, 'overdue_deals');
  };

  const handleExportPDF = () => {
    exportPDF(summary, { /* charts placeholder */ }, [
      { title: 'Recent Won Deals', rows: recentWonDeals },
      { title: 'Deals Closing This Month', rows: closingThisMonth },
      { title: 'Overdue Deals', rows: overdueDeals },
    ]);
  };

  const overviewCards = [
    { label: 'Total Leads', value: summary.total_leads ?? 0 },
    { label: 'Total Deals Value', value: `$${(summary.total_deals_value ?? 0).toLocaleString()}` },
    { label: 'Win Rate', value: `${summary.win_rate ?? 0}%` },
    { label: 'Average Deal Size', value: `$${(summary.average_deal_size ?? 0).toLocaleString()}` },
  ];

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="scope-note">Scope: <strong>{scope}</strong> (role: {userRole || 'N/A'})</p>
        </div>
        <div className="date-range">
          <label>
            Start
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </label>
          <label>
            End
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </label>
          <button className="btn" onClick={loadReports} disabled={loading}>Refresh</button>
          <button className="btn" onClick={handleExportCSV}>Export CSV</button>
          <button className="btn primary" onClick={handleExportPDF}>Export PDF</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading">Loading reports...</div>}

      {/* Overview */}
      <div className="overview-grid">
        {overviewCards.map(card => (
          <div key={card.label} className="overview-card">
            <div className="overview-label">{card.label}</div>
            <div className="overview-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-box">
          <h3>Leads by Source</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={leadsBySource} dataKey="count" nameKey="source" outerRadius={90} label>
                {leadsBySource.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Leads by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={leadsByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4c6fff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Deals by Stage</h3>
          <ResponsiveContainer width="100%" height={260}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="count" data={dealsByStage} nameKey="stage">
                <LabelList position="right" fill="#000" stroke="none" dataKey="stage" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Deals Won vs Lost</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dealsWonLost}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Top Performers</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topPerformers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="deals_closed" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="tables-section">
        <div className="table-box">
          <h3>Recent Won Deals</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Value</th>
                <th>Won Date</th>
              </tr>
            </thead>
            <tbody>
              {recentWonDeals.map(d => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>${(d.value ?? 0).toLocaleString()}</td>
                  <td>{d.won_date || '-'}</td>
                </tr>
              ))}
              {recentWonDeals.length === 0 && (
                <tr><td colSpan={3} className="empty">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-box">
          <h3>Deals Closing This Month</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Value</th>
                <th>Expected Close</th>
              </tr>
            </thead>
            <tbody>
              {closingThisMonth.map(d => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>${(d.value ?? 0).toLocaleString()}</td>
                  <td>{d.expected_close_date || '-'}</td>
                </tr>
              ))}
              {closingThisMonth.length === 0 && (
                <tr><td colSpan={3} className="empty">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-box">
          <h3>Overdue Deals</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Value</th>
                <th>Expected Close</th>
              </tr>
            </thead>
            <tbody>
              {overdueDeals.map(d => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>${(d.value ?? 0).toLocaleString()}</td>
                  <td>{d.expected_close_date || '-'}</td>
                </tr>
              ))}
              {overdueDeals.length === 0 && (
                <tr><td colSpan={3} className="empty">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
