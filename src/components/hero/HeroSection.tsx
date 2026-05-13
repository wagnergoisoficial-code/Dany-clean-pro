import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Star, ShieldCheck } from 'lucide-react';
import Container from '../ui/Container';
import { useSetting } from '../../lib/settings';

export default function HeroSection() {
  const { value: heroCover } = useSetting('hero_cover');

  const trustPoints = [
    "Profissionais Verificados",
    "Disponibilidade no Mesmo Dia",
    "Totalmente Licenciado e Segurado"
  ];

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-white overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-blue-50/30 -z-10 rounded-l-[5rem] lg:rounded-l-[10rem]" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-50/50 rounded-full blur-[100px] -z-10" />

      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Content side */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8">
               <ShieldCheck size={12} className="text-blue-400" />
               Serviço Premium Connecticut
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-bold text-slate-900 leading-[1.05] mb-8 tracking-tighter">
              Uma Casa Limpa <br />
              Começando <span className="text-blue-600">Hoje.</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-500 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Conectamos você com os profissionais de limpeza mais bem avaliados nos condados de Fairfield e New Haven. Reserva simples, resultados impecáveis.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <a 
                href="#quote" 
                className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.1em] text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
              >
                Orçamento Instantâneo <ArrowRight size={18} />
              </a>
              <div className="flex -space-x-3 items-center">
                 {[1, 2, 3, 4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                      <img src={`https://i.pravatar.cc/100?img=${i+40}`} alt="Rating User" />
                   </div>
                 ))}
                 <div className="pl-6">
                    <p className="text-[13px] font-bold text-slate-900">Avaliação 4.9/5</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Mais de 1.200 Avaliações</p>
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
            className="flex-1 relative w-full"
          >
            <div className="relative aspect-[4/5] rounded-[3.5rem] lg:rounded-[5.5rem] overflow-hidden shadow-2xl z-10 border-[16px] border-white bg-slate-50">
              <img 
                src={heroCover || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200"} 
                alt="Ambiente doméstico impecável" 
                className="w-full h-full object-cover transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
              
              {/* Floating Quality Card */}
              <div className="absolute top-12 left-12 py-5 px-6 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 text-white shadow-2xl hidden sm:block">
                 <div className="flex items-center gap-2 mb-1">
                    <Star size={12} className="text-amber-400 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Altamente Recomendado</span>
                 </div>
                 <p className="text-lg font-display font-bold">Profissional de Elite</p>
              </div>

              <div className="absolute bottom-16 left-16 right-16 text-white">
                 <p className="text-3xl font-display font-medium tracking-tight leading-tight">Trazendo brilho profissional para todos os cantos de Connecticut.</p>
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
