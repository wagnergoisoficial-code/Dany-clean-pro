import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Star, ShieldCheck } from 'lucide-react';
import Container from '../ui/Container';
import { useSetting } from '../../lib/settings';

export default function HeroSection() {
  const { value: heroCover } = useSetting('hero_cover');
  const [isImageError, setIsImageError] = React.useState(false);

  // Reset error state if heroCover changes (e.g. user updates it in CMS)
  React.useEffect(() => {
    setIsImageError(false);
  }, [heroCover]);

  const handleImageError = () => {
    console.warn("Hero image failed to load or is missing. Using internal CSS fallback.");
    setIsImageError(true);
  };

  const trustPoints = [
    "Verified Professionals",
    "Same-Day Availability",
    "Fully Licensed & Insured"
  ];

  return (
    <section className="relative pt-24 pb-20 lg:pt-48 lg:pb-32 bg-white overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-blue-50/30 -z-10 rounded-l-[5rem] lg:rounded-l-[10rem]" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-50/50 rounded-full blur-[100px] -z-10" />

      <Container>
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">
          
          {/* Content side */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left z-10 w-full"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8">
               <ShieldCheck size={12} className="text-blue-400" />
               Premium Connecticut Service
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-bold text-slate-900 leading-[1.05] mb-8 tracking-tighter">
              A Clean Home <br />
              Starting <span className="text-blue-600">Today.</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-500 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              We connect you with the top-rated cleaning professionals in Fairfield and New Haven counties. Simple booking, spotless results.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <a 
                href="#quote" 
                className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.1em] text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                Instant Quote <ArrowRight size={18} />
              </a>
              <div className="flex -space-x-3 items-center">
                 {[1, 2, 3, 4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                      <img src={`https://i.pravatar.cc/100?img=${i+40}`} alt="Rating User" />
                   </div>
                 ))}
                 <div className="pl-6">
                    <p className="text-[13px] font-bold text-slate-900">4.9/5 Rating</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Over 1,200 Reviews</p>
                 </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 pt-10 border-t border-slate-100">
               {trustPoints.map((text, i) => (
                 <div key={i} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <CheckCircle2 size={14} className="text-green-500" />
                    {text}
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Visual side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 relative w-full mb-8 lg:mb-0"
          >
            <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[2.5rem] lg:rounded-[5.5rem] overflow-hidden shadow-2xl z-10 border-[8px] lg:border-[16px] border-white bg-slate-100 flex items-center justify-center">
              {heroCover && !isImageError ? (
                <img 
                  src={heroCover} 
                  alt="Spotless home environment" 
                  onError={handleImageError}
                  className="w-full h-full object-cover transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 flex flex-col items-center justify-center p-12 text-center text-white relative overflow-hidden">
                  {/* Decorative pattern for the fallback */}
                  <div 
                    className="absolute inset-0 opacity-10 pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} 
                  />
                  
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 shadow-inner"
                  >
                     <ShieldCheck size={48} className="text-white" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <h3 className="text-3xl font-display font-bold mb-4 tracking-tight">Professional Home Cleaning</h3>
                    <p className="text-blue-100 font-medium max-w-[280px]">Premium service delivering spotless results to every corner of your home.</p>
                  </motion.div>
                  
                  {/* Floating elements inside fallback */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
              
              {/* Floating Quality Card */}
              <div className="absolute top-12 left-12 py-5 px-6 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 text-white shadow-2xl hidden sm:block">
                 <div className="flex items-center gap-2 mb-1">
                    <Star size={12} className="text-amber-400 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Highly Recommended</span>
                 </div>
                 <p className="text-lg font-display font-bold">Elite Professional</p>
              </div>

              <div className="absolute bottom-16 left-16 right-16 text-white">
                 <p className="text-3xl font-display font-medium tracking-tight leading-tight">Bringing professional shine to every corner of Connecticut.</p>
              </div>
            </div>

            {/* Subtle floating markers */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600 rounded-3xl shrink-0 flex items-center justify-center text-white shadow-2xl z-20"
            >
              <ShieldCheck size={40} />
            </motion.div>
          </motion.div>

        </div>
      </Container>
    </section>
  );
}
