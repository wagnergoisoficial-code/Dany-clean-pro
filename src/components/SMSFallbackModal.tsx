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
      className="fixed inset-0 z-[200] bg-ink/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-lg bg-surface overflow-hidden shadow-2xl relative p-6 sm:p-10 flex flex-col space-y-6 z-10 text-left"
        id="sms-fallback-card"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center hover:bg-surface-low text-ink-faint hover:text-ink transition-colors"
          title="Close Dialog"
        >
          <X size={20} />
        </button>

        {/* Header Icon & Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent-soft text-accent-ink text-label-sm uppercase">
            <Sparkles size={12} className="animate-spin-slow" />
            Instant SMS AI Receptionist
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-headline-md text-ink leading-tight">
              Text Us for Quotes <br />
              <span className="text-accent">& Local Booking</span>
            </h3>
            <p className="text-body-md text-ink-muted">
              We operate standard SMS in the United States. Send us a message, and our AI Assistant handles bookings instantly.
            </p>
          </div>
        </div>

        {/* Visual Phone Simulation */}
        <div className="bg-surface-low p-4 sm:p-6 space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-3 pb-3 border-b border-rule">
            <div className="w-10 h-10 bg-accent flex items-center justify-center text-white shrink-0">
              <Smartphone size={20} className="text-white" />
            </div>
            <div>
              <p className="text-label-sm uppercase text-ink-faint">SMS Recipient</p>
              <p className="text-body-md font-semibold text-ink">{formattedPhone}</p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-center">
               <span className="text-label-sm uppercase text-ink-faint">Message Draft</span>
               <span className="text-label-sm text-ink-faint">Pre-filled automagic text</span>
             </div>
             
             {/* Simulated Message Bubble */}
             <div className="bg-accent-soft text-ink text-body-sm px-4 py-3 max-w-[85%] ml-auto border border-accent/20">
               {presetMessage}
             </div>
          </div>
        </div>

        {/* Actions Button Deck */}
        <div className="space-y-3 pt-2">
          {/* Main Direct SMS Deep Link */}
          <a
            href={getSmsUrl()}
            className="w-full bg-accent hover:bg-accent-strong text-white py-4 px-6 text-label-md uppercase flex items-center justify-center gap-3 transition-colors text-center"
          >
            LAUNCH MESSAGE APP <ArrowUpRight size={16} />
          </a>

          <div className="grid grid-cols-2 gap-3">
            {/* Copy Phone Number */}
            <button
              onClick={copyNumberToClipboard}
              className={cn(
                "py-3 px-4 border text-label-md uppercase flex items-center justify-center gap-2 transition-colors",
                copiedNumber 
                  ? "bg-accent-soft text-accent-ink border-accent/20" 
                  : "bg-surface text-ink-soft border-rule hover:bg-surface-low"
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
                "py-3 px-4 border text-label-md uppercase flex items-center justify-center gap-2 transition-colors",
                copiedMessage 
                  ? "bg-accent-soft text-accent-ink border-accent/20" 
                  : "bg-surface text-ink-soft border-rule hover:bg-surface-low"
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
          <p className="text-label-sm uppercase text-ink-faint">
            Text us for instant cleaning quotes and support.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
