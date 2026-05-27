import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Copy, Check, Sparkles, Smartphone, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface SMSFallbackModalProps {
  onClose: () => void;
}

export default function SMSFallbackModal({ onClose }: SMSFallbackModalProps) {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const phoneNumber = "+12183575938";
  const formattedPhone = "+1 (218) 357-5938";
  const presetMessage = "Hi, I would like a cleaning quote.";

  const getSmsUrl = () => {
    const isIOS = typeof window !== 'undefined' && (
      /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
    const separator = isIOS ? '&' : '?';
    return `sms:${phoneNumber}${separator}body=Hi,%20I%20would%20like%20a%20cleaning%20quote.`;
  };

  const copyNumberToClipboard = () => {
    navigator.clipboard.writeText(formattedPhone);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const copyMessageToClipboard = () => {
    navigator.clipboard.writeText(presetMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-100 p-6 sm:p-10 flex flex-col space-y-6 z-10 text-left"
        id="sms-fallback-card"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Close Dialog"
        >
          <X size={20} />
        </button>

        {/* Header Icon & Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-[0.15em]">
            <Sparkles size={12} className="animate-spin-slow" />
            Instant SMS AI Receptionist
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 leading-tight">
              Text Us for Quotes <br />
              <span className="text-blue-600">& Local Booking</span>
            </h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              We operate standard SMS in the United States. Send us a message, and our AI Assistant handles bookings instantly.
            </p>
          </div>
        </div>

        {/* Visual Phone Simulation */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 sm:p-6 space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Smartphone size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">SMS Recipient</p>
              <p className="text-sm font-black text-slate-800">{formattedPhone}</p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Message Draft</span>
               <span className="text-[10px] text-slate-400">Pre-filled automagic text</span>
             </div>
             
             {/* Simulated Message Bubble */}
             <div className="bg-green-100 text-slate-800 text-sm px-4 py-3 rounded-2xl rounded-br-none max-w-[85%] ml-auto shadow-xs border border-green-200">
               {presetMessage}
             </div>
          </div>
        </div>

        {/* Actions Button Deck */}
        <div className="space-y-3 pt-2">
          {/* Main Direct SMS Deep Link */}
          <a
            href={getSmsUrl()}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white py-4.5 px-6 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-600/15 transition-all text-center"
          >
            LAUNCH MESSAGE APP <ArrowUpRight size={16} />
          </a>

          <div className="grid grid-cols-2 gap-3">
            {/* Copy Phone Number */}
            <button
              onClick={copyNumberToClipboard}
              className={cn(
                "py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                copiedNumber 
                  ? "bg-green-50 text-green-600 border-green-200" 
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              {copiedNumber ? (
                <>
                  <Check size={14} /> Number Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Number
                </>
              )}
            </button>

            {/* Copy Preset Message */}
            <button
              onClick={copyMessageToClipboard}
              className={cn(
                "py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                copiedMessage 
                  ? "bg-green-50 text-green-600 border-green-200" 
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              {copiedMessage ? (
                <>
                  <Check size={14} /> Text Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Draft Text
                </>
              )}
            </button>
          </div>
        </div>

        {/* Supporting Microcopy */}
        <div className="text-center">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Text us for instant cleaning quotes and support.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
