import { motion } from 'motion/react';
import { Home, Building2, Truck, HardHat, Waves, Palmtree } from 'lucide-react';
import Container from '../ui/Container';

const services = [
  {
    title: "Standard Residential Cleaning",
    description: "Weekly or bi-weekly maintenance cleaning to keep your home spotless and comfortable.",
    icon: Home,
  },
  {
    title: "Deep Cleaning",
    description: "A complete top-to-bottom clean, focusing on every forgotten corner for maximum freshness.",
    icon: Waves,
    popular: true
  },
  {
    title: "Move-In / Move-Out Cleaning",
    description: "Stress-free transitions with a spotless property. Perfect for realtors and homeowners.",
    icon: Truck,
  },
  {
    title: "Office & Commercial Cleaning",
    description: "Professional cleaning for clinics, small businesses, and shared office spaces.",
    icon: Building2,
  },
  {
    title: "Post-Construction Cleaning",
    description: "Fine dust and debris removal after renovations to reveal your beautiful new space.",
    icon: HardHat,
  },
  {
    title: "Rental Properties",
    description: "Quick turnarounds and guest-ready cleaning for Airbnbs and local rentals.",
    icon: Palmtree,
  }
];

export default function Services() {
  return (
    <section id="services" className="py-32 bg-slate-50/50">
      <Container>
        <div className="text-center mb-20">
          <h3 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">
            Professional Cleaning <br />
            Made Simple.
          </h3>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            From Fairfield to New Haven, we bring world-class detail to every home we touch.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-10 rounded-[2.5rem] bg-white border border-slate-100 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all group"
            >
              {service.popular && (
                <div className="absolute top-6 right-6 px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
              )}
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                <service.icon size={24} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4">{service.title}</h4>
              <p className="text-slate-500 leading-relaxed text-sm font-medium">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
