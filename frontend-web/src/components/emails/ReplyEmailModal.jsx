import React, { useState, useEffect } from 'react';
import { replyEmail } from '../../services/emailService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const ReplyEmailModal = ({ open, onClose, thread, onSent }) => {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (thread && open) {
      const last = (thread.emails||thread.messages||[])[(thread.emails||thread.messages||[]).length-1];
      const quoted = last ? `<blockquote style='border-left:3px solid #e2e8f0;padding-left:8px;margin-left:0;'>${last.body_html||last.body_text||''}</blockquote>` : '';
      setBody(`<p></p>${quoted}`);
    }
  }, [thread, open]);

  if (!open) return null;

  const handleSend = async () => {
    if (!thread) return;
    setSending(true);
    try {
      await replyEmail(thread.id, { body_html: body });
      onSent && onSent();
    } catch(e){ console.error(e); } finally { setSending(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
      <div style={{ width:'min(700px,92vw)', background:'white', borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:12, maxHeight:'90vh', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0 }}>Reply</h2>
          <button onClick={onClose} style={{ border:'none', background:'transparent', cursor:'pointer', fontSize:20 }}>×</button>
        </div>
        <ReactQuill theme='snow' value={body} onChange={setBody} />
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} disabled={sending} style={{ padding:'8px 14px', border:'1px solid #e2e8f0', background:'white', borderRadius:8, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSend} disabled={sending} style={{ padding:'8px 20px', border:'none', background:'#4c6fff', color:'white', borderRadius:8, cursor:'pointer', fontWeight:600 }}>{sending?'Sending...':'Send'}</button>
        </div>
      </div>
    </div>
  );
};

export default ReplyEmailModal;
