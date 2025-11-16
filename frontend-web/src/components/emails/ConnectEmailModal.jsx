import React, { useState } from 'react';
import { connectGmail, addSMTPAccount } from '../../services/emailService';

const initialSmtp = { display_name:'', email:'', host:'', port:587, username:'', password:'', use_tls:true }; // Simplified form

const ConnectEmailModal = ({ open, onClose, onConnected }) => {
  const [view, setView] = useState('options');
  const [smtp, setSmtp] = useState(initialSmtp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  if (!open) return null;

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setSmtp(s => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleGmail = async () => {
    setLoading(true); setError(null);
    try { const data = await connectGmail(); window.location.href = data.auth_url || data.url || '#'; } catch(e){ setError('Failed to start Gmail OAuth'); console.error(e); } finally { setLoading(false); }
  };

  const handleSaveSMTP = async () => {
    setLoading(true); setError(null);
    try { await addSMTPAccount({ provider:'smtp', ...smtp }); onConnected && onConnected(); } catch(e){ setError('Failed to add account'); console.error(e); } finally { setLoading(false); }
  };

  const handleTest = async () => {
    // Placeholder test since backend test endpoint not defined; simulate success.
    setTestResult('Attempting connection...');
    setTimeout(() => { setTestResult('Test succeeded (simulated).'); }, 800);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:70 }}>
      <div style={{ width:'min(640px,92vw)', background:'white', borderRadius:12, padding:20, display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0 }}>Connect Email Account</h2>
          <button onClick={onClose} style={{ border:'none', background:'transparent', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        {view==='options' && (
          <div style={{ display:'grid', gap:12 }}>
            <button onClick={handleGmail} disabled={loading} style={{ padding:'12px 16px', background:'#ea4335', color:'white', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>{loading?'Starting...':'Connect Gmail (OAuth)'}</button>
            <button onClick={()=>setView('smtp')} style={{ padding:'12px 16px', background:'#1e293b', color:'white', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Connect via SMTP / IMAP</button>
          </div>
        )}
        {view==='smtp' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', gap:8 }}>
              <input name='display_name' placeholder='Display Name' value={smtp.display_name} onChange={handleChange} style={{ flex:1, padding:'8px', border:'1px solid #e2e8f0', borderRadius:8 }} />
              <input name='email' placeholder='Email Address' value={smtp.email} onChange={handleChange} style={{ flex:1, padding:'8px', border:'1px solid #e2e8f0', borderRadius:8 }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input name='host' placeholder='SMTP Host' value={smtp.host} onChange={handleChange} style={{ flex:2, padding:'8px', border:'1px solid #e2e8f0', borderRadius:8 }} />
              <input name='port' type='number' placeholder='Port' value={smtp.port} onChange={handleChange} style={{ width:110, padding:'8px', border:'1px solid #e2e8f0', borderRadius:8 }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input name='username' placeholder='Username' value={smtp.username} onChange={handleChange} style={{ flex:1, padding:'8px', border:'1px solid #e2e8f0', borderRadius:8 }} />
              <input name='password' type='password' placeholder='Password / App Password' value={smtp.password} onChange={handleChange} style={{ flex:1, padding:'8px', border:'1px solid #e2e8f0', borderRadius:8 }} />
            </div>
            <label style={{ fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
              <input type='checkbox' name='use_tls' checked={smtp.use_tls} onChange={handleChange} /> Use TLS
            </label>
            {error && <div style={{ color:'#dc2626', fontSize:13 }}>{error}</div>}
            {testResult && <div style={{ color:'#0f172a', fontSize:12 }}>{testResult}</div>}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setView('options')} style={{ padding:'8px 14px', background:'white', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer' }}>Back</button>
                <button onClick={handleTest} style={{ padding:'8px 14px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer' }}>Test Connection</button>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={onClose} style={{ padding:'8px 14px', background:'white', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer' }}>Cancel</button>
                <button onClick={handleSaveSMTP} disabled={loading || !smtp.email || !smtp.host} style={{ padding:'8px 18px', background:'#4c6fff', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>{loading?'Saving...':'Save Account'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectEmailModal;
