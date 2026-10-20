import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './Footer';
import AIChatWidget from './AIChatWidget';
import { cn } from '../lib/utils';
import { track, trackContactLinks } from '../lib/metaPixel';

export default function Layout() {
  const location = useLocation();
  // The home page opens with a full-bleed hero that runs beneath the fixed header;
  // every other page starts below it.
  const isHome = location.pathname === '/';

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
    <div className="min-h-screen flex flex-col font-sans bg-surface">
      <Header />
      <main className={cn("flex-grow", !isHome && "pt-20")}>
        <Outlet />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  );
}
