import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, ArrowRight, Mail, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import Container from '../ui/Container';
import Logo from '../ui/Logo';
import { useSetting } from '../../lib/settings';
import { useConfig } from '../../hooks/useConfig';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { value: heroCover } = useSetting('hero_cover');
  const { businessPhone } = useConfig();

  const triggerAICall = (e: React.MouseEvent) => {
    // We allow the default action (making the call) 
    // while still triggering the AI overlay for multi-modal context.
    window.dispatchEvent(new CustomEvent('trigger-ai-call'));
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Reviews', href: '#reviews' },
  ];

  return (
    <nav 
      className={cn(
        "fixed top-0 inset-x-0 z-[100] transition-all duration-500",
        isScrolled ? "bg-white/90 backdrop-blur-xl shadow-sm py-3" : "bg-transparent py-6"
      )}
    >
      <Container>
        <div className="flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 hover:text-blue-600 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="h-4 w-px bg-slate-200" />
            
            {/* Contact Links */}
            <div className="flex items-center gap-6">
              <a 
                href={`tel:${businessPhone.replace(/\D/g, '')}`} 
                onClick={triggerAICall}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Phone size={14} />
                </div>
                <span className="text-[13px] font-bold text-slate-900 line-clamp-1">{businessPhone}</span>
              </a>

              <a href={`sms:${businessPhone.replace(/\D/g, '')}`} className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                  <MessageSquare size={14} />
                </div>
                <span className="text-[13px] font-bold text-slate-900 hidden xl:block">SMS</span>
              </a>

              <a href="mailto:danycleanenpro@gmail.com" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                  <Mail size={14} />
                </div>
                <span className="text-[13px] font-bold text-slate-900 hidden xl:block">Email</span>
              </a>
            </div>

            <a 
              href="#quote" 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[13px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 whitespace-nowrap"
            >
              Get Free Estimate
            </a>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 sm:gap-3 lg:hidden">
            <a 
              href="mailto:danycleanenpro@gmail.com" 
              className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100"
              title="Email Us"
            >
              <Mail size={18} />
            </a>
            <a 
              href={`sms:${businessPhone.replace(/\D/g, '')}`} 
              className="p-2.5 rounded-xl bg-green-50 text-green-600 border border-green-100"
              title="Text Us"
            >
              <MessageSquare size={18} />
            </a>
            <a 
              href={`tel:${businessPhone.replace(/\D/g, '')}`} 
              onClick={triggerAICall}
              className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100"
              title="Call Us"
            >
              <Phone size={18} />
            </a>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl bg-slate-900 text-white shadow-lg"
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full inset-x-0 bg-white border-b border-slate-100 shadow-2xl lg:hidden overflow-hidden"
          >
            <div className="px-6 py-10 space-y-8">
              <div className="space-y-6">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between group"
                  >
                    <span className="text-xl font-bold text-slate-900">{link.name}</span>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </a>
                ))}
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Direct Contact</p>
                
                <a 
                  href={`tel:${businessPhone.replace(/\D/g, '')}`} 
                  onClick={(e) => {
                    setIsOpen(false);
                    triggerAICall(e);
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 text-blue-600"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">AI Call Assistant</p>
                    <p className="text-lg font-bold">{businessPhone}</p>
                  </div>
                </a>

                <a href={`sms:${businessPhone.replace(/\D/g, '')}`} className="flex items-center gap-4 p-4 rounded-2xl bg-green-50 text-green-600">
                  <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Text Us</p>
                    <p className="text-lg font-bold">{businessPhone}</p>
                  </div>
                </a>

                <a href="mailto:danycleanenpro@gmail.com" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Email Us</p>
                    <p className="text-base font-bold truncate">danycleanenpro@gmail.com</p>
                  </div>
                </a>
              </div>
              
              <div className="pt-8 border-t border-slate-100">
                <a 
                  href="#quote" 
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20"
                >
                  Book Instant Clean <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
