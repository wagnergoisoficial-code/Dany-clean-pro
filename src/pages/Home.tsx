import { Helmet } from 'react-helmet'; // I should install this or just use standard head for aistudio apps
import HeroSection from '../components/hero/HeroSection';
import Services from '../components/landing/Services';
import About from '../components/landing/About';
import Gallery from '../components/landing/Gallery';
import Reviews from '../components/landing/Reviews';
import ServiceAreas from '../components/landing/ServiceAreas';
import LeadForm from '../components/landing/LeadForm';
import TrustElements from '../components/landing/TrustElements';
import Container from '../components/ui/Container';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <TrustElements />
      <Services />
      <About />
      <Gallery />
      <Reviews />
      <ServiceAreas />
      <section id="quote" className="py-24 bg-blue-600">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Pronto para uma Casa Impecável?
              </h2>
              <p className="text-xl text-blue-50 mb-8 max-w-lg">
                Reserve seu serviço de limpeza em menos de 2 minutos. Nossa equipe profissional está pronta para atender você em Connecticut!
              </p>
              <ul className="space-y-4">
                {[
                  "Totalmente Segurado",
                  "Empresa Familiar",
                  "Garantia de Satisfação de 100%",
                  "Profissionais com Antecedentes Verificados"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-2xl">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Peça seu Orçamento Gratuito</h3>
                <p className="text-slate-500">Preencha o formulário abaixo e entraremos em contato em breve.</p>
              </div>
              <LeadForm />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
