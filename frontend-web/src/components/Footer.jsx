import { Link } from 'react-router-dom';
import { FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer style={{ background: '#0f172a' }}>
      <div className={styles.wrap}>
        <div className={styles.top}>
          <div className={styles.brand}>CRM System</div>
          <div className={styles.links}>
            <a className={styles.link} href="#">About</a>
            <a className={styles.link} href="#features">Features</a>
            <a className={styles.link} href="#pricing">Pricing</a>
            <Link className={styles.link} to="/signup">Contact</Link>
          </div>
          <div className={styles.social}>
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
            <a href="#" aria-label="GitHub"><FaGithub /></a>
          </div>
        </div>
        <div className={styles.bottom}>
          © {new Date().getFullYear()} CRM System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
