import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Phone, MessageSquare, Mail } from 'lucide-react';
import { useConfig } from '../hooks/useConfig';
import { smsHref } from '../lib/smsLine';
import { openQuote, scrollToSection } from '../lib/quote';
import { triggerAICall, handleSMSLaunch } from '../lib/contact';
import { SiteLogo } from './layout/Header';
import SiteContainer from './home/SiteContainer';
import { STRIP_SERVICES } from './home/content';

const EMAIL = 'danycleanenpro@gmail.com';

/**
 * The footer, after the reference: the mark, a line about the business and
 * three square buttons; two columns of links; and a field with a blue button.
 *
 * The squares were social links in the reference. The business has no
 * accounts to link to, so they call, text and e-mail Dany instead. The field
 * was a newsletter; here it takes an e-mail address to the quote request.
 * The privacy policy and terms, which the SMS consent points to, and the team
 * login stay in the second column.
 */
export default function Footer() {
  const { businessPhone } = useConfig();
  const [email, setEmail] = useState('');

  const linkClass = 'group flex items-center gap-2.5 text-[13.5px] font-medium text-white/75 transition-colors hover:text-white';
  const chevron = <ChevronRight size={13} strokeWidth={2} className="text-white/45 transition-colors group-hover:text-site-blue" />;

  const squares = [
    { Icon: Phone, label: `Call ${businessPhone}`, href: `tel:${businessPhone.replace(/\D/g, '')}`, onClick: triggerAICall },
    { Icon: MessageSquare, label: 'Send a text message', href: smsHref(), onClick: handleSMSLaunch },
    { Icon: Mail, label: `E-mail ${EMAIL}`, href: `mailto:${EMAIL}` },
  ];

  const company = [
    { label: 'Get a Free Quote', go: () => openQuote() },
    { label: 'Why Choose Us', go: () => scrollToSection('why') },
    { label: 'About Us', go: () => scrollToSection('about') },
    { label: 'Contact Dany', go: () => scrollToSection('quote') },
  ];

  return (
    <footer id="contact" className="border-t-[10px] border-white bg-site-night font-site">
      <SiteContainer className="grid gap-12 pb-[120px] pt-[90px] lg:pb-[70px] sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.86fr] lg:gap-x-0 lg:pt-[100px]">
        <div>
          <Link to="/" aria-label="Dany Clean Pro — home"><SiteLogo /></Link>
          <p className="mt-7 max-w-[290px] text-[13.5px] leading-[1.85] text-white/80">
            Professional residential and commercial cleaning, based in Waterbury and serving homes and
            businesses across Connecticut for over five years.
          </p>
          <div className="mt-8 flex gap-2">
            {squares.map(({ Icon, label, href, onClick }) => (
              <a
                key={label}
                href={href}
                onClick={onClick}
                aria-label={label}
                title={label}
                className="flex h-12 w-12 items-center justify-center bg-site-night-raised text-white transition-colors hover:bg-site-blue"
              >
                <Icon size={16} strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[15px] font-semibold text-white">Services</h3>
          <ul className="mt-6 space-y-3.5">
            {STRIP_SERVICES.map(({ title, service }) => (
              <li key={title}>
                <button type="button" onClick={() => openQuote({ service_type: service })} className={linkClass}>
                  {chevron}{title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[15px] font-semibold text-white">Company</h3>
          <ul className="mt-6 space-y-3.5">
            {company.map(item => (
              <li key={item.label}>
                <button type="button" onClick={item.go} className={linkClass}>{chevron}{item.label}</button>
              </li>
            ))}
            <li><Link to="/reviews" className={linkClass}>{chevron}Client Reviews</Link></li>
            <li><Link to="/privacy-policy" className={linkClass}>{chevron}Privacy Policy</Link></li>
            <li><Link to="/terms" className={linkClass}>{chevron}Terms &amp; Conditions</Link></li>
            {/* Signed in already, /admin/login goes straight to the dashboard.
                Checking here would put sign-in code on every public page. */}
            <li>
              <Link to="/admin/login" target="_blank" className={linkClass}>{chevron}Team Login</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[15px] font-semibold text-white">Free Estimate</h3>
          <p className="mt-6 text-[13.5px] leading-[2] text-white/80">
            Leave your e-mail and tell us about your home. Dany sends the exact price within 30 minutes.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              openQuote({ email: email.trim() });
            }}
            className="mt-6 flex"
          >
            <label htmlFor="footer-email" className="sr-only">Your e-mail</label>
            <input
              id="footer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your e-mail"
              className="h-[46px] min-w-0 flex-1 bg-white px-4 text-[13.5px] font-medium text-site-navy placeholder:font-normal placeholder:text-[#a3acb9] outline-none focus:ring-2 focus:ring-inset focus:ring-site-blue"
            />
            <button
              type="submit"
              aria-label="Continue to the quote request"
              className="flex h-[46px] w-[68px] shrink-0 items-center justify-center bg-site-blue text-white transition-colors hover:bg-site-blue-strong"
            >
              <ChevronRight size={18} strokeWidth={2.25} />
            </button>
          </form>
        </div>
      </SiteContainer>
    </footer>
  );
}
