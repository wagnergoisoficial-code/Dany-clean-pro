import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Dany, your cleaning assistant. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        You are a helpful and professional customer service assistant for "Dany Clean Pro", 
        a family-owned cleaning company in Connecticut.
        
        Services: Regular Cleaning, Deep Cleaning, Move-In/Out, Commercial, Vacation Homes, Post-Construction.
        Areas: Stamford, Greenwich, Norwalk, Bridgeport, Danbury, and Fairfield County.
        Tone: Professional, friendly, trust-building, and helpful.
        
        Rules:
        1. If they ask about prices, tell them to use our "Quote Request" form for a free estimate. 
        2. Never invent specific prices.
        3. Be brief and focused on conversion.
        4. Redirect complex scheduling questions to our call line: (475) 341-3699.
        
        Current Message: ${userMessage}
      `;

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const responseText = result.text || "I'm sorry, I'm having trouble connecting. Please give us a call at (475) 341-3699!";
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm taking a quick break. Feel free to use our quote form or call us!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Dany Assistant</h4>
                  <p className="text-[10px] text-blue-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online & Ready to Help
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50"
            >
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-400 shadow-sm"
                  )}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm max-w-[80%]",
                    msg.role === 'user' ? "bg-blue-600 text-white" : "bg-white text-slate-700 shadow-sm border border-slate-100"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs px-12">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.2s]">●</span>
                  <span className="animate-bounce [animation-delay:0.4s]">●</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
              <div className="relative">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about our services..."
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center disabled:bg-slate-300"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center relative group"
      >
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full z-10" />
        <MessageSquare size={32} />
        {/* Tooltip */}
        <div className="absolute right-20 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap whitespace-nowrap">
          Questions? Ask Dany!
        </div>
      </motion.button>
    </div>
  );
}
