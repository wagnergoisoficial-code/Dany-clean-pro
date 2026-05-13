import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, MessageSquare, MapPin, Clock, LayoutDashboard, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Container from './ui/Container';
import { useAdminAuth } from '../lib/auth';
import { useSetting } from '../lib/settings';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const { value: appLogo } = useSetting('app_logo');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Serviços', href: '#services' },
    { name: 'Sobre', href: '#about' },
    { name: 'Galeria', href: '#gallery' },
    { name: 'Avaliações', href: '#reviews' },
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
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-white shadow-xl shadow-blue-600/10 transition-transform group-hover:scale-110">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                "D"
              )}
            </div>
            <span className={cn(
              "font-display font-bold text-xl tracking-tight leading-none transition-colors",
              isScrolled ? "text-slate-900" : "text-slate-900" 
            )}>
              Dany Clean <span className="text-blue-600">Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
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
                <LayoutDashboard size={14} /> Painel
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
              href="tel:+14753413699"
              className="text-[13px] font-bold text-slate-900 flex items-center gap-2"
            >
              <Phone size={16} className="text-blue-600" /> (475) 341-3699
            </a>
            <a 
              href="#quote" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10 active:scale-95"
            >
              Orçamento Grátis
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
                    onClick={() => setIsOpen(false)}
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
                    <LayoutDashboard size={20} /> Painel Administrativo
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
                  href="tel:+14753413699" 
                  className="flex items-center gap-4 text-slate-900 font-bold"
                >
                  <Phone size={20} className="text-blue-600" /> Ligar (475) 341-3699
                </a>
                <a 
                  href="#quote" 
                  className="block text-center bg-blue-600 text-white py-5 rounded-2xl font-bold shadow-lg shadow-blue-600/10"
                  onClick={() => setIsOpen(false)}
                >
                  Peça seu Orçamento Gratuito
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
