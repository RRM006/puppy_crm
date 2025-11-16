import React from 'react';
import styles from './EmailThreadView.module.css';

const EmailThreadView = ({ thread, onReply }) => {
  if (!thread) return null;
  const emails = thread.emails || thread.messages || [];
  return (
    <div className={styles.threadWrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>{thread.subject || '(no subject)'}</h3>
        <button onClick={onReply} className={styles.replyBtn}>Reply</button>
      </div>
      {emails.map(e => (
        <div key={e.id} className={styles.emailCard}>
          <div className={styles.emailHead}>
            <div className={styles.from}>{e.from_email}</div>
            <div className={styles.stamp}>{new Date(e.created_at || e.timestamp || Date.now()).toLocaleString()}</div>
          </div>
          <div style={{ fontSize:14 }} dangerouslySetInnerHTML={{ __html: e.body_html || `<pre>${e.body_text||''}</pre>` }} />
          {e.attachments && e.attachments.length>0 && (
            <div className={styles.attachments}>
              {e.attachments.map(a => <a key={a.id||a.file} href={a.file||'#'} className={styles.attachmentLink}>{a.filename||'attachment'}</a>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EmailThreadView;
