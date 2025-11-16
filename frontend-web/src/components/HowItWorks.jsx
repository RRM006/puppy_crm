import styles from './HowItWorks.module.css';

export default function HowItWorks() {
  return (
    <section id="how-it-works">
      <div className={styles.wrap}>
        <h2 className={styles.title}>Get Started in 3 Simple Steps</h2>
        <div className={styles.steps}>
          <div className={`reveal ${styles.step}`} style={{ transitionDelay: '0s' }}>
            <div className={styles.stepTitle}>1. Sign up as Company or Customer</div>
            <p>Create your account to start using the CRM tailored to your role.</p>
          </div>
          <div className={`reveal ${styles.step}`} style={{ transitionDelay: '0.15s' }}>
            <div className={styles.stepTitle}>2. Setup your workspace and invite team</div>
            <p>Configure pipelines, permissions, and bring your team onboard.</p>
          </div>
          <div className={`reveal ${styles.step}`} style={{ transitionDelay: '0.3s' }}>
            <div className={styles.stepTitle}>3. Start managing relationships and growing business</div>
            <p>Track leads, manage deals, and collaborate with your team in one place.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
