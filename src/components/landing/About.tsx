import { motion } from 'motion/react';
import { CheckCircle2, Award, Users, Heart } from 'lucide-react';
import Container from '../ui/Container';

export default function About() {
  return (
    <section id="about" className="py-32 bg-white overflow-hidden">
      <Container>
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)]">
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&q=80&w=1200" 
                alt="Professional cleaner in a bright kitchen" 
                className="w-full aspect-[4/5] object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-slate-900 rounded-[2.5rem] flex items-center justify-center p-8 text-white z-20 shadow-2xl hidden md:flex">
              <div className="text-center">
                <p className="text-5xl font-bold mb-1">14+</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Years of Service</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
                Born in Connecticut, <br />
                Dedicated to Your Home.
              </h3>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                Dany Clean Pro started with a simple family goal: to provide high-quality cleaning services with a personal, reliable touch. Today, we've helped thousands of families across Fairfield County reclaim their time.
              </p>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                We're not a massive corporate franchise. We're your neighbors. Every clean we perform is treated with the same care we give our own homes.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8 pt-4">
              {[
                { icon: Award, title: "Quality First", desc: "A detailed checklist for every single visit." },
                { icon: Users, title: "Trusted Team", desc: "Background checked professionals." },
                { icon: Heart, title: "Eco-Friendly", desc: "Safe products for pets and children." },
                { icon: CheckCircle2, title: "100% Guarantee", desc: "Didn't love it? We'll re-clean for free." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1 text-base">{item.title}</h4>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
