import { MapPin, CheckCircle2 } from 'lucide-react';
import Container from '../ui/Container';

export default function ServiceAreas() {
  const towns = [
    { city: "Stamford", zips: "06901, 06902, 06903" },
    { city: "Greenwich", zips: "06830, 06831, 06870" },
    { city: "Norwalk", zips: "06850, 06851, 06853" },
    { city: "Bridgeport", zips: "06604, 06605, 06606" },
    { city: "Danbury", zips: "06810, 06811" },
    { city: "Fairfield", zips: "06824, 06825" },
    { city: "Westport", zips: "06880, 06881" },
    { city: "New Canaan", zips: "06840" }
  ];

  return (
    <section id="areas" className="py-32 bg-white">
      <Container>
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
                Serving Families <br />
                Across All Connecticut.
              </h3>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                We offer professional cleaning services for homes and businesses throughout Fairfield and New Haven counties. If you don't see your city on the list, please contact us!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-10">
              {towns.map((town, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{town.city}</span>
                </div>
              ))}
            </div>
            
            <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-start gap-6">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                <MapPin size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">Expanding soon!</p>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">We are constantly adding new service areas. Sign up for our newsletter to be notified.</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
             <div className="aspect-square bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 flex items-center justify-center p-4 sm:p-8 md:p-12">
                {/* Premium Stylized Map Representation */}
                <div className="w-full h-full border border-slate-100 rounded-[2rem] relative bg-gradient-to-b from-slate-50 to-white overflow-hidden shadow-md flex flex-col justify-between p-6 sm:p-8">
                   {/* Background dynamic grid and glows */}
                   <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
                   <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-blue-300 to-teal-300 blur-3xl opacity-30 rounded-full animate-pulse" />
                   
                   {/* Stylized Coverage Waves / Concentric Circles expanding from Stamford */}
                   <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-blue-400/10 rounded-full pointer-events-none animate-ping [animation-duration:4s]" />
                   <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-blue-500/10 rounded-full pointer-events-none" />
                   <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-blue-500/20 rounded-full pointer-events-none" />

                   {/* Pulsing Stamford Primary Hub Node */}
                   <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                     <span className="relative flex h-5 w-5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md"></span>
                     </span>
                     <span className="mt-2 text-[11px] font-sans font-bold text-blue-600 bg-blue-50/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-blue-100 shadow-xs">
                       Stamford Hub
                     </span>
                   </div>

                   {/* Other Coverage Nodes */}
                   <div className="absolute top-[20%] left-[25%] flex flex-col items-center opacity-70">
                     <span className="h-3 w-3 rounded-full bg-slate-400 border border-white"></span>
                     <span className="mt-1 text-[9px] font-sans font-medium text-slate-500">Greenwich</span>
                   </div>
                   <div className="absolute top-[18%] right-[22%] flex flex-col items-center opacity-70">
                     <span className="h-3 w-3 rounded-full bg-slate-400 border border-white"></span>
                     <span className="mt-1 text-[9px] font-sans font-medium text-slate-500">Norwalk</span>
                   </div>
                   <div className="absolute bottom-[42%] left-[18%] flex flex-col items-center opacity-70">
                     <span className="h-3 w-3 rounded-full bg-slate-400 border border-white"></span>
                     <span className="mt-1 text-[9px] font-sans font-medium text-slate-500">New Canaan</span>
                   </div>

                   {/* Spacer for top/map content */}
                   <div className="h-1/3" />

                   {/* Premium Glassmorphism Stamford Coverage Card */}
                   <div className="relative z-10 w-full bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-100/80 space-y-3.5">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <MapPin size={18} className="text-blue-600 animate-bounce" />
                         <span className="font-sans font-extrabold text-base text-slate-900 tracking-tight">Stamford, CT</span>
                       </div>
                       <div className="flex gap-1.5">
                         <span className="text-[10px] font-sans font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full select-none">
                           Primary Hub
                         </span>
                         <span className="text-[10px] font-sans font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full select-none">
                           Fast Response
                         </span>
                       </div>
                     </div>
                     <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                       Premium cleaning service based in Stamford, serving families across Connecticut with care, detail, and reliability.
                     </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
