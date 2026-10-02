import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star } from 'lucide-react';
import Container from '../ui/Container';
import { useSetting } from '../../lib/settings';
import { useConfig } from '../../hooks/useConfig';

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2400";

export default function HeroSection() {
  const { value: heroCover } = useSetting('hero_cover');
  const { businessPhone } = useConfig();
  const [isImageError, setIsImageError] = React.useState(false);

  // Reset error state if heroCover changes (e.g. user updates it in CMS)
  React.useEffect(() => {
    setIsImageError(false);
  }, [heroCover]);

  const handleImageError = () => {
    console.warn("Hero image failed to load or is missing. Using internal CSS fallback.");
    setIsImageError(true);
  };

  const triggerAICall = () => {
    window.dispatchEvent(new CustomEvent('trigger-ai-call'));
  };

  return (
    <section className="relative w-full h-[80vh] min-h-[560px] bg-ink overflow-hidden">
      {/* Full-bleed cover */}
      <img
        src={(heroCover && !isImageError) ? heroCover : FALLBACK_COVER}
        alt="Professionally cleaned Connecticut home"
        onError={handleImageError}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Editorial gradient wash: dark from the left and bottom so type stays legible */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/70 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/50" />

      {/* Copy sits on the lower left, clear of the fixed header */}
      <Container className="relative h-full flex items-end pb-14 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1.5 h-1.5 bg-white/80" />
            <p className="text-label-sm uppercase text-white/80">
              Stamford · Greenwich · Norwalk · Fairfield County
            </p>
          </div>

          <h1 className="font-display text-headline-lg sm:text-display lg:text-[64px] lg:leading-[70px] text-white tracking-tight mb-6">
            A cleaner home.<br />A calmer life.
          </h1>

          <p className="text-body-lg text-white/75 max-w-xl mb-10">
            Premium residential and commercial cleaning trusted by Connecticut families.
            Vetted professionals, flexible scheduling, and spotless results without the stress.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <a
              href="#quote"
              className="inline-flex items-center justify-center gap-3 bg-white text-ink hover:bg-accent hover:text-white transition-colors text-label-md uppercase px-8 py-4"
            >
              Get My Free Estimate <ArrowRight size={16} />
            </a>
            <span className="text-body-sm text-white/70">
              or call / text us directly at
              <a
                href={`tel:${businessPhone.replace(/\D/g, '')}`}
                onClick={triggerAICall}
                className="font-semibold text-white underline underline-offset-4 hover:text-white/80 transition-colors ml-1.5"
              >
                {businessPhone}
              </a>
            </span>
          </div>

          <div className="mt-10 pt-8 border-t border-white/15 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="text-white fill-white" />
              ))}
              <span className="text-label-sm uppercase text-white/80 ml-1">4.9 / 5 average rating</span>
            </div>
            <span className="hidden sm:block w-px h-4 bg-white/20" />
            <span className="text-label-sm uppercase text-white/60">
              Family owned · Licensed &amp; insured · Background-checked team
            </span>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
