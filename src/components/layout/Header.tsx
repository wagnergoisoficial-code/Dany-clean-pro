import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PhoneCall, MessageSquareText, Phone, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useConfig } from '../../hooks/useConfig';
import { useSetting } from '../../lib/settings';
import { DEFAULT_LOGO, usableLogo } from '../../lib/brand';
import { smsHref, SMS_NUMBER_DISPLAY } from '../../lib/smsLine';
import { openQuote, scrollToSection } from '../../lib/quote';
import { triggerAICall, handleSMSLaunch } from '../../lib/contact';
import SiteContainer from '../home/SiteContainer';

/**
 * The site header, as the approved reference draws it: the mark and two
 * contact blocks on top, a ruled row of labelled links beneath.
 *
 * On the home page it lies over the hero photograph and scrolls away with it —
 * the reference has no bar that follows the reader. Every other page has no
 * photograph to lie on, so there it stands on the navy of the site.
 */

type NavItem = { label: string; sub: string; go: () => void };

export function SiteLogo({ className }: { className?: string }) {
  const { value: storedLogo } = useSetting('app_logo', DEFAULT_LOGO);
  const logo = usableLogo(storedLogo);
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <img src={logo} alt="" className="h-12 w-auto object-contain lg:h-14" />
      <span className="leading-none">
        <span className="block text-[17px] font-semibold tracking-[-0.01em] text-white lg:text-[19px]">Dany Clean Pro</span>
        <span className="mt-1.5 block text-[11px] font-medium tracking-[0.04em] text-white/65">Professional Cleaning</span>
      </span>
    </span>
  );
}

export default function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { businessPhone } = useConfig();
  const tel = `tel:${businessPhone.replace(/\D/g, '')}`;
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  const nav: NavItem[] = [
    { label: 'Home', sub: 'Main Page', go: () => scrollToSection('top') },
    { label: 'About', sub: 'Who We Are', go: () => scrollToSection('about') },
    { label: 'Services', sub: 'What We Clean', go: () => scrollToSection('services') },
    { label: 'Why Us', sub: 'Our Promise', go: () => scrollToSection('why') },
    { label: 'Quote', sub: 'Free Estimate', go: () => openQuote() },
    { label: 'Contact Us', sub: 'Get in Touch', go: () => scrollToSection('contact') },
  ];

  const follow = (item: NavItem) => {
    setOpen(false);
    item.go();
  };

  return (
    <header
      className={cn(
        'z-30 w-full font-site',
        isHome ? 'absolute inset-x-0 top-0' : 'relative bg-site-deep',
      )}
    >
      <SiteContainer>
        <div className="flex h-[92px] items-center justify-between gap-6 lg:h-[104px]">
          <Link
            to="/"
            onClick={(e) => {
              if (isHome) { e.preventDefault(); scrollToSection('top'); }
            }}
            aria-label="Dany Clean Pro — home"
            className="shrink-0"
          >
            <SiteLogo />
          </Link>

          <div className="hidden items-center gap-12 lg:flex">
            <a href={tel} onClick={triggerAICall} className="group flex items-center gap-3.5">
              <PhoneCall size={30} strokeWidth={1.25} className="text-white/60 transition-colors group-hover:text-white" />
              <span className="leading-none">
                <span className="block text-[14px] font-semibold text-white">{businessPhone}</span>
                <span className="mt-1.5 block text-[12px] font-medium text-white/55">Call Dany · Mon–Sat</span>
              </span>
            </a>
            <a href={smsHref()} onClick={handleSMSLaunch} className="group flex items-center gap-3.5">
              <MessageSquareText size={30} strokeWidth={1.25} className="text-white/60 transition-colors group-hover:text-white" />
              <span className="leading-none">
                <span className="block text-[13px] font-semibold uppercase tracking-[0.04em] text-white">Text Us</span>
                <span className="mt-1.5 block text-[12px] font-medium text-white/55">{SMS_NUMBER_DISPLAY}</span>
              </span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-11 w-11 items-center justify-center text-white lg:hidden"
          >
            {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>

        {/* The ruled row of links. The short blue bar on the rule marks the page you are on. */}
        <nav aria-label="Main" className="hidden border-t border-white/20 lg:block">
          <ul className="grid grid-cols-6">
            {nav.map((item, i) => (
              <li key={item.label} className="relative">
                {i === 0 && <span aria-hidden className="absolute -top-px left-0 h-[3px] w-[136px] bg-site-blue" />}
                {i > 0 && <span aria-hidden className="absolute left-[-18px] top-1/2 h-8 w-px -translate-y-1/2 bg-white/15" />}
                <button
                  type="button"
                  onClick={() => follow(item)}
                  className="group block w-full py-[18px] text-left"
                >
                  <span className="block text-[12.5px] font-semibold uppercase leading-none tracking-[0.05em] text-white transition-colors group-hover:text-white/75">
                    {item.label}
                  </span>
                  <span className="mt-2 block text-[11.5px] font-medium leading-none text-white/55">{item.sub}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </SiteContainer>

      {/* Phones and tablets: the same links, stacked, under the bar. */}
      {open && (
        <div className="absolute inset-x-0 top-[92px] z-40 bg-site-deep shadow-[0_24px_40px_-16px_rgba(4,19,42,0.6)] lg:hidden">
          <SiteContainer className="pb-8">
            <ul className="divide-y divide-white/10 border-t border-white/15">
              {nav.map(item => (
                <li key={item.label}>
                  <button type="button" onClick={() => follow(item)} className="block w-full py-4 text-left">
                    <span className="block text-[14px] font-semibold uppercase tracking-[0.05em] text-white">{item.label}</span>
                    <span className="mt-1 block text-[12.5px] font-medium text-white/55">{item.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <a
                href={tel}
                onClick={() => { setOpen(false); triggerAICall(); }}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[12.5px] font-semibold uppercase tracking-[0.08em] text-site-blue"
              >
                <Phone size={15} /> Call
              </a>
              <a
                href={smsHref()}
                onClick={(e) => { setOpen(false); handleSMSLaunch(e); }}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-site-blue text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white"
              >
                <MessageSquare size={15} /> Text
              </a>
            </div>
          </SiteContainer>
        </div>
      )}
    </header>
  );
}
