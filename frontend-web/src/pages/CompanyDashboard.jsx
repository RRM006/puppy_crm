import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PermissionGate from '../components/common/PermissionGate.jsx';
import DashboardHome from '../components/dashboard/DashboardHome.jsx';
import { FiHome, FiUsers, FiBarChart2, FiCalendar, FiSettings, FiLogOut, FiBell, FiMenu, FiShoppingCart } from 'react-icons/fi';
import TeamView from '../components/team/TeamView.jsx';
import InviteModal from '../components/team/InviteModal.jsx';
import SettingsView from '../components/settings/SettingsView.jsx';
import Toast from '../components/common/Toast.jsx';
import Leads from './Leads.jsx';
import Deals from './Deals.jsx';
import PipelineSettings from './PipelineSettings.jsx';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { user, company, userRole, logout } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [settingsTab, setSettingsTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [teamRefreshKey, setTeamRefreshKey] = useState(0);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = 'info', timeout = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((t) => [...t, { id, message, type, timeout }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter(x => x.id !== id));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menu = useMemo(() => ([
    { key: 'dashboard', label: 'Dashboard', icon: <FiHome />, roles: ['ceo', 'manager', 'sales_manager', 'support_staff'] },
    { key: 'leads', label: 'Leads', icon: <FiBarChart2 />, roles: ['ceo', 'manager', 'sales_manager'] },
    { key: 'deals', label: 'Deals', icon: <FiBarChart2 />, roles: ['ceo', 'manager', 'sales_manager'] },
    { key: 'customers', label: 'Customers', icon: <FiUsers />, roles: ['ceo', 'manager', 'support_staff'], isRoute: true, path: '/customers' },
    { key: 'orders', label: 'Orders', icon: <FiShoppingCart />, roles: ['ceo', 'manager', 'support_staff'], isRoute: true, path: '/orders' },
    { key: 'email-inbox', label: 'Email Inbox', icon: <FiBarChart2 />, roles: ['ceo', 'manager', 'sales_manager', 'support_staff'], isRoute: true, path: '/email-inbox' },
    { key: 'email-templates', label: 'Email Templates', icon: <FiSettings />, roles: ['ceo'], isRoute: true, path: '/email-templates' },
    { key: 'team', label: 'Team', icon: <FiUsers />, roles: ['ceo', 'manager'] },
    { key: 'calendar', label: 'Calendar', icon: <FiCalendar />, roles: ['ceo', 'manager', 'sales_manager', 'support_staff'] },
    { key: 'settings', label: 'Settings', icon: <FiSettings />, roles: ['ceo'] },
  ]), []);

  const renderContent = () => {
    switch (active) {
      case 'dashboard':
        return <DashboardHome onQuickAction={(a) => {
          if (a === 'invite') {
            setActive('team');
            setShowInvite(true);
          }
        }} />;
      case 'leads':
        return <Leads />;
      case 'deals':
        return <Deals />;
      case 'team':
        return <TeamView onInviteClick={() => setShowInvite(true)} refreshKey={teamRefreshKey} />;
      case 'settings':
        return (
          <div>
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
              <button
                onClick={() => setSettingsTab('profile')}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: settingsTab === 'profile' ? '2px solid #4c6fff' : '2px solid transparent',
                  color: settingsTab === 'profile' ? '#4c6fff' : '#64748b',
                  fontWeight: 500
                }}
              >
                Company Profile
              </button>
              <button
                onClick={() => setSettingsTab('pipelines')}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: settingsTab === 'pipelines' ? '2px solid #4c6fff' : '2px solid transparent',
                  color: settingsTab === 'pipelines' ? '#4c6fff' : '#64748b',
                  fontWeight: 500
                }}
              >
                Pipelines
              </button>
            </div>
            {settingsTab === 'profile' && (
              <SettingsView onSaved={(m)=>pushToast(m,'success')} onError={(m)=>pushToast(m,'error')} />
            )}
            {settingsTab === 'pipelines' && <PipelineSettings />}
          </div>
        );
      default:
        return (
          <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h2 style={{ marginTop: 0 }}>{menu.find(m => m.key === active)?.label || 'Section'}</h2>
            <div style={{ color: '#718096' }}>This section will be implemented in future phases.</div>
          </div>
        );
    }
  };

  const initials = `${(user?.first_name||'').charAt(0)}${(user?.last_name||'').charAt(0)}`.toUpperCase() || 'U';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${sidebarOpen ? '260px' : '0'} 1fr`, minHeight: '100vh', background: '#f6f7fb' }}>
      {/* Sidebar */}
      <aside style={{ background: '#0f172a', color: 'white', padding: sidebarOpen ? 16 : 0, overflow: 'hidden', transition: 'all 0.2s ease' }}>
        {sidebarOpen && (
          <>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Puppy CRM</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 24 }}>{company?.name || 'Company'}</div>
          </>
        )}
        <nav style={{ display: 'grid', gap: 6 }}>
          {menu.map(item => (
            <PermissionGate key={item.key} roles={item.roles} fallback={null}>
              <button
                onClick={() => {
                  if (item.isRoute) {
                    navigate(item.path);
                  } else {
                    setActive(item.key);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: active === item.key ? '#1e293b' : 'transparent', color: 'white',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            </PermissionGate>
          ))}
          {sidebarOpen && <div style={{ height: 12 }} />}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'white' }}>
            <FiLogOut /> {sidebarOpen && 'Logout'}
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main style={{ padding: 20 }}>
        {/* Top Bar */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: '#0f172a' }} title="Toggle menu"><FiMenu /></button>
            <div>
              <div style={{ fontSize: 14, color: '#64748b' }}>{company?.name || 'Company'}</div>
              <h1 style={{ margin: 0 }}>{menu.find(m => m.key === active)?.label || 'Dashboard'}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <button style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#0f172a' }} title="Notifications"><FiBell /></button>
            <div title={userRole?.toUpperCase()} style={{ fontSize: 12, color: '#64748b', background: '#e2e8f0', padding: '4px 8px', borderRadius: 999 }}>{userRole || 'role'}</div>
            <button onClick={() => setShowProfileMenu(s => !s)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#4c6fff', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, border: 'none', cursor: 'pointer' }}>{initials}</button>
            {showProfileMenu && (
              <div style={{ position: 'absolute', right: 0, top: 44, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', minWidth: 160 }}>
                <div style={{ padding: '8px 12px', color: '#0f172a' }}>{user?.first_name} {user?.last_name}</div>
                <hr style={{ margin: 0, borderColor: '#f1f5f9' }} />
                <button onClick={() => setActive('settings')} style={{ display: 'block', width: '100%', padding: '10px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>Profile</button>
                <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>Logout</button>
              </div>
            )}
          </div>
        </header>

        {renderContent()}

        <InviteModal
          open={showInvite}
          onClose={() => setShowInvite(false)}
          onSuccess={(m)=>{ pushToast(m,'success'); setShowInvite(false); setTeamRefreshKey(k=>k+1); }}
          onError={(m)=>pushToast(m,'error')}
        />
      </main>

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
};

export default CompanyDashboard;
