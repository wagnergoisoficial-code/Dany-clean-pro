import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, ArrowRight, Mail, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import Container from '../ui/Container';
import Logo from '../ui/Logo';
import { useConfig } from '../../hooks/useConfig';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { businessPhone } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';
  // Over the full-bleed hero the bar is transparent and reads on the gradient.
  const overlay = isHome && !isScrolled && !isOpen;

  const getSmsUrl = () => {
    const isIOS = typeof window !== 'undefined' && (
      /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
    const separator = isIOS ? '&' : '?';
    return `sms:+12183575938${separator}body=Hi,%20I%20would%20like%20a%20cleaning%20quote.`;
  };

  const triggerAICall = (e: React.MouseEvent) => {
    // We allow the default action (making the call) 
    // while still triggering the AI overlay for multi-modal context.
    window.dispatchEvent(new CustomEvent('trigger-ai-call'));
  };

  const handleSMSLaunch = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-sms-fallback'));
    }
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
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Service Areas', href: '#areas' },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 inset-x-0 z-[100] transition-colors duration-300",
        overlay
          ? "bg-transparent"
          : "bg-surface/95 backdrop-blur-xl border-b border-rule"
      )}
    >
      <Container>
        <div className="h-20 flex items-center justify-between gap-8">
          {/* Wordmark + primary navigation */}
          <div className="flex items-center gap-8 2xl:gap-12 min-w-0">
            <Link 
              to="/" 
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="group block shrink-0"
            >
              <Logo variant={overlay ? 'inverse' : 'default'} />
            </Link>

            <nav className="hidden xl:flex items-center gap-5 2xl:gap-7">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={cn(
                    "text-label-md uppercase transition-colors whitespace-nowrap",
                    overlay ? "text-white/80 hover:text-white" : "text-ink-muted hover:text-ink"
                  )}
                >
                  {link.name}
                </a>
              ))}
            </nav>
          </div>

          {/* Direct contact + call to action */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <div className="text-right hidden 2xl:block">
              <span className={cn(
                "block text-label-sm uppercase",
                overlay ? "text-white/60" : "text-accent"
              )}>
                Direct Inquiries
              </span>
              <a 
                href={`tel:${businessPhone.replace(/\D/g, '')}`} 
                onClick={triggerAICall}
                className={cn(
                  "text-body-sm font-semibold transition-colors",
                  overlay ? "text-white hover:text-white/80" : "text-ink hover:text-accent"
                )}
              >
                Call or Text {businessPhone}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${businessPhone.replace(/\D/g, '')}`}
                onClick={triggerAICall}
                title="Call us"
                className={cn(
                  "w-10 h-10 flex items-center justify-center transition-colors 2xl:hidden",
                  overlay
                    ? "text-white bg-surface hover:bg-surface"
                    : "text-ink-muted bg-surface-low hover:bg-surface-mid hover:text-ink"
                )}
              >
                <Phone size={16} />
              </a>
              <a
                href={getSmsUrl()}
                onClick={handleSMSLaunch}
                title="Send us a text message"
                className={cn(
                  "w-10 h-10 flex items-center justify-center transition-colors",
                  overlay
                    ? "text-white bg-surface hover:bg-surface"
                    : "text-ink-muted bg-surface-low hover:bg-surface-mid hover:text-ink"
                )}
              >
                <MessageSquare size={16} />
              </a>
              <a
                href="mailto:danycleanenpro@gmail.com"
                title="Email us"
                className={cn(
                  "w-10 h-10 flex items-center justify-center transition-colors",
                  overlay
                    ? "text-white bg-surface hover:bg-surface"
                    : "text-ink-muted bg-surface-low hover:bg-surface-mid hover:text-ink"
                )}
              >
                <Mail size={16} />
              </a>
            </div>

            <a 
              href="#quote" 
              onClick={(e) => handleLinkClick(e, '#quote')}
              className={cn(
                "inline-flex items-center justify-center text-label-md uppercase px-6 py-3.5 transition-colors whitespace-nowrap",
                overlay
                  ? "bg-surface text-ink hover:bg-surface"
                  : "bg-accent text-white hover:bg-accent-strong"
              )}
            >
              Get Free Estimate
            </a>
          </div>

          {/* Compact actions */}
          <div className="flex items-center gap-2 md:hidden">
            <a 
              href={`tel:${businessPhone.replace(/\D/g, '')}`} 
              onClick={triggerAICall}
              title="Call us"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors",
                overlay ? "text-white bg-surface" : "text-ink-muted bg-surface-low"
              )}
            >
              <Phone size={16} />
            </a>
            <a 
              href="#quote" 
              onClick={(e) => handleLinkClick(e, '#quote')}
              className={cn(
                "inline-flex items-center justify-center text-label-sm uppercase px-4 py-3 transition-colors",
                overlay ? "bg-surface text-ink" : "bg-accent text-white"
              )}
            >
              Estimate
            </a>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors",
                overlay ? "text-white bg-surface" : "text-white bg-ink"
              )}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Tablet menu trigger */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
            className={cn(
              "hidden md:flex xl:hidden w-10 h-10 items-center justify-center transition-colors",
              overlay ? "text-white bg-surface" : "text-ink-muted bg-surface-low hover:text-ink"
            )}
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </Container>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full inset-x-0 bg-surface border-b border-rule xl:hidden overflow-hidden"
          >
            <Container>
              <div className="py-10">
                <nav className="flex flex-col divide-y divide-rule-soft border-y border-rule-soft mb-10">
                  {navLinks.map((link) => (
                    <a 
                      key={link.name} 
                      href={link.href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="flex items-center justify-between py-4 group"
                    >
                      <span className="font-display text-headline-sm text-ink group-hover:text-accent transition-colors">
                        {link.name}
                      </span>
                      <ArrowRight size={16} className="text-ink-faint group-hover:text-accent transition-colors" />
                    </a>
                  ))}
                </nav>

                <span className="block text-label-sm uppercase text-accent mb-4">Direct Contact</span>
                <div className="flex flex-col gap-3">
                  <a 
                    href={`tel:${businessPhone.replace(/\D/g, '')}`} 
                    onClick={(e) => {
                      setIsOpen(false);
                      triggerAICall(e);
                    }}
                    className="flex items-center gap-4 bg-surface-low px-5 py-4 hover:bg-surface-mid transition-colors"
                  >
                    <Phone size={18} className="text-accent shrink-0" />
                    <span>
                      <span className="block text-label-sm uppercase text-ink-faint">Call the office</span>
                      <span className="block text-body-md font-semibold text-ink">{businessPhone}</span>
                    </span>
                  </a>

                  <a 
                    href={getSmsUrl()} 
                    onClick={(e) => {
                      setIsOpen(false);
                      handleSMSLaunch(e);
                    }}
                    className="flex items-center gap-4 bg-surface-low px-5 py-4 hover:bg-surface-mid transition-colors"
                  >
                    <MessageSquare size={18} className="text-accent shrink-0" />
                    <span>
                      <span className="block text-label-sm uppercase text-ink-faint">Text us</span>
                      <span className="block text-body-md font-semibold text-ink">+1 (218) 357-5938</span>
                    </span>
                  </a>

                  <a 
                    href="mailto:danycleanenpro@gmail.com" 
                    className="flex items-center gap-4 bg-surface-low px-5 py-4 hover:bg-surface-mid transition-colors"
                  >
                    <Mail size={18} className="text-accent shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-label-sm uppercase text-ink-faint">Email us</span>
                      <span className="block text-body-md font-semibold text-ink truncate">danycleanenpro@gmail.com</span>
                    </span>
                  </a>
                </div>

                <a 
                  href="#quote" 
                  onClick={(e) => handleLinkClick(e, '#quote')}
                  className="mt-6 w-full bg-accent text-white py-4 text-label-md uppercase flex items-center justify-center gap-3 hover:bg-accent-strong transition-colors"
                >
                  Get Free Estimate <ArrowRight size={16} />
                </a>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
