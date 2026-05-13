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
                Atendendo Famílias <br />
                Em Todo Connecticut.
              </h3>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                Oferecemos serviços de limpeza profissionais para residências e empresas em todos os condados de Fairfield e New Haven. Se você não vir sua cidade na lista, entre em contato conosco!
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
                <p className="font-bold text-slate-900">Expandindo em breve!</p>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">Estamos constantemente adicionando novas áreas de serviço. Cadastre-se em nossa newsletter para ser notificado.</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
             <div className="aspect-square bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 flex items-center justify-center p-12">
                {/* Simplified Map Representation */}
                <div className="w-full h-full border border-slate-200 rounded-[2rem] relative bg-white overflow-hidden shadow-sm">
                   <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
                   <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-100 blur-3xl opacity-50 rounded-full animate-pulse" />
                   <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-teal-100 blur-3xl opacity-50 rounded-full animate-pulse" />
                   <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center pointer-events-none">
                      <MapPin size={48} className="text-blue-600 mb-4 animate-bounce" />
                      <p className="text-sm font-bold text-slate-900 px-4 py-2 bg-white rounded-full shadow-lg border border-slate-100">
                        Baseados em Stamford, CT
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
