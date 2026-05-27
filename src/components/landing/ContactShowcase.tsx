import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, PhoneCall, Mail, Sparkles, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';
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

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white overflow-hidden border-t border-slate-100">
      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles size={12} className="text-blue-500" />
            Instant Digital Support
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight tracking-tight">
            Connect Instantly. <br />
            <span className="text-blue-600">Get Booking in Seconds.</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium">
            Whether you prefer texting, calling, or email, our instant AI booking assistants and professional team are online to assist you instantly.
          </p>
        </div>

        {/* Bento Grid Channels */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          {/* Channel 1: SMS (Prominent Center/First Card) */}
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[2.5rem] p-8 sm:p-10 shadow-xl shadow-slate-950/20 relative overflow-hidden flex flex-col justify-between min-h-[380px] group border border-slate-800"
            id="channel-sms-box"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-green-500/20 transition-all duration-700" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Top Row with Badge & Icon */}
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-400">
                  <MessageSquare size={28} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-green-500 hover:bg-green-600 transition-colors text-slate-950 px-3 py-1.5 rounded-full select-none shadow-md">
                  Highly Rec / Instant
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-display font-black text-white hover:text-green-300 transition-colors">
                  SMS Receptionist
                </h3>
                <p className="text-slate-400 font-medium text-sm sm:text-base leading-relaxed max-w-md">
                  "Text us for instant cleaning quotes and support." Open your phone's native messages app to chat live with Jennifer, our automated booking of choice.
                </p>
              </div>
            </div>

            {/* Bottom Row Interactivity */}
            <div className="pt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-auto relative z-10 border-t border-white/5">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Official SMS Channel</p>
                <p className="text-lg font-black text-white">{formattedPhone}</p>
              </div>

              <a
                href={getSmsUrl()}
                onClick={handleSMSLaunch}
                className="bg-green-500 hover:bg-green-400 text-slate-950 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 group shadow-lg shadow-green-500/10 active:scale-95 transition-all text-center"
              >
                Text Us Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>

          {/* Channel 2: Phone Line */}
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-lg shadow-slate-100 border border-slate-100 flex flex-col justify-between min-h-[380px] group transition-all"
            id="channel-phone-box"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                  <PhoneCall size={26} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50/80 border border-blue-100 px-2.5 py-1 rounded-full select-none">
                  AI Voice
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  AI Call Line
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Speak with our smart AI call operator immediately. Ideal for estimating complex custom cleaning specs.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 mt-auto">
              <div className="mb-4">
                <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">Direct Office Phone</p>
                <p className="text-base font-black text-slate-800">{businessPhone}</p>
              </div>
              <a
                href={`tel:${businessPhone.replace(/\D/g, '')}`}
                onClick={triggerAICall}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
              >
                Call Office <PhoneCall size={12} />
              </a>
            </div>
          </motion.div>

          {/* Channel 3: Email Support */}
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-lg shadow-slate-100 border border-slate-100 flex flex-col justify-between min-h-[300px] md:col-span-1 group transition-all"
            id="channel-email-box"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
                  <Mail size={26} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-100/80 px-2.5 py-1 rounded-full select-none">
                  In <span className="lowercase">24h</span>
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  Email Support
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Send business inquiries or custom contract cleaning requests to our operations desk.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 mt-auto">
              <div className="mb-4">
                <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">Operations Email</p>
                <p className="text-sm font-black text-slate-800 truncate">danycleanenpro@gmail.com</p>
              </div>
              <a
                href="mailto:danycleanenpro@gmail.com"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
              >
                Email Support <Mail size={12} />
              </a>
            </div>
          </motion.div>

          {/* Core Service Trust Deck */}
          <div className="md:col-span-2 bg-slate-50 border border-slate-100/60 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center gap-6 text-slate-500 text-sm">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 shrink-0 shadow-xs border border-slate-100">
              <ShieldCheck size={22} />
            </div>
            <div className="space-y-1 text-center sm:text-left flex-grow">
              <p className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Secure Operations & Satisfaction</p>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                All digital communications utilize secure, GDPR/TCPA compliant channels. Your privacy is protected under our permanent policies.
              </p>
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}
