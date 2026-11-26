import { useEffect } from 'react';
import QuoteSection from '../components/home/QuoteSection';

/**
 * danycleanpro.com/quote: the quote form on its own, for ads, the Instagram
 * bio and text messages, so a visitor lands straight on the form.
 */
export default function QuotePage() {
  useEffect(() => {
    document.title = 'Free Cleaning Quote — Dany Clean Pro';
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="font-site">
      <QuoteSection formFirst />
    </div>
  );
}
