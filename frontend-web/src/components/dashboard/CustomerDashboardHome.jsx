import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCustomerProfile, getLinkedCompanies } from '../../services/customerService';
import Skeleton from '../common/Skeleton';

const StatCard = ({ icon, label, value, sublabel, color = '#4c6fff' }) => (
  <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 'bold', color, marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#94a3b8' }}>{sublabel}</div>
  </div>
);

const QuickActionButton = ({ icon, label, onClick, gradient = 'linear-gradient(135deg, #4c6fff 0%, #667eea 100%)' }) => (
  <button
    onClick={onClick}
    style={{
      padding: '16px 20px',
      background: gradient,
      color: 'white',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      transition: 'transform 0.2s',
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span>{label}</span>
  </button>
);

const ActivityItem = ({ icon, title, description, time }) => (
  <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ fontSize: 24, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#64748b' }}>{description}</div>
    </div>
    <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{time}</div>
  </div>
);

const CustomerDashboardHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, companiesData] = await Promise.all([
          getCustomerProfile(),
          getLinkedCompanies(),
        ]);
        setProfile(profileData);
        setCompanies(companiesData.companies || []);
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton height={48} style={{ marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <Skeleton height={140} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      </div>
    );
  }

  const firstName = user?.first_name || profile?.first_name || 'Customer';

  return (
    <div style={{ padding: 24 }}>
      {/* Welcome Section */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 32, borderRadius: 16, marginBottom: 24, color: 'white' }}>
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 28 }}>Welcome back, {firstName}! 👋</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Here's what's happening with your account today.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard
          icon="🏢"
          label="Linked Companies"
          value={companies.length}
          sublabel="Connected businesses"
          color="#4c6fff"
        />
        <StatCard
          icon="📦"
          label="Total Orders"
          value="0"
          sublabel="Coming in Phase 5"
          color="#10b981"
        />
        <StatCard
          icon="💬"
          label="Active Complaints"
          value="0"
          sublabel="Coming in Phase 9"
          color="#f59e0b"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <h3 style={{ margin: 0, marginBottom: 16 }}>🚀 Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <QuickActionButton
            icon="🔗"
            label="Link to Company"
            onClick={() => alert('Link to Company feature coming soon')}
            gradient="linear-gradient(135deg, #4c6fff 0%, #667eea 100%)"
          />
          <QuickActionButton
            icon="📦"
            label="View Orders"
            onClick={() => alert('Orders feature coming in Phase 5')}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          />
          <QuickActionButton
            icon="📝"
            label="File Complaint"
            onClick={() => alert('Complaints feature coming in Phase 9')}
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: 0, marginBottom: 16 }}>📋 Recent Activity</h3>
        {companies.length > 0 ? (
          <div>
            {companies.slice(0, 5).map((company, idx) => (
              <ActivityItem
                key={idx}
                icon="🏢"
                title={`Connected to ${company.name || 'Company'}`}
                description={`You are now linked to this company`}
                time={new Date(company.linked_at || Date.now()).toLocaleDateString()}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ margin: 0 }}>No recent activity yet. Start by linking to a company!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboardHome;
