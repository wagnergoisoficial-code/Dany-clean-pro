import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, LogOut, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from './ui/Container';
import { useAdminAuth } from '../lib/auth';
import { useConfig } from '../hooks/useConfig';
import { useSetting } from '../lib/settings';

export default function Footer() {
  const { user, logout } = useAdminAuth();
  const { businessPhone } = useConfig();
  const { value: appLogo } = useSetting('app_logo');

  const triggerAICall = (e: React.MouseEvent) => {
    // allow native action while triggering internal event
    window.dispatchEvent(new CustomEvent('trigger-ai-call'));
  };

  return (
    <footer className="w-full bg-surface-low border-t border-rule py-16">
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 mb-16">
          <div className="max-w-md">
            <Link to="/" className="inline-block mb-4">
              {appLogo ? (
                <img src={appLogo} alt="Dany Clean Pro" className="h-12 w-auto object-contain mb-3" />
              ) : null}
              <span className="block font-display text-headline-md text-ink tracking-tight">
                Dany Clean Pro
              </span>
            </Link>
            <p className="text-body-md text-ink-muted">
              Residential and commercial cleaning for Connecticut homes and businesses since 2014.
              Meticulous, discreet, family-owned care — quality you can trust at prices you can afford.
            </p>
            <div className="flex gap-3 mt-6">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center bg-surface text-ink-muted hover:bg-ink hover:text-white transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16 lg:gap-20">
            <div className="flex flex-col gap-3">
              <span className="text-label-md uppercase text-accent">Navigate</span>
              <a href="#services" className="text-body-md text-ink hover:text-accent transition-colors whitespace-nowrap">Cleaning Services</a>
              <a href="#gallery" className="text-body-md text-ink hover:text-accent transition-colors whitespace-nowrap">Our Gallery</a>
              <a href="#reviews" className="text-body-md text-ink hover:text-accent transition-colors whitespace-nowrap">Reviews</a>
              <a href="#areas" className="text-body-md text-ink hover:text-accent transition-colors whitespace-nowrap">Service Areas</a>
              <a href="#quote" className="text-body-md text-ink hover:text-accent transition-colors whitespace-nowrap">Request Estimate</a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-label-md uppercase text-accent">Direct Contact</span>
              <a
                href={`tel:${businessPhone.replace(/\D/g, '')}`}
                onClick={triggerAICall}
                className="text-body-md text-ink hover:text-accent transition-colors flex items-center gap-2"
              >
                <Phone size={14} className="text-ink-faint" /> {businessPhone}
              </a>
              <a
                href="mailto:danycleanenpro@gmail.com"
                className="text-body-md text-ink hover:text-accent transition-colors flex items-center gap-2 break-all"
              >
                <Mail size={14} className="text-ink-faint shrink-0" /> danycleanenpro@gmail.com
              </a>
              <span className="text-body-md text-ink flex items-center gap-2">
                <MapPin size={14} className="text-ink-faint" /> Stamford, CT &amp; surrounding areas
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-label-md uppercase text-accent">Working Hours</span>
              <span className="text-body-md text-ink flex justify-between gap-8 whitespace-nowrap">
                <span className="text-ink-muted">Mon – Fri</span> 8am – 6pm
              </span>
              <span className="text-body-md text-ink flex justify-between gap-8 whitespace-nowrap">
                <span className="text-ink-muted">Saturday</span> 9am – 4pm
              </span>
              <span className="text-body-md text-ink flex justify-between gap-8 whitespace-nowrap">
                <span className="text-ink-muted">Sunday</span> Open for bookings
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-rule flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-label-sm uppercase text-ink-faint">
            © {new Date().getFullYear()} Dany Clean Pro. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy-policy" className="text-label-sm uppercase text-ink-muted hover:text-ink transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-label-sm uppercase text-ink-muted hover:text-ink transition-colors">
              Terms &amp; Conditions
            </Link>

            {/* Admin Authentication */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/dashboard"
                  target="_blank"
                  className="flex flex-col bg-surface px-4 py-2 hover:bg-surface-mid transition-colors"
                >
                  <span className="text-label-sm uppercase text-accent">Admin Dashboard</span>
                  <span className="text-body-sm text-ink truncate max-w-[200px]">{user.email}</span>
                </Link>
                <button
                  onClick={logout}
                  title="Logout"
                  className="w-10 h-10 flex items-center justify-center bg-surface text-ink-muted hover:bg-ink hover:text-white transition-colors"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                target="_blank"
                className="flex items-center gap-2 text-label-sm uppercase text-ink-muted hover:text-ink transition-colors"
              >
                <Lock size={12} /> Admin Login
              </Link>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}
