import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Lock } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseReady } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useConfig } from '../../hooks/useConfig';

const fieldClass =
  "w-full bg-surface-low px-4 py-3.5 text-body-md text-ink placeholder:text-ink-faint border border-transparent focus:border-accent focus:bg-surface outline-none transition-colors";
const labelClass = "text-label-md uppercase text-ink mb-2 block";

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

export default function LeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const { businessPhone } = useConfig();

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
        <div className="w-16 h-16 bg-accent-soft text-accent flex items-center justify-center mb-6">
          <CheckCircle size={30} />
        </div>
        <h3 className="font-display text-headline-sm text-ink mb-3">Request received</h3>
        <p className="text-body-md text-ink-muted max-w-md mb-8">
          Thank you. Your request went straight to our scheduling desk — expect a personal call or
          text within a few hours to confirm availability and review your requirements.
        </p>
        <div className="bg-surface-low p-5 w-full max-w-md text-left mb-8">
          <p className="text-body-sm text-ink">
            <span className="text-label-sm uppercase text-ink-faint block mb-1">Direct contact</span>
            {businessPhone}
          </p>
          <p className="text-body-sm text-ink mt-3">
            <span className="text-label-sm uppercase text-ink-faint block mb-1">Email</span>
            danycleanenpro@gmail.com
          </p>
        </div>
        <button 
          onClick={() => setSubmitted(false)}
          className="text-label-md uppercase text-accent hover:text-accent-strong transition-colors border-b border-accent/40 pb-1"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
            placeholder={businessPhone}
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
            className={cn(fieldClass, "appearance-none cursor-pointer")}
          >
            <option>Standard Residential Cleaning</option>
            <option>Deep Cleaning</option>
            <option>Move-In / Move-Out</option>
            <option>Post-Construction</option>
            <option>Office &amp; Commercial</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className={labelClass} htmlFor="lead-bedrooms">Bedrooms</label>
          <select id="lead-bedrooms" name="bedrooms" className={cn(fieldClass, "appearance-none cursor-pointer")}>
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Bedroom{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className={labelClass} htmlFor="lead-bathrooms">Bathrooms</label>
          <select id="lead-bathrooms" name="bathrooms" className={cn(fieldClass, "appearance-none cursor-pointer")}>
            {[1,1.5,2,2.5,3,3.5,4].map(n => <option key={n} value={n}>{n} Bathroom{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      {/* TCR / A2P 10DLC Compliant SMS Consent Section */}
      <div className="flex items-start gap-3 bg-surface-low p-5">
        <input 
          type="checkbox"
          id="sms_consent"
          name="sms_consent"
          checked={smsConsent}
          onChange={(e) => setSmsConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[var(--color-accent)] shrink-0"
        />
        <label htmlFor="sms_consent" className="text-body-sm text-ink-muted select-none">
          By checking this box and submitting this form, you agree to receive SMS messages from Dany Clean Pro / Brazilian Clean about your cleaning service request, estimates, and appointment updates. Message frequency varies. Message and data rates may apply. Reply HELP for help, reply STOP to opt out. View our{' '}
          <Link to="/privacy-policy" className="text-accent hover:underline font-semibold">Privacy Policy</Link>
          {' '}and{' '}
          <Link to="/terms" className="text-accent hover:underline font-semibold">Terms &amp; Conditions</Link>.
        </label>
      </div>

      <div className="flex flex-col items-start gap-4">
        <button 
          type="submit"
          disabled={mutation.isPending}
          className={cn(
            "w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-accent text-white text-label-md uppercase px-10 py-4 hover:bg-accent-strong transition-colors relative",
            mutation.isPending && "opacity-70 cursor-not-allowed"
          )}
        >
          <span className={cn("flex items-center gap-3 transition-opacity", mutation.isPending ? "opacity-0" : "opacity-100")}>
            Check Availability <ArrowRight size={16} />
          </span>
          
          {mutation.isPending && (
            <span className="absolute inset-0 flex items-center justify-center animate-pulse">
              Connecting with a professional…
            </span>
          )}
        </button>

        <p className="text-body-sm text-ink-muted flex items-start gap-2">
          <Lock size={14} className="text-accent shrink-0 mt-1" />
          No upfront payment required. We contact you to review requirements and confirm your appointment.
        </p>
      </div>

      {mutation.isError && (
        <p className="text-body-sm text-red-600">
          Something went wrong. Please try calling us at {businessPhone} instead.
        </p>
      )}
    </form>
  );
}
