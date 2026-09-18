import { MapPin } from 'lucide-react';
import Container from '../ui/Container';

const towns = [
  { city: "Stamford", zips: "06901 · 06902 · 06903", note: "Primary hub — fastest response" },
  { city: "Greenwich", zips: "06830 · 06831 · 06870", note: "Backcountry, Old Greenwich & Cos Cob" },
  { city: "Norwalk", zips: "06850 · 06851 · 06853", note: "Rowayton, East Norwalk & SoNo" },
  { city: "Bridgeport", zips: "06604 · 06605 · 06606", note: "Black Rock, Brooklawn & North End" },
  { city: "Danbury", zips: "06810 · 06811", note: "Mill Plain & Candlewood" },
  { city: "Fairfield", zips: "06824 · 06825", note: "Southport, Greenfield Hill & Stratfield" },
  { city: "Westport", zips: "06880 · 06881", note: "Compo, Saugatuck & Greens Farms" },
  { city: "New Canaan", zips: "06840", note: "Town center & surrounding estates" }
];

export default function ServiceAreas() {
  return (
    <section id="areas" className="w-full bg-surface py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Editorial column */}
          <div className="lg:col-span-5 flex flex-col">
            <span className="block text-label-sm uppercase text-accent mb-3">Locally Dedicated</span>
            <h2 className="font-display text-headline-md lg:text-headline-lg text-ink mb-4">
              Service Area &amp; Availability
            </h2>
            <p className="text-body-md text-ink-muted mb-8">
              To keep schedules punctual and our attention undivided, we serve homes and businesses
              across Fairfield and New Haven counties, with Stamford as our base.
            </p>

            <div className="bg-surface-low p-6 mb-8">
              <span className="block text-label-sm uppercase text-accent mb-2">Current Schedule Notice</span>
              <p className="text-body-sm text-ink-soft">
                Now booking new recurring weekly and bi-weekly clients, with deep cleans and
                move-out turns scheduled one to two weeks in advance.
              </p>
            </div>

            <p className="text-body-sm text-ink-muted">
              Just outside these towns? Ask anyway — we regularly take on move-in and seasonal
              projects throughout the rest of Connecticut.
            </p>
          </div>

          {/* Coverage list */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-rule border border-rule">
              {towns.map((town, i) => (
                <div key={i} className="bg-surface p-6 flex items-start gap-4">
                  <MapPin size={18} className="text-accent shrink-0 mt-1" />
                  <div>
                    <h3 className="font-display text-headline-sm text-ink leading-tight">{town.city}</h3>
                    <p className="text-body-sm text-ink-muted mt-1">{town.note}</p>
                    <p className="text-label-sm uppercase text-ink-faint mt-2">{town.zips}</p>
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
