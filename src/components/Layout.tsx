import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './Footer';
import ReviewModal from './reviews/ReviewModal';
import { track, trackContactLinks } from '../lib/metaPixel';
import { afterFirstInteraction } from '../lib/timing';

// The chat bubble is not part of the first view, and with its animation
// library it weighs more than the page around it: it arrives with the
// visitor's first touch or scroll, or after ten seconds.
const AIChatWidget = lazy(() => import('./AIChatWidget'));

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

  const [chat, setChat] = useState(false);
  useEffect(() => {
    let live = true;
    afterFirstInteraction(10_000).then(() => { if (live) setChat(true); });
    return () => { live = false; };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col font-sans bg-surface">
      {/* On the home page the header lies over the hero; elsewhere it is in
          the flow and the page starts below it. */}
      <Header />
      <main className="flex-grow">
        {/* The policy and reviews pages arrive as their own chunks; the
            header and footer stay put while one loads. */}
        <Suspense fallback={<div className="min-h-[70vh]" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      {chat && <Suspense fallback={null}><AIChatWidget /></Suspense>}
      <ReviewModal />
    </div>
  );
}
