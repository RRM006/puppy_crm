import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import Features from '../components/Features.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Pricing from '../components/Pricing.jsx';
import Footer from '../components/Footer.jsx';
import useReveal from '../utils/useReveal';

export default function Landing() {
  useReveal();
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </>
  );
}
