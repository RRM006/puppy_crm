import React, { useState } from 'react';
import { sendEmail } from '../../services/emailService';
import ReactQuill from 'react-quill';
import { getTemplates } from '../../services/templateService';
import { useDropzone } from 'react-dropzone';
import 'react-quill/dist/quill.snow.css';

const ComposeEmailModal = ({ open, onClose, accounts=[], activeAccount, onSent }) => {
  const [form, setForm] = useState({ to:'', cc:'', bcc:'', subject:'', body:'', account_id: activeAccount?.id, template_id:null });
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const DRAFT_KEY = 'compose_draft_v1';
  const [templates, setTemplates] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [minimized, setMinimized] = useState(false);
  const saveTimeout = useRef(null);

  if (!open) return null;

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const persistDraft = (next) => {
    if(saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(()=>{ try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch{} }, 600);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await sendEmail({
        account: form.account_id,
        to_emails: form.to.split(/[,;]/).map(s=>s.trim()).filter(Boolean),
        cc: form.cc ? form.cc.split(/[,;]/).map(s=>s.trim()).filter(Boolean) : [],
        bcc: form.bcc ? form.bcc.split(/[,;]/).map(s=>s.trim()).filter(Boolean) : [],
        subject: form.subject,
        body_html: form.body,
        template_id: form.template_id || undefined
      });
      onSent && onSent();
    } catch(e){ console.error(e); } finally { setSending(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
      <div style={{ width:'min(900px,92vw)', background:'white', borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:12, maxHeight:'90vh', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0 }}>Compose Email</h2>
          <button onClick={onClose} style={{ border:'none', background:'transparent', cursor:'pointer', fontSize:20 }}>×</button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select name='account_id' value={form.account_id||''} onChange={handleChange} style={{ padding:'8px', borderRadius:8, border:'1px solid #e2e8f0' }}>
            <option value=''>Select Account</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.display_name||a.email}</option>)}
          </select>
          <select name='template_id' value={form.template_id||''} onChange={onTemplateSelect} style={{ padding:'8px', borderRadius:8, border:'1px solid #e2e8f0' }}>
            <option value=''>Template</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input name='to' placeholder='To' value={form.to} onChange={handleChange} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid #e2e8f0' }} />
        </div>
        <button onClick={()=>setShowCcBcc(s=>!s)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#4c6fff', fontSize:12 }}>Cc / Bcc</button>
        {showCcBcc && (
          <div style={{ display:'flex', gap:8 }}>
            <input name='cc' placeholder='Cc' value={form.cc} onChange={handleChange} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid #e2e8f0' }} />
            <input name='bcc' placeholder='Bcc' value={form.bcc} onChange={handleChange} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid #e2e8f0' }} />
          </div>
        )}
        <input name='subject' placeholder='Subject' value={form.subject} onChange={handleChange} style={{ padding:'8px', borderRadius:8, border:'1px solid #e2e8f0' }} />
        <ReactQuill theme='snow' value={form.body} onChange={(val)=>setForm(f=>({...f, body:val}))} style={{ background:'white' }} />
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} disabled={sending} style={{ padding:'10px 16px', border:'1px solid #e2e8f0', background:'white', borderRadius:8, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSend} disabled={sending || !form.account_id || !form.to} style={{ padding:'10px 20px', border:'none', background:'#4c6fff', color:'white', borderRadius:8, cursor:'pointer', fontWeight:600 }}>{sending?'Sending...':'Send'}</button>
        </div>
      </div>
    </div>
  );
};

export default ComposeEmailModal;
