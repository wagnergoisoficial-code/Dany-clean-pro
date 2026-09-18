import React from 'react';
import { MessageSquare, PhoneCall, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Container from '../ui/Container';
import { useConfig } from '../../hooks/useConfig';

export default function ContactShowcase() {
  const { businessPhone } = useConfig();
  const formattedPhone = "+1 (218) 357-5938";

  const getSmsUrl = () => {
    const isIOS = typeof window !== 'undefined' && (
      /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
    const separator = isIOS ? '&' : '?';
    return `sms:+12183575938${separator}body=Hi,%20I%20would%20like%20a%20cleaning%20quote.`;
  };

  const triggerAICall = (e: React.MouseEvent) => {
    // Dispatch global event for interactive voice call popup, allowing native protocol too
    window.dispatchEvent(new CustomEvent('trigger-ai-call'));
  };

  const handleSMSLaunch = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-sms-fallback'));
    }
  };

  const channels = [
    {
      id: 'channel-sms-box',
      icon: MessageSquare,
      title: 'SMS Receptionist',
      label: 'Instant · Recommended',
      description:
        'Text us for instant cleaning quotes and support. Your native messages app opens a live chat with Jennifer, our automated booking assistant.',
      valueLabel: 'Official SMS channel',
      value: formattedPhone,
      action: 'Text Us Now',
      href: getSmsUrl(),
      onClick: handleSMSLaunch
    },
    {
      id: 'channel-phone-box',
      icon: PhoneCall,
      title: 'AI Call Line',
      label: 'AI Voice · Immediate',
      description:
        'Speak with our smart call operator right away. Ideal for estimating complex or custom cleaning specifications over the phone.',
      valueLabel: 'Direct office phone',
      value: businessPhone,
      action: 'Call the Office',
      href: `tel:${businessPhone.replace(/\D/g, '')}`,
      onClick: triggerAICall
    },
    {
      id: 'channel-email-box',
      icon: Mail,
      title: 'Email Support',
      label: 'Reply within 24h',
      description:
        'Send business inquiries, property-manager requests or custom contract cleaning specifications to our operations desk.',
      valueLabel: 'Operations email',
      value: 'danycleanenpro@gmail.com',
      action: 'Email Support',
      href: 'mailto:danycleanenpro@gmail.com',
      onClick: undefined
    }
  ];

  return (
    <section className="w-full bg-surface-low py-16 lg:py-24">
      <Container>
        <div className="max-w-2xl mb-12">
          <span className="block text-label-sm uppercase text-accent mb-3">Instant Digital Support</span>
          <h2 className="font-display text-headline-md lg:text-headline-lg text-ink">
            Connect instantly. Get booked in seconds.
          </h2>
          <p className="text-body-md text-ink-muted mt-3">
            Whether you prefer texting, calling or email, our booking assistants and professional
            team are online and ready to help.
          </p>
        </div>

        <div className="flex flex-col divide-y divide-rule border-y border-rule">
          {channels.map((channel, index) => (
            <div
              key={channel.id}
              id={channel.id}
              className="group grid grid-cols-1 lg:grid-cols-12 gap-6 items-baseline py-8 px-4 -mx-4 hover:bg-surface transition-colors"
            >
              <div className="lg:col-span-1">
                <span className="text-label-md text-accent tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="lg:col-span-4 flex items-start gap-4">
                <channel.icon size={20} className="text-accent shrink-0 mt-1.5" />
                <div>
                  <h3 className="font-display text-headline-sm text-ink">{channel.title}</h3>
                  <span className="inline-block text-label-sm uppercase text-ink-faint mt-1.5">
                    {channel.label}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4">
                <p className="text-body-md text-ink-muted">{channel.description}</p>
                <p className="mt-3 text-body-sm">
                  <span className="text-label-sm uppercase text-ink-faint mr-2">{channel.valueLabel}</span>
                  <span className="font-semibold text-ink break-all">{channel.value}</span>
                </p>
              </div>

              <div className="lg:col-span-3 lg:text-right">
                <a
                  href={channel.href}
                  onClick={channel.onClick}
                  className="inline-flex items-center justify-center gap-2 text-label-md uppercase px-6 py-3.5 bg-ink text-white hover:bg-accent transition-colors"
                >
                  {channel.action} <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-surface px-6 py-6 flex items-start sm:items-center gap-4">
          <ShieldCheck size={22} className="text-accent shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <p className="text-label-md uppercase text-ink mb-1">Secure operations &amp; satisfaction</p>
            <p className="text-body-sm text-ink-muted">
              All digital communication runs over secure, TCPA-compliant channels. Your details are
              protected under our published privacy policy.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
