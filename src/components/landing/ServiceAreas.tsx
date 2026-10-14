import { MapPin } from 'lucide-react';
import Container from '../ui/Container';

/**
 * Coverage as the owner states it, not as a list of towns.
 *
 * This used to name eight Fairfield County towns with their ZIP codes, none of
 * which matched the business: it works out of Waterbury, covers the state, and
 * reaches a few Massachusetts towns near the border only when it can. Naming
 * streets and ZIPs reads precise and promises things nobody checked, so the
 * ZIP question is put to the visitor instead — the same thing the phone
 * assistant asks before it agrees to travel anywhere.
 */
const coverage = [
  {
    city: "Waterbury & the surrounding area",
    note: "Our base. Shortest travel, widest choice of times.",
  },
  {
    city: "Throughout Connecticut",
    note: "Homes and businesses across the state, scheduled around travel time.",
  },
  {
    city: "Select Massachusetts towns",
    note: "Near the Connecticut border, subject to availability.",
  },
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
              We work out of Waterbury and serve homes and businesses across Connecticut, plus
              a few Massachusetts towns close to the border. Tell us your city and ZIP code and
              we will confirm what we can reach and when.
            </p>

            <div className="bg-surface-low p-6 mb-8">
              <span className="block text-label-sm uppercase text-accent mb-2">Current Schedule Notice</span>
              <p className="text-body-sm text-ink-soft">
                Now booking new weekly and bi-weekly clients, along with deep cleans, move-outs
                and post-event work. Send your details and the team confirms a time with you.
              </p>
            </div>

            <p className="text-body-sm text-ink-muted">
              Not sure whether we reach you? Ask anyway. Share your ZIP code and the team will
              tell you honestly whether we can get there.
            </p>
          </div>

          {/* Coverage list */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-px bg-rule border border-rule">
              {coverage.map((area, i) => (
                <div key={i} className="bg-surface p-6 sm:p-8 flex items-start gap-4">
                  <MapPin size={18} className="text-accent shrink-0 mt-1.5" />
                  <div>
                    <h3 className="font-display text-headline-sm text-ink leading-tight">{area.city}</h3>
                    <p className="text-body-md text-ink-muted mt-1.5">{area.note}</p>
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
