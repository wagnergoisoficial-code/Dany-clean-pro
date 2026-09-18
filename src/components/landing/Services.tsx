import { motion } from 'motion/react';
import { ArrowRight, Leaf } from 'lucide-react';
import Container from '../ui/Container';

const services = [
  {
    title: "Standard Residential Cleaning",
    rhythm: "Weekly or Bi-Weekly Visits",
    description:
      "The rhythm that keeps a home calm. Kitchen and bathroom sanitation, floors vacuumed and mopped, surfaces dusted, beds made and a full domestic reset on every visit.",
    scope: ["Kitchen & bath detail", "Floors vacuumed & mopped", "Trash & recycling reset"],
    note: "Most requested"
  },
  {
    title: "Deep Cleaning",
    rhythm: "Quarterly or Seasonal Refresh",
    description:
      "A meticulous top-to-bottom restoration. Baseboards and door frames washed by hand, grout scrubbed, light fixtures dusted and vacuuming behind and beneath movable furniture.",
    scope: ["Baseboards & door frames", "Inside microwave & range hood", "High ledge & vent dusting"],
    note: "Twice a year"
  },
  {
    title: "Move-In / Move-Out Cleaning",
    rhythm: "Empty Home Handover",
    description:
      "Turnover preparation for sales, rentals and incoming residents. Inside cabinets and drawers, interior appliance detailing, closets wiped down and an inspection-ready finish throughout.",
    scope: ["Inside cabinets & drawers", "Appliance degrease inside/out", "Realtor inspection ready"],
    note: "Single-day turn"
  },
  {
    title: "Office & Commercial Cleaning",
    rhythm: "Nightly, Weekly or Custom Contract",
    description:
      "Professional upkeep for clinics, small businesses and shared workspaces. Desks and shared surfaces disinfected, restrooms serviced, floors maintained and common areas reset before each workday.",
    scope: ["Desk & shared-surface disinfection", "Restroom servicing", "After-hours scheduling"],
    note: "Contract available"
  },
  {
    title: "Post-Construction Cleaning",
    rhythm: "After Remodel or Contractor Work",
    description:
      "Fine drywall and sawdust extraction with multi-stage vacuuming, careful residue removal from hardware and windows, walls wiped down and newly installed fixtures polished by hand.",
    scope: ["Fine dust extraction", "Residue removal from hardware", "New fixture hand polish"],
    note: "Custom quote"
  },
  {
    title: "Rental & Airbnb Turnovers",
    rhythm: "Same-Day Guest Turnaround",
    description:
      "Quick, dependable turnarounds between guests. Linens exchanged, bathrooms reset, kitchen restocked to your checklist and the property photographed-ready for the next arrival.",
    scope: ["Linen exchange", "Guest-ready staging", "Same-day availability"],
    note: "Flexible scheduling"
  }
];

export default function Services() {
  return (
    <section id="services" className="w-full bg-surface py-16 lg:py-24">
      <Container>
        <div className="max-w-2xl mb-12 lg:mb-16">
          <span className="block text-label-sm uppercase text-accent mb-3">Service Catalog &amp; Rhythm</span>
          <h2 className="font-display text-headline-md lg:text-headline-lg text-ink">
            Cleaning Services &amp; Scope
          </h2>
          <p className="text-body-md text-ink-muted mt-3">
            Transparent scope, tailored to your home and lifestyle. Professional equipment and
            eco-friendly, family-safe products are always included.
          </p>
        </div>

        {/* Ledger: one row per service, no cards */}
        <div className="flex flex-col divide-y divide-rule border-y border-rule">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.2) }}
              className="group grid grid-cols-1 lg:grid-cols-12 gap-6 items-baseline py-8 px-4 -mx-4 hover:bg-surface-low transition-colors"
            >
              <div className="lg:col-span-1">
                <span className="text-label-md text-accent tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="lg:col-span-4">
                <h3 className="font-display text-headline-sm text-ink">{service.title}</h3>
                <span className="inline-block text-label-sm uppercase text-ink-faint mt-1.5">
                  {service.rhythm}
                </span>
              </div>

              <div className="lg:col-span-5">
                <p className="text-body-md text-ink-muted">{service.description}</p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-body-sm text-ink-soft">
                  {service.scope.map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <span className="text-accent font-bold">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2 text-left lg:text-right">
                <span className="block text-label-sm uppercase text-ink-faint mb-2">{service.note}</span>
                <a
                  href="#quote"
                  className="inline-flex items-center gap-1.5 text-label-md uppercase text-ink group-hover:text-accent transition-colors"
                >
                  Request <ArrowRight size={13} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Product footnote */}
        <div className="mt-10 bg-surface-low px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <Leaf size={22} className="text-accent shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-body-sm text-ink-soft">
              <strong className="font-bold text-ink">Eco-friendly promise:</strong> we bring gentle,
              non-toxic products that are safe for children and pets. Prefer specific cleansers for
              your finishes? We will gladly use your home supplies on request.
            </p>
          </div>
          <a
            href="#quote"
            className="text-label-sm uppercase text-accent hover:text-accent-strong transition-colors whitespace-nowrap"
          >
            Schedule an Assessment →
          </a>
        </div>
      </Container>
    </section>
  );
}
