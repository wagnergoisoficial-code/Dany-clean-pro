import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Phone, MessageSquare } from 'lucide-react';
import { useConfig } from '../hooks/useConfig';
import { smsHref } from '../lib/smsLine';
import { triggerAICall, handleSMSLaunch } from '../lib/contact';
import { track } from '../lib/metaPixel';
import { takeSentRequest } from '../lib/thankYou';
import SiteContainer from '../components/home/SiteContainer';

/**
 * /thank-you — where the quote form lands once the request is stored (see
 * lib/thankYou.ts for why it is a page of its own).
 *
 * Kept out of search results: it is the end of a form, not a page to arrive
 * at. Drawn in the site's design, on the navy band of the reviews page.
 */
export default function ThankYou() {
  const { businessPhone } = useConfig();
  const [name, setName] = useState('');

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Thank You — Dany Clean Pro';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);

    const sent = takeSentRequest();
    if (sent) {
      track('Lead', { content_name: 'Quote form' });
      setName(sent.name.trim().split(/\s+/)[0] || '');
    }

    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, []);

  return (
    <section className="flex min-h-[72vh] items-center bg-site-deep py-[80px] font-site lg:py-[110px]">
      <SiteContainer className="text-center">
        <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-site-blue text-white shadow-[0_18px_40px_-14px_rgba(13,118,242,0.8)]">
          <CheckCircle size={34} strokeWidth={1.75} />
        </span>
        <h1 className="mt-8 text-[32px] font-bold leading-tight text-white lg:text-[42px]">
          Thank you{name ? `, ${name}` : ''}!
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.85] text-white/80">
          Your request was received. Dany will get back to you within 30 minutes to confirm the day and
          send the exact price. The estimate is completely free.
        </p>
        <p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-[1.8] text-white/60">
          A confirmation is on its way to your e-mail. Need us sooner? Call or text.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={`tel:${businessPhone.replace(/\D/g, '')}`}
            onClick={triggerAICall}
            className="inline-flex h-[52px] w-full max-w-[320px] items-center justify-center gap-2.5 rounded-full sm:w-auto sm:min-w-[220px] sm:max-w-none bg-white px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-site-blue transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-[#eef5ff] active:scale-[0.98]"
          >
            <Phone size={16} /> Call {businessPhone}
          </a>
          <a
            href={smsHref()}
            onClick={handleSMSLaunch}
            className="inline-flex h-[52px] w-full max-w-[320px] items-center justify-center gap-2.5 rounded-full sm:w-auto sm:min-w-[220px] sm:max-w-none bg-site-blue px-9 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-12px_rgba(13,118,242,0.7)] transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-site-blue-strong active:scale-[0.98]"
          >
            <MessageSquare size={16} /> Text Us
          </a>
        </div>

        <Link
          to="/"
          className="mt-9 inline-block border-b border-white/30 pb-1 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/70 transition-colors hover:text-white"
        >
          Back to home
        </Link>
      </SiteContainer>
    </section>
  );
}
