import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useConfig } from '../hooks/useConfig';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi, my name is Jennifer. I’m the virtual assistant for Dany Clean Pro. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessionId] = useState(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  const [leadSaved, setLeadSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { businessPhone } = useConfig();

  // Helper to detect lead info (name and phone)
  const detectAndSaveLead = async (userMessage: string, chatHistory: Message[]) => {
    if (leadSaved) return;

    console.log('AI lead detection triggered');

    // Try to find a phone number (10+ digits)
    const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
    const phoneMatch = userMessage.match(phoneRegex);
    
    if (phoneMatch) {
      const detectedPhone = phoneMatch[0];
      console.log('Potential phone detected:', detectedPhone);
      
      // Heuristic for name
      let detectedName = "";
      // Match patterns like "my name is X", "I am X", etc.
      const namePattern = /(?:my name is|me chamo|mi nombre es|me llamo|soy|sou|i am|i'm)\s+([^.?!,]{2,100})/i;
      const nameMatch = userMessage.match(namePattern);
      
      if (nameMatch) {
        detectedName = nameMatch[1].trim();
      } else if (userMessage.length < 100) {
        // If no explicit pattern, try to find a capitalized name near the start
        const simpleNameMatch = userMessage.match(/(?:Hi|Hello|Oi|Olá|Hola|Greetings),?\s+(?:I'm|I am|Sou|Soy|I'm)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        if (simpleNameMatch) {
          detectedName = simpleNameMatch[1].trim();
        } else {
          // Fallback: search history for name if not in current message
          const historyText = chatHistory.map(m => m.role === 'user' ? m.content : '').join(' | ');
          const historyNameMatch = historyText.match(namePattern);
          if (historyNameMatch) {
            detectedName = historyNameMatch[1].trim();
          }
        }
      }

      // Final cleanup: remove "and my phone" if it got caught in the name capture group
      if (detectedName) {
        detectedName = detectedName.split(/\s+(?:and|my|phone|is)\b/i)[0].trim();
      }

      console.log('Detected name:', detectedName);

      if (detectedPhone && detectedName && detectedName.length > 1) {
        try {
          console.log('Found complete lead - Calling /api/chat-lead', { detectedName, detectedPhone });
          const response = await fetch('/api/chat-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatSessionId,
              name: detectedName,
              phone: detectedPhone,
              initialMessage: userMessage,
              source: "AI Chat (Jennifer)"
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setLeadSaved(true);
              console.log('AI lead saved', data.leadId);
            } else {
              console.log('AI lead save failed', data.error);
            }
          } else {
            console.log('AI lead save failed', response.statusText);
          }
        } catch (error) {
          console.error('AI lead save failed', error);
        }
      }
    }
  };

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

    // Try to detect lead info in the background
    detectAndSaveLead(userMessage, messages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages 
        })
      });

      if (!response.ok) throw new Error('AI failed');
      
      const contentType = response.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
        throw new Error('Not JSON');
      }

      const data = await response.json();
      const responseText = data.reply || `Please text or call us at ${businessPhone} for instant assistance!`;
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I'm taking a quick break. Feel free to use our quote form, or text or call us at ${businessPhone} for instant automated assistance!` }]);
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
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border border-white/30">
                  <img 
                    src="/avatar.png" 
                    alt="Dany" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      // Parent div will show the icon if image fails
                    }}
                  />
                  <Bot size={24} className="absolute pointer-events-none" />
                </div>
                <div>
                  <h4 className="font-bold">Jennifer Assistant</h4>
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
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                    msg.role === 'user' ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-400 shadow-sm"
                  )}>
                    {msg.role === 'user' ? (
                      <User size={16} />
                    ) : (
                      <>
                        <img 
                          src="/avatar.png" 
                          alt="Jennifer" 
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                        <Bot size={16} className="absolute pointer-events-none" />
                      </>
                    )}
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
        <div className="absolute right-20 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Questions? Ask Jennifer!
        </div>
      </motion.button>
    </div>
  );
}
