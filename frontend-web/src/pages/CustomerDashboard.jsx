import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CustomerDashboardHome from '../components/dashboard/CustomerDashboardHome';

const Sidebar = ({ activeView, setActiveView, onLogout, navigate }) => {
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: '🏠' },
    { id: 'companies', label: 'My Companies', icon: '🏢' },
    { id: 'orders', label: 'Orders', icon: '📦', isRoute: true, path: '/customer-orders' },
    { id: 'complaints', label: 'Complaints', icon: '💬', badge: 'Phase 9' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div style={{ width: 260, background: '#1e293b', height: '100vh', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ padding: 24, borderBottom: '1px solid #334155' }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🐶 Puppy CRM
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Customer Portal</div>
      </div>

      {/* Menu Items */}
      <nav style={{ flex: 1, padding: 16 }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.isRoute) {
                navigate(item.path);
              } else {
                setActiveView(item.id);
              }
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: 8,
              background: activeView === item.id ? '#334155' : 'transparent',
              color: activeView === item.id ? 'white' : '#94a3b8',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (activeView !== item.id) {
                e.currentTarget.style.background = '#2d3748';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== item.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
            {item.badge && (
              <span style={{ fontSize: 10, padding: '2px 6px', background: '#475569', borderRadius: 4, color: '#cbd5e1' }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div style={{ padding: 16, borderTop: '1px solid #334155' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'transparent',
            color: '#f87171',
            border: '1px solid #374151',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 18 }}>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const TopBar = ({ user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div style={{ height: 64, background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'fixed', top: 0, left: 260, right: 0, zIndex: 10 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>Welcome back!</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Notifications */}
        <button style={{ position: 'relative', padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20 }}>
          🔔
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
        </button>

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
              {user?.first_name?.[0] || 'C'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Customer</div>
            </div>
          </button>

          {dropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 200, zIndex: 20 }}>
              <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.email}</div>
              </div>
              <button style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14 }}>
                Settings
              </button>
              <button style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14 }}>
                Help & Support
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ComingSoonView = ({ title, description, icon }) => (
  <div style={{ padding: 24 }}>
    <div style={{ background: 'white', padding: 80, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>{icon}</div>
      <h2 style={{ margin: 0, marginBottom: 8, color: '#1e293b' }}>{title}</h2>
      <p style={{ margin: 0, color: '#64748b' }}>{description}</p>
    </div>
  </div>
);

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('home');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <CustomerDashboardHome />;
      case 'companies':
        return <ComingSoonView title="My Companies" description="View and manage your linked companies" icon="🏢" />;
      case 'orders':
        return <ComingSoonView title="Orders" description="This feature will be available in Phase 5" icon="📦" />;
      case 'complaints':
        return <ComingSoonView title="Complaints" description="This feature will be available in Phase 9" icon="💬" />;
      case 'profile':
        return <ComingSoonView title="Profile Settings" description="Manage your personal information and preferences" icon="👤" />;
      default:
        return <CustomerDashboardHome />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} navigate={navigate} />
      
      <div style={{ flex: 1, marginLeft: 260 }}>
        <TopBar user={user} />
        
        <main style={{ marginTop: 64 }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;
