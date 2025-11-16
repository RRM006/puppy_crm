import React, { useEffect, useState } from 'react';
import { previewTemplate } from '../../services/templateService';

const SAMPLE_DATA = { customer_name:'Jane Doe', company_name:'ACME Inc.', deal_name:'Spring Campaign', lead_name:'John Lead', current_date: new Date().toLocaleDateString() };

const TemplatePreviewModal = ({ id, onClose }) => {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      (async () => {
        setLoading(true);
        try { const data = await previewTemplate(id, SAMPLE_DATA); setHtml(data.rendered || data.html || ''); } catch(e){ console.error(e); } finally { setLoading(false); }
      })();
    }
  }, [id]);

  if (!id) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
      <div style={{ width:'min(800px,92vw)', background:'white', borderRadius:12, padding:16, maxHeight:'90vh', overflow:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0 }}>Template Preview</h2>
          <button onClick={onClose} style={{ border:'none', background:'transparent', cursor:'pointer', fontSize:20 }}>×</button>
        </div>
        {loading && <div>Loading preview...</div>}
        {!loading && <div dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  );
};

export default TemplatePreviewModal;
