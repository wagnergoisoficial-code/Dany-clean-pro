import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Lock } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useConfig } from '../../hooks/useConfig';
import { track } from '../../lib/metaPixel';
import type { QuoteDefaults } from '../../lib/quote';
import { fieldClass, labelClass, SERVICES } from '../../lib/forms';

/**
 * Mirror a Firestore-written lead into the operations inbox.
 * Fire and forget — failures are logged, never surfaced to the client.
 */
function notifyByEmail(payload: Record<string, any>) {
  try {
    const body = JSON.stringify(payload);
    const url = '/api/notify-lead';
    // sendBeacon survives the page being closed right after submitting
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const queued = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      if (queued) return;
    }
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(err => console.warn('Lead e-mail notification failed:', err));
  } catch (err) {
    console.warn('Lead e-mail notification failed:', err);
  }
}

interface LeadFormProps {
  /**
   * A choice made elsewhere on the page — a service card, the footer's e-mail
   * field. `nonce` changes on every request, so choosing the same card twice
   * still applies. It fills those fields only and leaves the rest as typed.
   */
  prefill?: QuoteDefaults & { nonce: number };
}

export default function LeadForm({ prefill }: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const { businessPhone } = useConfig();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form || !prefill?.nonce) return;
    const service = form.elements.namedItem('service_type') as HTMLSelectElement | null;
    if (service && prefill.service_type && SERVICES.includes(prefill.service_type)) {
      service.value = prefill.service_type;
    }
    const email = form.elements.namedItem('email') as HTMLInputElement | null;
    if (email && prefill.email && !email.value) email.value = prefill.email;
    const name = form.elements.namedItem('name') as HTMLInputElement | null;
    // After the scroll has started, so the jump to the field does not cut it short.
    const timer = window.setTimeout(() => name?.focus({ preventScroll: true }), 450);
    return () => window.clearTimeout(timer);
  }, [prefill]);

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      // 10s Timeout logic
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Lead submission timed out. Please try again or call us.')), 10000)
      );

      const submissionPromise = (async () => {
        try {
          // Rule 1: Always prioritize direct Firestore if initialized
          if (isFirebaseReady()) {
             console.log('LeadForm: Firebase ready - attempting direct Firestore submission');
             try {
               const docRef = await addDoc(collection(db, 'leads'), {
                 ...formData,
                 bedrooms: Number(formData.bedrooms) || formData.bedrooms,
                 bathrooms: Number(formData.bathrooms) || formData.bathrooms,
                 status: 'new',
                 createdAt: serverTimestamp(),
                 source: 'direct-client-firestore-priority'
               });
               console.log('LeadForm: Firestore submission successful, ID:', docRef.id);
               // The API never sees this path, so the inbox notification is
               // fired here. Deliberately not awaited: a mail problem must not
               // hold up — or fail — a booking the client already completed.
               notifyByEmail({ ...formData, leadId: docRef.id, source: 'website-form' });
               return { success: true, id: docRef.id };
             } catch (fsErr) {
               console.warn('LeadForm: Firestore submission failed, falling back to API:', fsErr);
               // Fall through to API fallback
             }
          }

          // Fallback: use API if Firebase is not ready or failed
          console.log('LeadForm: Using API submission fallback');
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          
          if (!response.ok) {
            throw new Error('API failed');
          }
          
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
          }
          return { success: true };
        } catch (err) {
          console.warn('Primary submission failed:', err);
          throw err;
        }
      })();

      return Promise.race([submissionPromise, timeoutPromise]);
    },
    onSuccess: () => {
      setSubmitted(true);
      // Counted only once the request is safely stored, so the ads optimise
      // for quotes that reached the inbox, not for clicks on a button.
      track('Lead', { content_name: 'Quote form' });
    },
    onError: (error: any) => {
      console.error("Submission error details:", error);
      // We don't need a separate state, mutation.isError handles it
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mutation.isPending) return;
    
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    // Marketing Attribution - Módulo 1: Capture UTM queries from URL search params
    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = urlParams.get('utm_source') || '';
    const utm_medium = urlParams.get('utm_medium') || '';
    const utm_campaign = urlParams.get('utm_campaign') || '';

    const data = {
      ...rawData,
      utm_source,
      utm_medium,
      utm_campaign
    };
    
    mutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-site-blue text-white">
          <CheckCircle size={30} strokeWidth={1.75} />
        </div>
        <h3 className="mb-3 text-[22px] font-bold text-site-navy">Request received</h3>
        <p className="mb-8 max-w-md text-[14.5px] leading-[1.85] text-site-text">
          Thank you. Dany has your request and will get back to you within 30 minutes to confirm the day
          and send the exact price. A confirmation is on its way to your e-mail.
        </p>
        <div className="mb-8 w-full max-w-md bg-site-mist p-5 text-left">
          <p className="text-[14px] font-semibold text-site-navy">
            <span className="mb-1 block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-site-text">Call Dany</span>
            {businessPhone}
          </p>
          <p className="mt-3 text-[14px] font-semibold text-site-navy">
            <span className="mb-1 block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-site-text">Email</span>
            danycleanenpro@gmail.com
          </p>
        </div>
        <button 
          onClick={() => setSubmitted(false)}
          className="border-b border-site-blue/40 pb-1 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-site-blue transition-colors hover:text-site-blue-strong"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className={labelClass} htmlFor="lead-name">Your Full Name *</label>
          <input 
            required
            id="lead-name"
            name="name"
            placeholder="e.g. Sarah Smith"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col">
          <label className={labelClass} htmlFor="lead-phone">Phone Number *</label>
          <input 
            required
            type="tel"
            id="lead-phone"
            name="phone"
            placeholder="e.g. (203) 555-0142"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label className={labelClass} htmlFor="lead-email">Email Address *</label>
        <input 
          required
          type="email"
          id="lead-email"
          name="email"
          placeholder="sarah@example.com"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className={labelClass} htmlFor="lead-city">Connecticut City *</label>
          <input 
            required
            id="lead-city"
            name="city"
            placeholder="e.g. Stamford"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col">
          <label className={labelClass} htmlFor="lead-service">Service Type</label>
          <select 
            id="lead-service"
            name="service_type"
            className={cn(fieldClass, "select-chevron appearance-none cursor-pointer")}
          >
            {SERVICES.map(option => <option key={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className={labelClass} htmlFor="lead-bedrooms">Bedrooms</label>
          <select id="lead-bedrooms" name="bedrooms" className={cn(fieldClass, "select-chevron appearance-none cursor-pointer")}>
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Bedroom{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className={labelClass} htmlFor="lead-bathrooms">Bathrooms</label>
          <select id="lead-bathrooms" name="bathrooms" className={cn(fieldClass, "select-chevron appearance-none cursor-pointer")}>
            {[1,1.5,2,2.5,3,3.5,4].map(n => <option key={n} value={n}>{n} Bathroom{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      {/* TCR / A2P 10DLC Compliant SMS Consent Section */}
      <div className="flex items-start gap-3 rounded-[3px] bg-site-mist p-5">
        <input 
          type="checkbox"
          id="sms_consent"
          name="sms_consent"
          checked={smsConsent}
          onChange={(e) => setSmsConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-site-blue)]"
        />
        <label htmlFor="sms_consent" className="select-none text-[12.5px] leading-[1.7] text-site-text">
          By checking this box and submitting this form, you agree to receive SMS messages from Dany Clean Pro / Brazilian Clean about your cleaning service request, estimates, and appointment updates. Message frequency varies. Message and data rates may apply. Reply HELP for help, reply STOP to opt out. View our{' '}
          <Link to="/privacy-policy" className="font-semibold text-site-blue hover:underline">Privacy Policy</Link>
          {' '}and{' '}
          <Link to="/terms" className="font-semibold text-site-blue hover:underline">Terms &amp; Conditions</Link>.
        </label>
      </div>

      <div className="flex flex-col items-start gap-4">
        <button 
          type="submit"
          disabled={mutation.isPending}
          className={cn(
            "relative inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-full bg-site-blue px-10 text-[13px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_-12px_rgba(13,118,242,0.7)] transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-site-blue-strong active:scale-[0.98] sm:w-auto",
            mutation.isPending && "opacity-70 cursor-not-allowed"
          )}
        >
          <span className={cn("flex items-center gap-3 transition-opacity", mutation.isPending ? "opacity-0" : "opacity-100")}>
            Request Free Estimate <ArrowRight size={16} />
          </span>
          
          {mutation.isPending && (
            <span className="absolute inset-0 flex items-center justify-center animate-pulse">
              Sending…
            </span>
          )}
        </button>

        <p className="flex items-start gap-2 text-[12.5px] leading-[1.7] text-site-text">
          <Lock size={14} className="mt-[3px] shrink-0 text-site-blue" />
          The estimate is free. Dany will get back to you within 30 minutes to confirm the day and the price.
        </p>
      </div>

      {mutation.isError && (
        <p className="text-[13px] font-medium text-red-600">
          Something went wrong. Please try calling us at {businessPhone} instead.
        </p>
      )}
    </form>
  );
}
