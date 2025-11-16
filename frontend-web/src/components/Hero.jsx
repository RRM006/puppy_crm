import { Link } from 'react-router-dom';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section>
      <div className={styles.wrap}>
        <div>
          <h1 className={styles.headline}>Manage Your Business Relations Like Never Before</h1>
          <p className={styles.sub}>
            All-in-one CRM solution for companies and customers. Track deals, manage leads, and grow your business.
          </p>
          <div className={styles.ctas}>
            <Link to="/signup" className={`${styles.btn} ${styles.primary}`}>Get Started Free</Link>
            <a href="#features" className={styles.btn}>Watch Demo</a>
          </div>
        </div>
        <div className={styles.right}>
          <img
            className={styles.img}
            alt="CRM Dashboard"
            src="/hero-crm.svg"
          />
        </div>
      </div>
    </section>
  );
}
