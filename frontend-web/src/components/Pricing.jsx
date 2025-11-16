import styles from './Pricing.module.css';

const plans = [
  { name: 'Starter', price: 'Free', blurb: 'For individuals', features: ['Basic CRM', 'Unlimited contacts', 'Community support'] },
  { name: 'Business', price: '$29/month', blurb: 'For small teams', features: ['Team collaboration', 'Pipelines', 'Email integration'] },
  { name: 'Enterprise', price: 'Custom', blurb: 'For large organizations', features: ['SSO & RBAC', 'Advanced analytics', 'Dedicated support'] },
];

export default function Pricing() {
  return (
    <section id="pricing">
      <div className={styles.wrap}>
        <h2 className={styles.title}>Simple, Transparent Pricing</h2>
        <div className={styles.grid}>
          {plans.map((p, idx) => (
            <div key={p.name} className={`reveal ${styles.card} ${idx === 1 ? styles.highlight : ''}`} style={{ transitionDelay: `${idx * 0.15}s` }}>
              <div className={styles.badge}>Coming Soon</div>
              <div className={styles.plan}>{p.name}</div>
              <div className={styles.price}>{p.price}</div>
              <div style={{ color: '#6b7280', marginTop: 6 }}>{p.blurb}</div>
              <ul className={styles.list}>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button className={styles.btn} disabled>Choose Plan</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
