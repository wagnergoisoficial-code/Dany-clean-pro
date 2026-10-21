import {
  House, Sparkles, Truck, Building2, KeyRound,
  CalendarCheck, HardHat, PartyPopper, Building, Bath,
  type LucideIcon,
} from 'lucide-react';

/**
 * The words and pictures on the home page.
 *
 * Every claim here comes from the owner's briefing (brand/dany-clean-pro-
 * profile.docx) or the receptionist's script: no prices, no guarantees, no
 * licensing, nothing the business has not said itself. The `service` values
 * match the options of the quote form, so a card opens the form with that
 * service already chosen.
 */

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;

/** Each of these was looked at; the gallery's sample list has a box of doughnuts in it. */
export const PHOTOS = {
  hero: unsplash('1600607687939-ce8a6c25118c', 2400),            // bright, cleaned living space
  windowClean: unsplash('1581578731548-c64695cc6952', 900),      // cleaner at a window
  bathroom: unsplash('1584622650111-993a426fbf0a', 900),
  kitchen: unsplash('1556911220-e15b29be8c8f', 700),
  livingRoom: unsplash('1560185127-6ed189bf02f4', 900),
  bedroom: unsplash('1505693416388-ac5ce068fe85', 900),
  houseAtDusk: unsplash('1600585154340-be6161a56a0c', 700),
  sprayBottle: unsplash('1563453392212-326f5e854473', 900),
  sofa: unsplash('1484101403633-562f891dc89a', 900),
  office: unsplash('1497366754035-f200968a6e72', 900),
};

export interface Service {
  title: string;
  /** One line under the title in the white strip. */
  tagline?: string;
  /** A few lines in the dark band. */
  description?: string;
  service: string;
  Icon: LucideIcon;
}

/** The white strip that sits across the bottom of the hero. */
export const STRIP_SERVICES: Service[] = [
  { title: 'House Cleaning', tagline: 'One-time or recurring', service: 'Standard Residential Cleaning', Icon: House },
  { title: 'Deep Cleaning', tagline: 'Top to bottom detail', service: 'Deep Cleaning', Icon: Sparkles },
  { title: 'Move In & Out', tagline: 'Empty-home cleaning', service: 'Move-In / Move-Out', Icon: Truck },
  { title: 'Commercial', tagline: 'Offices & workplaces', service: 'Office & Commercial', Icon: Building2 },
  { title: 'Airbnb Turnovers', tagline: 'Vacation rentals', service: 'Airbnb / Vacation Rental', Icon: KeyRound },
];

/** The strip's raised card when nothing is hovered, as in the reference. */
export const STRIP_DEFAULT = 3;

/** The outlined boxes on the dark band. */
export const BAND_SERVICES: Service[] = [
  { title: 'Recurring Cleaning', service: 'Standard Residential Cleaning', Icon: CalendarCheck,
    description: 'Weekly, bi-weekly or monthly visits that keep your home ready, without you having to think about it.' },
  { title: 'Post-Construction', service: 'Post-Construction', Icon: HardHat,
    description: 'Dust and debris cleared after construction or renovation, so the new space is ready to use.' },
  { title: 'Post-Event', service: 'Post-Event', Icon: PartyPopper,
    description: 'After the party, the meeting or the celebration, we bring the space back to the way it was.' },
  { title: 'Apartments & Condos', service: 'Standard Residential Cleaning', Icon: Building,
    description: 'Apartments, condos and vacant properties cleaned with the same care as a family home.' },
  { title: 'Kitchens & Bathrooms', service: 'Deep Cleaning', Icon: Bath,
    description: 'The rooms that work hardest, with add-ons for the inside of the oven, refrigerator and cabinets.' },
];

export interface Reason {
  /** Two short lines under the heading, split where the reference splits its labels. */
  label: [string, string];
  lead: string;
  follow: string;
  /** back, middle, front — the front one is the photo that matters. */
  photos: [string, string, string];
}

export const REASONS: Reason[] = [
  {
    label: ['Vetted', 'Team'],
    lead: 'Every visit is handled by our own team of four professionals, each one selected, vetted and '
      + 'trained by Dany Clean Pro. The same careful hands and the same standards, in every home and '
      + 'workplace we clean.',
    follow: 'Cleaning is tailored to each home, with attention to detail and respect for your space.',
    photos: [PHOTOS.kitchen, PHOTOS.bathroom, PHOTOS.windowClean],
  },
  {
    label: ['Five Years', 'of Care'],
    lead: 'Dany Clean Pro is a professional residential and commercial cleaning company based in '
      + 'Waterbury, Connecticut. With over five years of experience in the United States, we take pride '
      + 'in attentive, reliable cleaning.',
    follow: 'More than 3,000 customers served across Connecticut, from recurring house cleaning to '
      + 'move-out and post-construction work.',
    photos: [PHOTOS.houseAtDusk, PHOTOS.bedroom, PHOTOS.livingRoom],
  },
  {
    label: ['Free', 'Estimates'],
    lead: 'Tell us about your home or office, and Dany will get back to you within 30 minutes to confirm '
      + 'the day and send the exact price. The estimate is completely free.',
    follow: 'Serving Waterbury, communities throughout Connecticut, and select Massachusetts cities near '
      + 'the border, subject to availability.',
    photos: [PHOTOS.bathroom, PHOTOS.sofa, PHOTOS.sprayBottle],
  },
];

/** The tab open on arrival — the middle one, as in the reference. */
export const REASON_DEFAULT = 1;
