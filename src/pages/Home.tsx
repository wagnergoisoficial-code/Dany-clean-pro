import { useEffect } from 'react';
import Hero from '../components/home/Hero';
import ServiceStrip from '../components/home/ServiceStrip';
import WhyChooseUs from '../components/home/WhyChooseUs';
import Difference from '../components/home/Difference';
import Excellence from '../components/home/Excellence';
import QuoteSection from '../components/home/QuoteSection';
import { useGalleryUploads } from '../hooks/useGalleryUploads';

/**
 * The home page, built to the approved reference: hero with the service
 * strip, "Why Choose Us?", the grey band, the navy band. The quote request
 * and Dany's contacts follow, at the owner's request, in the same design.
 */
export default function Home() {
  // Dany's own photos, when there are any, take the frames that matter most:
  // the front photo of each reason, then the two cards in the grey band.
  const uploads = useGalleryUploads();
  const reasonPhotos = [uploads[1], uploads[0], uploads[2]].map(u => u || '');
  const cardPhotos = [uploads[3], uploads[4]].map(u => u || '');

  // Arriving from another page or an e-mail link (/#quote, /#services…): the
  // sections render after the browser has looked for the anchor, so look again.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="font-site">
      <Hero />
      <ServiceStrip />
      <WhyChooseUs front={reasonPhotos} />
      <Difference photos={cardPhotos} />
      <Excellence />
      <QuoteSection />
    </div>
  );
}
