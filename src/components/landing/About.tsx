import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Award, Users, Leaf } from 'lucide-react';
import Container from '../ui/Container';
import { useSetting } from '../../lib/settings';

const credentials = [
  { icon: Award, title: "Quality First", desc: "A detailed checklist verified on every single visit." },
  { icon: Users, title: "Trusted Team", desc: "Background-checked professionals, never rotating strangers." },
  { icon: Leaf, title: "Family Safe", desc: "Non-toxic products chosen for children and pets." },
  { icon: CheckCircle2, title: "100% Guarantee", desc: "Didn't love it? We return and re-clean for free." }
];

export default function About() {
  const { value: customImage } = useSetting('about_section_image');
  const [isImageError, setIsImageError] = useState(false);

  useEffect(() => {
    setIsImageError(false);
  }, [customImage]);

  const fallbackImage = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200";
  const displayImage = (customImage && !isImageError) ? customImage : fallbackImage;

  const handleImageError = () => {
    setIsImageError(true);
  };

  return (
    <section id="about" className="w-full bg-surface-low py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="relative bg-surface overflow-hidden">
              <img
                src={displayImage}
                alt="Our team at work in a Connecticut home"
                onError={handleImageError}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-[420px] lg:h-[520px] object-cover"
              />
              <div className="p-5 bg-surface flex items-center justify-between gap-4">
                <div>
                  <span className="block text-label-sm uppercase text-accent">Family Owned &amp; Operated</span>
                  <span className="block font-display text-headline-sm text-ink">Dany Clean Pro</span>
                </div>
                <span className="text-label-sm uppercase bg-accent-soft text-accent-ink px-3 py-1.5 whitespace-nowrap">
                  14+ Years
                </span>
              </div>
            </div>
          </motion.div>

          {/* Story */}
          <div className="lg:col-span-7 flex flex-col">
            <span className="block text-label-sm uppercase text-accent mb-3">Meet Your Cleaning Team</span>
            <h2 className="font-display text-headline-md lg:text-headline-lg text-ink tracking-tight mb-6">
              “We treat your home with the same quiet care and respect we give our own.”
            </h2>

            <div className="flex flex-col gap-4 text-body-md text-ink-muted mb-10">
              <p>
                Dany Clean Pro started with a simple family goal: to provide high-quality cleaning
                with a personal, reliable touch. Today we've helped thousands of families across
                Fairfield County reclaim their time.
              </p>
              <p>
                We're not a massive corporate franchise — we're your neighbors. Every clean we
                perform is treated with the same care we give our own homes, from punctual arrivals
                to quiet thoroughness and absolute discretion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 bg-surface p-8">
              {credentials.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <item.icon size={20} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-label-md uppercase text-ink mb-1.5">{item.title}</span>
                    <span className="block text-body-sm text-ink-muted">{item.desc}</span>
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
