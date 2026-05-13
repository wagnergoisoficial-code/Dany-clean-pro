import { motion } from 'motion/react';
import { Phone, ArrowRight, MessageCircle, ShieldCheck, CheckCircle, Star, Zap, Award, Search, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import Container from '../ui/Container';
import { useSetting } from '../../lib/settings';

const DEFAULT_COVER = "https://images.unsplash.com/photo-1556911220-e15024029581?auto=format&fit=crop&q=80&w=1200";

export default function Hero() {
  const { value: coverImage } = useSetting('hero_cover', DEFAULT_COVER);
  const microTrust = [
    "Licensed & Insured",
    "Same-Day Availability",
    "Family Owned locally",
    "Eco-Friendly Supplies"
  ];

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-52 bg-white overflow-hidden">
      {/* Soft background glow - very subtle */}
      <div className="absolute top-0 inset-x-0 h-full -z-10 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.02),transparent_50%)] pointer-events-none" />
      
      <Container>
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-slate-200/60">
               <ShieldCheck size={12} className="text-blue-600" />
               Premium Service Connecticut
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-bold text-slate-900 leading-[1.05] mb-8 tracking-tight">
              Professional House <br />
              <span className="text-blue-600">Cleaning Made Easy.</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-500 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Reliable cleaning services for homes and businesses across Connecticut. We take care of the mess, you enjoy your life.
            </p>
            
            {/* Thumbtack-Inspired Service Bar */}
            <div className="relative max-w-2xl mx-auto lg:mx-0 mb-12">
              <div className="flex flex-col md:flex-row items-stretch bg-white rounded-2xl p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-100 gap-1.5 focus-within:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] transition-shadow">
                <div className="flex-[1.5] flex items-center px-4 py-3 gap-3 border-b md:border-b-0 md:border-r border-slate-50 group">
                  <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="What do you need cleaned?" 
                    className="w-full bg-transparent border-none outline-none font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>
                <div className="flex-1 flex items-center px-4 py-3 gap-3 group">
                  <MapPin size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Zip Code" 
                    className="w-full bg-transparent border-none outline-none font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>
                <a 
                  href="#quote" 
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  Get Quotes
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-60">
               {microTrust.map((text, i) => (
                 <div key={i} className="flex items-center gap-2 text-[13px] font-bold text-slate-600 tracking-tight">
                    <CheckCircle size={14} className="text-green-600" />
                    {text}
                 </div>
               ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 relative w-full lg:max-w-none max-w-2xl"
          >
            <div className="relative aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-2xl z-10 border-[16px] border-white focus-within:border-blue-50 transition-colors">
              <img 
                src={coverImage || DEFAULT_COVER} 
                alt="Modern clean home" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
              
              {/* Quality Label */}
              <div className="absolute top-8 left-8 py-3 px-5 bg-white/10 backdrop-blur-3xl rounded-2xl border border-white/20 text-white shadow-2xl">
                 <div className="flex items-center gap-2 mb-0.5">
                    <Star size={12} className="text-amber-400 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Highly Recommended</span>
                 </div>
                 <p className="text-sm font-bold">Top Rated Professional</p>
              </div>

              <div className="absolute bottom-10 left-10 right-10 text-white">
                 <p className="text-3xl font-display font-medium tracking-tight leading-tight">Bringing professional brilliance to every corner.</p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -z-10" />
          </motion.div>

        </div>
      </Container>
    </section>
  );
}
