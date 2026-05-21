import { motion } from 'motion/react';
import { Home, Building2, Truck, HardHat, Waves, Palmtree } from 'lucide-react';
import Container from '../ui/Container';

const services = [
  {
    title: "Standard Residential Cleaning",
    description: "Weekly or bi-weekly maintenance cleaning to keep your home spotless and comfortable.",
    icon: Home,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Deep Cleaning",
    description: "A complete top-to-bottom clean, focusing on every forgotten corner for maximum freshness.",
    icon: Waves,
    popular: true,
    image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Move-In / Move-Out Cleaning",
    description: "Stress-free transitions with a spotless property. Perfect for realtors and homeowners.",
    icon: Truck,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Office & Commercial Cleaning",
    description: "Professional cleaning for clinics, small businesses, and shared office spaces.",
    icon: Building2,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Post-Construction Cleaning",
    description: "Fine dust and debris removal after renovations to reveal your beautiful new space.",
    icon: HardHat,
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Rental Properties",
    description: "Quick turnarounds and guest-ready cleaning for Airbnbs and local rentals.",
    icon: Palmtree,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=600"
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
              className="relative rounded-[2.5rem] bg-white border border-slate-100 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all group overflow-hidden flex flex-col"
            >
              {/* Image Section */}
              <div className="h-48 w-full overflow-hidden relative bg-slate-100 text-slate-400">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60" />
                
                {service.popular && (
                  <div className="absolute top-6 right-6 px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full z-10 shadow-md">
                    Most Popular
                  </div>
                )}
              </div>

              {/* Floating Icon Section */}
              <div className="absolute top-[10.5rem] left-8 w-14 h-14 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 z-10">
                <service.icon size={24} />
              </div>

              {/* Text / Content Section */}
              <div className="pt-10 p-8 sm:p-10 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-4">{service.title}</h4>
                  <p className="text-slate-500 leading-relaxed text-sm font-medium">
                    {service.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
