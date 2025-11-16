import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getCompanyStats } from '../../services/companyService.js';
// If recharts is installed, we can import and render a simple chart
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const StatCard = ({ title, value, subtitle, icon }) => (
  <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 34, fontWeight: 700, color: '#4c6fff', marginTop: 8 }}>{value}</div>
    {subtitle && <div style={{ color: '#718096', fontSize: 14, marginTop: 6 }}>{subtitle}</div>}
  </div>
);

const DashboardHome = ({ onQuickAction }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_members: 0,
    active_members: 0,
    roles: {},
    departments: {},
    recent_members: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCompanyStats();
        setStats(data);
      } catch (e) {
        console.error('Failed to load stats', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = Object.entries(stats.roles || {}).map(([k, v]) => ({ role: k, count: v }));

  return (
    <div>
      <div style={{ background: '#f7fafc', padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Welcome, {user?.first_name} {user?.last_name}</h2>
        <div style={{ color: '#718096', marginTop: 8 }}>Here’s what’s happening with your company today.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard title="Total Team Members" value={stats.total_members || 0} subtitle={`Active: ${stats.active_members || 0}`} icon="👥" />
        <StatCard title="Active Deals" value={0} subtitle="Phase 4" icon="💼" />
        <StatCard title="Total Leads" value={0} subtitle="Phase 4" icon="📊" />
        <StatCard title="Total Customers" value={0} subtitle="Phase 5" icon="🧑‍💼" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 24 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0 }}>Team by Role</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4c6fff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4c6fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4c6fff" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => onQuickAction?.('invite')} className="btn-primary">Invite Team Member</button>
            <button onClick={() => onQuickAction?.('addLead')} className="btn-outline">Add Lead</button>
            <button onClick={() => onQuickAction?.('addDeal')} className="btn-outline">Add Deal</button>
            <button onClick={() => onQuickAction?.('reports')} className="btn-outline">View Reports</button>
          </div>
        </div>

        <div style={{ background: 'white', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>No recent activity yet — this is a placeholder.</li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>Invites, deals, and lead updates will appear here.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
