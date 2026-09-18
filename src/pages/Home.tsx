import HeroSection from '../components/hero/HeroSection';
import Services from '../components/landing/Services';
import About from '../components/landing/About';
import Gallery from '../components/landing/Gallery';
import Reviews from '../components/landing/Reviews';
import ServiceAreas from '../components/landing/ServiceAreas';
import ContactShowcase from '../components/landing/ContactShowcase';
import LeadForm from '../components/landing/LeadForm';
import TrustElements from '../components/landing/TrustElements';
import Container from '../components/ui/Container';

const guarantees = [
  { title: "Fully Insured", desc: "Coverage on every visit, documented on request." },
  { title: "Family Owned", desc: "A local Connecticut business, not a franchise." },
  { title: "Satisfaction Guarantee", desc: "We return and re-clean if anything is missed." },
  { title: "Background Checked", desc: "Every professional is vetted before entering a home." }
];

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
      <ContactShowcase />

      {/* Booking request */}
      <section id="quote" className="w-full bg-surface-mid py-16 lg:py-24">
        <Container className="max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="block text-label-sm uppercase text-accent mb-3">Direct Booking Inquiry</span>
            <h2 className="font-display text-headline-md lg:text-headline-lg text-ink">
              Request your free estimate
            </h2>
            <p className="text-body-md text-ink-muted mt-3">
              Fill out this short request and we'll reply personally to confirm pricing, review your
              requirements and secure your visit. It takes less than two minutes.
            </p>
          </div>

          <div className="bg-surface p-8 lg:p-12">
            <LeadForm />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-rule border border-rule mt-10">
            {guarantees.map((item) => (
              <div key={item.title} className="bg-surface-mid p-6">
                <span className="block text-label-md uppercase text-ink mb-2">{item.title}</span>
                <span className="block text-body-sm text-ink-muted">{item.desc}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
