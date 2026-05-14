import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, CheckCircle, ArrowRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useConfig } from '../../hooks/useConfig';

export default function LeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const { businessPhone } = useConfig();

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to submit form');
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    mutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h3 className="text-3xl font-bold text-slate-900 mb-2">Thank You!</h3>
        <p className="text-slate-600 mb-8 max-w-xs mx-auto">
          We've received your request. A cleaning specialist will get in touch within 24 hours.
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="text-blue-600 font-bold hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Your Full Name</label>
          <input 
            required
            name="name"
            placeholder="e.g.: Sarah Smith"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Phone Number</label>
          <input 
            required
            type="tel"
            name="phone"
            placeholder={businessPhone}
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Email Address</label>
        <input 
          required
          type="email"
          name="email"
          placeholder="sarah@example.com"
          className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Connecticut City</label>
          <input 
            required
            name="city"
            placeholder="e.g.: Stamford"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Service Type</label>
          <select 
            name="service_type"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium text-slate-900 border appearance-none"
          >
            <option>Standard Residential Cleaning</option>
            <option>Deep Cleaning</option>
            <option>Move-In / Move-Out</option>
            <option>Post-Construction</option>
            <option>Office & Commercial</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Bedrooms</label>
          <select name="bedrooms" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 outline-none transition-all font-medium text-slate-900 border appearance-none">
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Bedroom{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Bathrooms</label>
          <select name="bathrooms" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-600/20 outline-none transition-all font-medium text-slate-900 border appearance-none">
            {[1,1.5,2,2.5,3,3.5,4].map(n => <option key={n} value={n}>{n} Bathroom{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <button 
        type="submit"
        disabled={mutation.isPending}
        className={cn(
          "w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 active:scale-[0.98] mt-4",
          mutation.isPending && "opacity-70 cursor-not-allowed"
        )}
      >
        {mutation.isPending ? "Connecting with Professional..." : (
          <>Check Availability <ArrowRight size={20} /></>
        )}
      </button>
      
      <p className="text-[10px] text-center text-slate-400 font-medium px-4">
        By clicking, you agree to be contacted by our team. No credit card is required to get a quote.
      </p>
    </form>
  );
}
