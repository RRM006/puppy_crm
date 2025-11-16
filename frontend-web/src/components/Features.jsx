import { FaUsers, FaHandshake, FaChartLine, FaSync, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import styles from './Features.module.css';

const items = [
  { icon: <FaHandshake />, title: 'Lead & Deal Management', desc: 'Track opportunities and close more deals' },
  { icon: <FaUsers />, title: 'Customer Insights', desc: 'Know your customers better with detailed profiles' },
  { icon: <FaSync />, title: 'Team Collaboration', desc: 'Work together with role-based access' },
  { icon: <FaChartLine />, title: 'Real-time Sync', desc: 'Access your CRM from web and mobile seamlessly' },
  { icon: <FaPhoneAlt />, title: 'Call & Email Integration', desc: 'Communicate directly from the platform' },
  { icon: <FaEnvelope />, title: 'Smart Analytics', desc: 'Make data-driven decisions' },
];

export default function Features() {
  return (
    <section id="features">
      <div className={styles.wrap}>
        <h2 className={styles.title}>Everything You Need to Succeed</h2>
        <div className={styles.grid}>
          {items.map((it, i) => (
            <div key={i} className={`reveal ${styles.card}`} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className={styles.cardTitle}><span className={styles.icon}>{it.icon}</span><span>{it.title}</span></div>
              <p className={styles.desc}>{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
