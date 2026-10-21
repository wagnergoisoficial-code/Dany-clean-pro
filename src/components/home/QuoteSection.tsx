import React, { useEffect, useState } from 'react';
import { PhoneCall, MessageSquareText, Mail, MapPin, type LucideIcon } from 'lucide-react';
import LeadForm from '../landing/LeadForm';
import { useConfig } from '../../hooks/useConfig';
import { smsHref, SMS_NUMBER_DISPLAY } from '../../lib/smsLine';
import { QUOTE_EVENT, type QuoteDefaults } from '../../lib/quote';
import { triggerAICall, handleSMSLaunch } from '../../lib/contact';
import SiteContainer from './SiteContainer';

const EMAIL = 'danycleanenpro@gmail.com';

/**
 * The quote request and every way to reach Dany.
 *
 * Not in the reference — the owner asked for the form and the contacts on the
 * page — so it is built only from the reference's own parts: the centred navy
 * heading of "Why Choose Us?", the outline-icon contact blocks of the header,
 * and the white, deep-shadowed card of the service strip.
 *
 * Every "Free Quote" on the site lands here, and a service card or the
 * footer's e-mail field arrives with its choice already filled in. The e-mails
 * Dany's automations send link to /#quote, which is this section's id.
 */
export default function QuoteSection() {
  const { businessPhone } = useConfig();
  const [prefill, setPrefill] = useState<QuoteDefaults & { nonce: number }>({ nonce: 0 });

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<QuoteDefaults>).detail || {};
      setPrefill(prev => ({ ...detail, nonce: prev.nonce + 1 }));
      document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener(QUOTE_EVENT, onOpen);
    return () => window.removeEventListener(QUOTE_EVENT, onOpen);
  }, []);

  const tel = `tel:${businessPhone.replace(/\D/g, '')}`;
  const contacts: Array<{ Icon: LucideIcon; title: string; value: string; note: string; href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }> = [
    {
      Icon: PhoneCall, title: 'Call Dany', value: businessPhone, note: 'Mon–Fri 8am–6pm · Sat 9am–4pm', href: tel,
      onClick: triggerAICall,
    },
    { Icon: MessageSquareText, title: 'Text Us', value: SMS_NUMBER_DISPLAY, note: 'Text messages only', href: smsHref(), onClick: handleSMSLaunch },
    { Icon: Mail, title: 'Email', value: EMAIL, note: 'Dany replies personally', href: `mailto:${EMAIL}` },
    { Icon: MapPin, title: 'Service Area', value: 'Waterbury, Connecticut', note: 'All of Connecticut & select MA cities', href: '' },
  ];

  return (
    <section id="quote" className="scroll-mt-6 bg-white pb-[100px] pt-[100px] lg:pb-[120px] lg:pt-[125px]">
      <SiteContainer>
        <h2 className="text-center text-[28px] font-bold leading-tight text-site-navy lg:text-[33px]">
          Request Your Free Estimate
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-center text-[14.5px] leading-[1.85] text-site-text">
          Tell us about your home or office. Dany will get back to you within 30 minutes to confirm the day
          and send the exact price.
        </p>

        <div className="mt-[60px] grid gap-12 lg:mt-[70px] lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-[75px]">
          <ul className="grid content-start gap-8 sm:grid-cols-2 lg:grid-cols-1 lg:gap-9 lg:pt-6">
            {contacts.map(({ Icon, title, value, note, href, onClick }) => {
              const body = (
                <>
                  <Icon size={30} strokeWidth={1.25} className="mt-0.5 shrink-0 text-[#9fadbd] transition-colors group-hover:text-site-blue" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold uppercase tracking-[0.06em] text-site-navy">{title}</span>
                    <span className="mt-1.5 block break-words text-[15px] font-semibold text-site-navy transition-colors group-hover:text-site-blue">{value}</span>
                    <span className="mt-1 block text-[12.5px] font-medium text-site-text">{note}</span>
                  </span>
                </>
              );
              return (
                <li key={title}>
                  {href ? (
                    <a href={href} onClick={onClick} className="group flex items-start gap-4">{body}</a>
                  ) : (
                    <div className="flex items-start gap-4">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="bg-white p-6 shadow-[0_30px_60px_-24px_rgba(7,37,79,0.28)] sm:p-10">
            <LeadForm prefill={prefill} />
          </div>
        </div>
      </SiteContainer>
    </section>
  );
}
