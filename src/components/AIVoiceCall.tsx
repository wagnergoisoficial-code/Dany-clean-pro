import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, User, Bot, Loader2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import { cn } from '../lib/utils';

interface AIVoiceCallProps {
  onClose: () => void;
}

export default function AIVoiceCall({ onClose }: AIVoiceCallProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [lastModelResponse, setLastModelResponse] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    startCall();
    return () => endCall();
  }, []);

  const startCall = async () => {
    // Note: VITE_GEMINI_API_KEY is disabled for security. 
    // Voice features require a secure backend proxy or temporary session tokens.
    if (true) {
      console.warn("AIVoiceCall: Voice features are disabled for security during deployment.");
      setLastModelResponse('Voice features are temporarily unavailable. Please call us!');
      setStatus('ended');
      return;
    }

    try {
      // Implementation stubbed for security.
      console.log("Call attempt blocked by security policy.");
    } catch (err) {
      console.error("Failed to start call:", err);
      onClose();
    }
  };

  const setupAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule('/audio-processor.js');
      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio' && !isMuted) {
          sessionRef.current?.sendRealtimeInput({
            audio: { data: event.data.data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
      workletNodeRef.current = workletNode;
    } catch (err) {
      console.error("Audio setup error:", err);
    }
  };

  const playPCMAudio = (base64Data: string) => {
    if (!audioContextRef.current) return;
    
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const float32Data = new Float32Array(bytes.buffer);
    
    const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 16000);
    buffer.getChannelData(0).set(float32Data);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  const handleBooking = async (args: any) => {
    setIsBooking(true);
    try {
      await fetch('/api/ai/book-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
    } catch (err) {
      console.error("Booking failed:", err);
    } finally {
      setIsBooking(false);
    }
  };

  const endCall = () => {
    setStatus('ended');
    streamRef.current?.getTracks().forEach(track => track.stop());
    sessionRef.current?.close();
    audioContextRef.current?.close();
    setTimeout(onClose, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col items-center p-12 text-center space-y-12">
        
        {/* Status indicator */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping" />
            <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-white relative">
              <Phone size={48} className={cn(status === 'connected' && "animate-bounce")} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-display font-bold text-slate-900 capitalize">
              {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Call in Progress' : 'Call Ended'}
            </h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              AI Assistant: Dany
            </p>
          </div>
        </div>

        {/* Visualizer placeholder */}
        <div className="w-full h-12 flex items-end justify-center gap-1">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                height: status === 'connected' ? [10, 48, 10] : 8,
                opacity: status === 'connected' ? 1 : 0.3
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.8, 
                delay: i * 0.1,
                ease: "easeInOut"
              }}
              className="w-1.5 bg-blue-600 rounded-full"
            />
          ))}
        </div>

        {/* Transcript preview */}
        <div className="w-full bg-slate-50 rounded-3xl p-6 min-h-[100px] flex items-center justify-center text-sm text-slate-500 italic">
          {lastModelResponse || "Listening..."}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-5 rounded-3xl transition-all",
              isMuted ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
            )}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </button>
          
          <button 
            onClick={endCall}
            className="p-8 bg-red-600 text-white rounded-[2rem] shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all scale-110"
          >
            <PhoneOff size={32} />
          </button>
          
          <div className="p-5 bg-slate-100 text-slate-600 rounded-3xl">
            <Volume2 />
          </div>
        </div>

        {isBooking && (
          <div className="flex items-center gap-2 text-green-600 font-bold text-xs animate-pulse">
            <Calendar size={14} /> Recording Appointment...
          </div>
        )}
      </div>
    </motion.div>
  );
}
