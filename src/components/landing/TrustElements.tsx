import { Star, Clock, UserCheck, Shield } from 'lucide-react';
import Container from '../ui/Container';

const features = [
  { icon: Shield, title: "Fully Secure", desc: "Licensed & insured team" },
  { icon: Clock, title: "Reliable Arrival", desc: "Always on time, every time" },
  { icon: UserCheck, title: "Background Checked", desc: "Rigorously vetted pros" },
  { icon: Star, title: "5-Star Service", desc: "Satisfaction guaranteed" }
];

export default function TrustElements() {
  return (
    <section className="w-full bg-surface border-b border-rule">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8 py-10 lg:py-12">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-4">
              <f.icon size={20} className="text-accent shrink-0 mt-0.5" />
              <div>
                <h5 className="font-sans text-label-lg uppercase text-ink mb-1">{f.title}</h5>
                <p className="text-body-sm text-ink-muted">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
