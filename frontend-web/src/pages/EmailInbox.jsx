import React, { useEffect, useState, useCallback } from 'react';
import styles from './EmailInbox.module.css';
import { getInbox, getEmailAccounts, getThread, markAsRead, starThread, deleteEmail, sendEmail, replyEmail } from '../services/emailService';
import ComposeEmailModal from '../components/emails/ComposeEmailModal.jsx';
import ReplyEmailModal from '../components/emails/ReplyEmailModal.jsx';
import EmailThreadView from '../components/emails/EmailThreadView.jsx';
import ConnectEmailModal from '../components/emails/ConnectEmailModal.jsx';

const POLL_MS = 30000;

const EmailInbox = () => {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [bulk, setBulk] = useState([]);

  const loadAccounts = async () => {
    try { const data = await getEmailAccounts(); setAccounts(data); if (!activeAccount && data.length) setActiveAccount(data[0]); } catch(e){ console.error(e); }
  };
  const loadInbox = useCallback(async () => {
    if (!activeAccount) return; setLoading(true);
    try { const data = await getInbox({ account: activeAccount.id, filter, q: query }); setThreads(data.results || data); } catch(e){ console.error(e); } finally { setLoading(false); }
  }, [activeAccount, filter, query]);

  const loadThread = async (id) => { try { const data = await getThread(id); setSelectedThread(data); } catch(e){ console.error(e); } };

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { loadInbox(); }, [loadInbox]);
  useEffect(() => {
    const t = setInterval(() => { loadInbox(); }, POLL_MS);
    return () => clearInterval(t);
  }, [loadInbox]);

  useEffect(() => { if (selectedThreadId) loadThread(selectedThreadId); }, [selectedThreadId]);

  const toggleBulk = (id) => setBulk(b => b.includes(id) ? b.filter(x=>x!==id) : [...b,id]);
  const clearBulk = () => setBulk([]);

  const bulkMarkRead = async () => { for (const id of bulk) { await markAsRead(id); } clearBulk(); loadInbox(); };
  const bulkStar = async () => { for (const id of bulk) { await starThread(id); } clearBulk(); loadInbox(); };
  const bulkDelete = async () => { for (const id of bulk) { await deleteEmail(id); } clearBulk(); loadInbox(); };

  const categories = ['Primary','Lead','Deal','Customer','Complaint','Other'];

  return (
    <div className={styles.inboxGrid}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <button onClick={()=>setComposeOpen(true)} className={styles.composeBtn}>Compose</button>
        <div className={styles.sectionLabel}>Folders</div>
        <div className={styles.sidebarList}>
          <button className={`${styles.sidebarBtn} ${filter==='all'?styles.sidebarBtnActive:''}`} onClick={()=>setFilter('all')}>Inbox</button>
          <button className={`${styles.sidebarBtn} ${filter==='sent'?styles.sidebarBtnActive:''}`} onClick={()=>setFilter('sent')}>Sent</button>
          <button className={`${styles.sidebarBtn} ${filter==='starred'?styles.sidebarBtnActive:''}`} onClick={()=>setFilter('starred')}>Starred</button>
          <button className={`${styles.sidebarBtn} ${filter==='drafts'?styles.sidebarBtnActive:''}`} onClick={()=>setFilter('drafts')}>Drafts</button>
        </div>
        <div className={styles.sectionLabel}>Categories</div>
        <div className={styles.sidebarList}>
          {categories.map(c => <button key={c} className={`${styles.sidebarBtn} ${filter===c.toLowerCase()?styles.sidebarBtnActive:''}`} onClick={()=>setFilter(c.toLowerCase())}>{c}</button>)}
        </div>
        <div className={styles.sectionLabel}>Accounts</div>
        <div className={styles.sidebarList}>
          {accounts.map(a => (
            <button key={a.id} onClick={()=>setActiveAccount(a)} className={`${styles.accountBtn} ${activeAccount?.id===a.id?styles.accountBtnActive:''}`}>{a.display_name || a.email}</button>
          ))}
          <button onClick={()=>setConnectOpen(true)} className={styles.connectBtn}>+ Connect</button>
        </div>
      </aside>

      {/* List */}
      <section className={styles.listPanel}>
        <div className={styles.searchRow}>
          <input placeholder='Search mail' value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') loadInbox(); }} className={styles.searchInput} />
          <button onClick={loadInbox} className={styles.searchBtn}>Search</button>
        </div>
        {bulk.length>0 && (
          <div className={styles.bulkBar}>
            <span style={{ fontSize:12 }}>{bulk.length} selected</span>
            <button onClick={bulkMarkRead} className={styles.bulkBtn}>Mark Read</button>
            <button onClick={bulkStar} className={styles.bulkBtn}>Star</button>
            <button onClick={bulkDelete} className={`${styles.bulkBtn} ${styles.bulkDelete}`}>Delete</button>
            <button onClick={clearBulk} className={styles.bulkBtn}>Clear</button>
          </div>
        )}
        <div className={styles.threadsScroll}>
          {loading && <div style={{ padding:12 }}>Loading...</div>}
          {!loading && threads.map(t => (
            <div key={t.id} className={`${styles.threadItem} ${selectedThreadId===t.id?styles.threadItemActive:''}`} onClick={()=>setSelectedThreadId(t.id)}>
              <input type='checkbox' checked={bulk.includes(t.id)} onChange={(e)=>{ e.stopPropagation(); toggleBulk(t.id); }} />
              <button onClick={(e)=>{ e.stopPropagation(); starThread(t.id).then(loadInbox); }} className={`${styles.starBtn} ${t.starred?styles.starOn:styles.starOff}`}>★</button>
              <div className={styles.threadMeta}>
                <div className={styles.threadMetaTop}>
                  <strong className={`${styles.sender} ${t.unread?styles.senderUnread:''}`}>{t.from_email || t.last_from || 'Sender'}</strong>
                  <span className={styles.categoryBadge}>{t.category || 'primary'}</span>
                  {t.has_attachments && <span className={styles.attachIcon}>📎</span>}
                </div>
                <div className={styles.preview}>{t.subject || '(no subject)'} – {t.preview || t.body_text?.slice(0,60)}</div>
              </div>
              <div className={styles.timestamp}>{t.timestamp_human || ''}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Thread */}
      <section className={styles.threadPanel}>
        {!selectedThread && <div className={styles.threadEmpty}>Select a thread to view</div>}
        {selectedThread && (
          <EmailThreadView thread={selectedThread} onReply={() => setReplyOpen(true)} />
        )}
      </section>

      <ComposeEmailModal open={composeOpen} onClose={()=>setComposeOpen(false)} accounts={accounts} activeAccount={activeAccount} onSent={()=>{ setComposeOpen(false); loadInbox(); }} />
      <ReplyEmailModal open={replyOpen} onClose={()=>setReplyOpen(false)} thread={selectedThread} onSent={()=>{ setReplyOpen(false); loadInbox(); loadThread(selectedThreadId); }} />
      <ConnectEmailModal open={connectOpen} onClose={()=>setConnectOpen(false)} onConnected={()=>{ setConnectOpen(false); loadAccounts(); }} />
    </div>
  );
};

export default EmailInbox;
