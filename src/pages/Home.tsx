import { startTransition, useEffect, useState } from 'react';
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
  // The first screen — the cover and the service strip — is drawn at once;
  // the rest of the page follows in a transition, which React renders in
  // small slices, so a slow phone is never locked up for the second it takes
  // to build everything below the fold.
  const [rest, setRest] = useState(false);
  useEffect(() => { startTransition(() => setRest(true)); }, []);

  // Arriving from another page or an e-mail link (/#quote, /#gallery…), or a
  // link followed before the rest of the page was drawn: the sections exist
  // only once `rest` is in, and the gallery only once its photos have arrived
  // after the page loaded — so keep looking for the anchor, for a while.
  useEffect(() => {
    if (!rest) return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const target = document.getElementById(id);
      if (target || ++tries > 50) {
        window.clearInterval(timer);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [rest]);

  return (
    <div className="font-site">
      <Hero />
      <ServiceStrip />
      {rest ? (
        <>
          <WhyChooseUs />
          <Testimonials />
          <Difference />
          <Gallery />
          <Excellence />
          <QuoteSection />
        </>
      ) : (
        // Holds the footer below the fold until the sections arrive: on a tall
        // screen it would otherwise show under the strip and then jump.
        <div aria-hidden className="min-h-screen" />
      )}
    </div>
  );
}
