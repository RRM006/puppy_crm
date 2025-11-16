import React, { useState } from 'react';
import { createTemplate } from '../../services/templateService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const VARS = ['{customer_name}','{company_name}','{deal_name}','{lead_name}','{current_date}'];

const CreateTemplateModal = ({ open, onClose, onCreated, initial, mode='create', onSave }) => {
  const [form, setForm] = useState(initial ? { name: initial.name||'', category: initial.category||'', subject: initial.subject||'', body_html: initial.body_html||'' } : { name:'', category:'', subject:'', body_html:'' });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleChange = e => setForm(f=>({...f, [e.target.name]: e.target.value}));
  const insertVar = v => setForm(f=>({...f, body_html: f.body_html + v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'edit' && onSave) {
        await onSave(form);
      } else {
        await createTemplate(form);
        onCreated && onCreated();
      }
    } catch(e){ console.error(e); } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
      <div style={{ width:'min(800px,92vw)', background:'white', borderRadius:12, padding:16, display:'grid', gridTemplateColumns:'1fr 180px', gap:16, maxHeight:'90vh', overflow:'auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0 }}>{mode==='edit'?'Edit Template':'New Template'}</h2>
            <button onClick={onClose} style={{ border:'none', background:'transparent', cursor:'pointer', fontSize:20 }}>×</button>
          </div>
          <input name='name' placeholder='Template Name' value={form.name} onChange={handleChange} style={{ padding:'8px', borderRadius:8, border:'1px solid #e2e8f0' }} />
          <div style={{ display:'flex', gap:8 }}>
            <input name='category' placeholder='Category' value={form.category} onChange={handleChange} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid #e2e8f0' }} />
            <input name='subject' placeholder='Subject' value={form.subject} onChange={handleChange} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid #e2e8f0' }} />
          </div>
          <ReactQuill theme='snow' value={form.body_html} onChange={(val)=>setForm(f=>({...f, body_html:val}))} />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={onClose} disabled={saving} style={{ padding:'8px 14px', border:'1px solid #e2e8f0', background:'white', borderRadius:8, cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name} style={{ padding:'8px 20px', border:'none', background:'#4c6fff', color:'white', borderRadius:8, cursor:'pointer', fontWeight:600 }}>{saving?'Saving...':'Save'}</button>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <strong style={{ fontSize:14 }}>Variables</strong>
          {VARS.map(v => <button key={v} onClick={()=>insertVar(v)} style={{ border:'1px solid #e2e8f0', background:'white', borderRadius:6, padding:'6px 8px', cursor:'pointer', fontSize:12 }}>{v}</button>)}
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
