import { ShieldCheck, Star, Clock, UserCheck, Shield, Check } from 'lucide-react';
import Container from '../ui/Container';

export default function TrustElements() {
  const features = [
    { 
      icon: Shield, 
      title: "Totalmente Seguro", 
      desc: "Equipe licenciada e segurada"
    },
    { 
      icon: Clock, 
      title: "Chegada Confiável", 
      desc: "Sempre pontual, todas as vezes"
    },
    { 
      icon: UserCheck, 
      title: "Antecedentes Verificados", 
      desc: "Profissionais rigorosamente filtrados"
    },
    { 
      icon: Star, 
      title: "Serviço 5 Estrelas", 
      desc: "Satisfação garantida"
    }
  ];

  return (
    <section className="py-10 bg-white border-b border-slate-50">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                <f.icon size={22} />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 text-sm mb-0.5">{f.title}</h5>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
