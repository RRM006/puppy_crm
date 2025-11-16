import React, { useEffect, useState } from 'react';
import { getTemplates, deleteTemplate, duplicateTemplate, updateTemplate } from '../services/templateService';
import CreateTemplateModal from '../components/emails/CreateTemplateModal.jsx';
import TemplatePreviewModal from '../components/emails/TemplatePreviewModal.jsx';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [editTemplate, setEditTemplate] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const data = await getTemplates({ q: query, category }); setTemplates(data.results||data); } catch(e){ console.error(e); } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, [query, category]);

  const categories = ['', 'primary','lead','deal','customer','complaint','other'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ margin:0 }}>Email Templates</h2>
        <button onClick={()=>setCreateOpen(true)} style={{ background:'#4c6fff', color:'white', padding:'10px 16px', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>+ New Template</button>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <input placeholder='Search templates' value={query} onChange={e=>setQuery(e.target.value)} style={{ flex:1, padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:8 }} />
        <select value={category} onChange={e=>setCategory(e.target.value)} style={{ padding:'8px', border:'1px solid #e2e8f0', borderRadius:8 }}>
          {categories.map(c => <option key={c} value={c}>{c||'All Categories'}</option>)}
        </select>
      </div>
      <div style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))' }}>
        {loading && <div>Loading...</div>}
        {!loading && templates.map(t => (
          <div key={t.id} style={{ border:'1px solid #e2e8f0', borderRadius:12, background:'white', padding:14, display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <strong>{t.name}</strong>
              <span style={{ fontSize:12, background:'#f1f5f9', padding:'2px 6px', borderRadius:6 }}>{t.category||'uncat'}</span>
            </div>
            <div style={{ fontSize:12, color:'#64748b' }}>Usage: {t.usage_count||0}</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={()=>setPreviewId(t.id)} style={{ border:'none', background:'#f1f5f9', padding:'6px 10px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Preview</button>
              <button onClick={()=>setEditTemplate(t)} style={{ border:'none', background:'#f1f5f9', padding:'6px 10px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Edit</button>
              <button onClick={()=>duplicateTemplate(t.id).then(load)} style={{ border:'none', background:'#f1f5f9', padding:'6px 10px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Duplicate</button>
              <button onClick={()=>deleteTemplate(t.id).then(load)} style={{ border:'none', background:'#fee2e2', padding:'6px 10px', borderRadius:8, cursor:'pointer', fontSize:12, color:'#dc2626' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <CreateTemplateModal open={createOpen} onClose={()=>setCreateOpen(false)} onCreated={()=>{ setCreateOpen(false); load(); }} />
      {editTemplate && (
        <CreateTemplateModal
          open={!!editTemplate}
          onClose={()=>setEditTemplate(null)}
          onCreated={()=>{ setEditTemplate(null); load(); }}
          initial={editTemplate}
          mode="edit"
          onSave={async (data)=>{ await updateTemplate(editTemplate.id, data); setEditTemplate(null); load(); }}
        />
      )}
      <TemplatePreviewModal id={previewId} onClose={()=>setPreviewId(null)} />
    </div>
  );
};

export default EmailTemplates;
