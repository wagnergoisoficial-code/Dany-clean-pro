import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './Footer';
import AIChatWidget from './AIChatWidget';
import ReviewModal from './reviews/ReviewModal';
import { track, trackContactLinks } from '../lib/metaPixel';

export default function Layout() {
  const location = useLocation();

  // index.html already counted the page the visitor landed on; only the
  // pages they move to after it are new to the pixel. Compared by path rather
  // than by "first run", which StrictMode's second run would get wrong.
  const counted = useRef(location.pathname);
  useEffect(() => {
    if (counted.current === location.pathname) return;
    counted.current = location.pathname;
    track('PageView');
  }, [location.pathname]);

  useEffect(() => trackContactLinks(), []);

  return (
    <div className="relative min-h-screen flex flex-col font-sans bg-surface">
      {/* On the home page the header lies over the hero; elsewhere it is in
          the flow and the page starts below it. */}
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <AIChatWidget />
      <ReviewModal />
    </div>
  );
}
