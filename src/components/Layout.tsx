import { Outlet, useLocation } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './Footer';
import AIChatWidget from './AIChatWidget';
import { cn } from '../lib/utils';

export default function Layout() {
  const location = useLocation();
  // The home page opens with a full-bleed hero that runs beneath the fixed header;
  // every other page starts below it.
  const isHome = location.pathname === '/';

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
