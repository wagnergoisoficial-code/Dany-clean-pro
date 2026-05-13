import { Outlet } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './Footer';
import AIChatWidget from './AIChatWidget';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  );
}
