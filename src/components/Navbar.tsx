import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Phone, MessageSquare, MapPin, Clock, LayoutDashboard, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Container from './ui/Container';
import { useAdminAuth } from '../lib/auth';
import { useSetting } from '../lib/settings';
import { useConfig } from '../hooks/useConfig';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { value: appLogo } = useSetting('app_logo');
  const { businessPhone } = useConfig();

  const triggerAICall = (e: React.MouseEvent) => {
    // We allow the default action (making the call) 
    // while still triggering the AI overlay for multi-modal context.
    window.dispatchEvent(new CustomEvent('trigger-ai-call'));
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    
    if (href === '/') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (location.pathname !== '/') {
      navigate('/' + href);
    } else {
      const id = href.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 90;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Reviews', href: '#reviews' },
  ];

  return (
    <nav 
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
      )}
    >
      <Container>
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center group py-1"
          >
            <div className="flex items-center justify-center transition-transform group-hover:scale-105">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="h-12 md:h-14 w-auto object-contain" />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl overflow-hidden border-2 border-white shadow-xl shadow-blue-600/10">
                  D
                </div>
              )}
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-[13px] font-bold text-slate-600 transition-colors hover:text-blue-600 uppercase tracking-wider"
              >
                {link.name}
              </a>
            ))}
            
            {user ? (
              <Link 
                to="/admin/dashboard" 
                target="_blank"
                className="text-[13px] font-bold text-blue-600 flex items-center gap-2 uppercase tracking-wider hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 transition-all"
              >
                <LayoutDashboard size={14} /> Dashboard
              </Link>
            ) : (
              <Link 
                to="/admin/login" 
                target="_blank"
                className="text-[13px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider hover:text-blue-600 transition-all"
              >
                <Lock size={14} /> Admin
              </Link>
            )}

            <a 
              href={`tel:${businessPhone.replace(/\D/g, '')}`}
              onClick={triggerAICall}
              className="text-[13px] font-bold text-slate-900 flex items-center gap-2 group/phone"
            >
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover/phone:bg-blue-600 group-hover/phone:text-white transition-all">
                <Phone size={14} />
              </div>
              {businessPhone}
            </a>
            <a 
              href="#quote" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10 active:scale-95"
            >
              Free Estimate
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-900"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </Container>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-slate-100 absolute top-full left-0 w-full overflow-hidden shadow-xl"
          >
            <div className="px-6 py-10 space-y-8">
              <div className="space-y-6">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href}
                    className="block text-slate-900 font-bold text-lg"
                    onClick={(e) => handleLinkClick(e, link.href)}
                  >
                    {link.name}
                  </a>
                ))}
                {user ? (
                  <Link 
                    to="/admin/dashboard" 
                    target="_blank"
                    className="block text-blue-600 font-bold text-lg flex items-center gap-2 bg-blue-50 px-4 py-3 rounded-xl"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard size={20} /> Admin Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/admin/login" 
                    target="_blank"
                    className="block text-slate-400 font-bold text-lg flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Lock size={20} /> Login Admin
                  </Link>
                )}
              </div>

              <div className="pt-8 border-t border-slate-50 space-y-6">
                <a 
                  href={`tel:${businessPhone.replace(/\D/g, '')}`} 
                  onClick={(e) => {
                    setIsOpen(false);
                    triggerAICall(e);
                  }}
                  className="flex items-center gap-4 text-slate-900 font-bold bg-slate-50 p-4 rounded-2xl border border-slate-100"
                >
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Ligar para IA</p>
                    <p className="text-lg">{businessPhone}</p>
                  </div>
                </a>
                <a 
                  href="#quote" 
                  className="block text-center bg-blue-600 text-white py-5 rounded-2xl font-bold shadow-lg shadow-blue-600/10 active:scale-[0.98] transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Get Your Free Quote
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
