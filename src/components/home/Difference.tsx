import { ChevronRight } from 'lucide-react';
import { scrollToSection } from '../../lib/quote';
import SiteContainer from './SiteContainer';
import { PHOTOS } from './content';

/**
 * The grey band: who the company is, signed by the owner, and two short cards
 * that lead further down the page.
 */
export default function Difference({ photos = [] }: { photos?: string[] }) {
  const cards = [
    {
      title: 'Who We Are',
      text: 'A Waterbury cleaning company with over five years of experience and more than 3,000 customers served in Connecticut.',
      photo: photos[0] || PHOTOS.bedroom,
      go: () => scrollToSection('why'),
      label: 'Why choose us',
    },
    {
      title: 'Homes & Offices',
      text: 'Residential and commercial cleaning, one-time or recurring: weekly, bi-weekly or monthly.',
      photo: photos[1] || PHOTOS.office,
      go: () => scrollToSection('services'),
      label: 'See our services',
    },
  ];

  return (
    <section id="about" className="scroll-mt-6 bg-site-mist py-[90px] lg:py-[125px]">
      <SiteContainer className="grid gap-14 lg:grid-cols-[425px_minmax(0,1fr)] lg:gap-[75px]">
        <div>
          <h2 className="text-[27px] font-bold leading-[1.3] text-site-navy lg:text-[31px]">
            Cleaning Company<br />With a Difference.<br />Exceptional Care.
          </h2>
          <p className="mt-6 text-[14.5px] leading-[1.9] text-site-text">
            Dany Clean Pro serves Waterbury, the surrounding area and communities throughout Connecticut.
            Our team of four professionals focuses on quality, detail and respect for every home or
            workplace, from recurring cleaning to move-in, move-out and post-construction work.
          </p>
          <p className="mt-8 text-[13px] font-bold uppercase tracking-[0.06em] text-site-navy">Dany</p>
          <p className="mt-1 text-[12.5px] font-medium text-site-text">Owner, Dany Clean Pro</p>
        </div>

        <div className="grid gap-12 sm:grid-cols-2 sm:gap-12">
          {cards.map(card => (
            <article key={card.title}>
              <img src={card.photo} alt="" loading="lazy" className="h-[150px] w-full rounded-[3px] object-cover lg:h-[140px]" />
              <h3 className="mt-6 text-[13px] font-bold uppercase tracking-[0.06em] text-site-navy">{card.title}</h3>
              <p className="mt-3 text-[14px] leading-[1.85] text-site-text">{card.text}</p>
              <button
                type="button"
                onClick={card.go}
                aria-label={card.label}
                className="mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-site-blue text-white transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] hover:bg-site-blue-strong active:scale-95"
              >
                <ChevronRight size={17} strokeWidth={2.25} />
              </button>
            </article>
          ))}
        </div>
      </SiteContainer>
    </section>
  );
}
