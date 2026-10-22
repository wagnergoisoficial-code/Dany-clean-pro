import { useEffect } from 'react';
import Hero from '../components/home/Hero';
import ServiceStrip from '../components/home/ServiceStrip';
import WhyChooseUs from '../components/home/WhyChooseUs';
import Testimonials from '../components/home/Testimonials';
import Difference from '../components/home/Difference';
import Gallery from '../components/home/Gallery';
import Excellence from '../components/home/Excellence';
import QuoteSection from '../components/home/QuoteSection';

/**
 * The home page, built to the approved reference: hero with the service
 * strip, "Why Choose Us?", the grey band, the navy band. Client reviews,
 * Dany's gallery, the quote request and the contacts are added in the same
 * design, at the owner's request.
 */
export default function Home() {
  // Arriving from another page or an e-mail link (/#quote, /#gallery…): the
  // sections render after the browser has looked for the anchor, and the
  // gallery only once its photos arrive, so look again a little later.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, id === 'gallery' ? 900 : 150);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="font-site">
      <Hero />
      <ServiceStrip />
      <WhyChooseUs />
      <Testimonials />
      <Difference />
      <Gallery />
      <Excellence />
      <QuoteSection />
    </div>
  );
}
