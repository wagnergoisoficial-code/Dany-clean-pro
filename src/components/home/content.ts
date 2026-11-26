import {
  House, Sparkles, Truck, Building2, KeyRound,
  CalendarCheck, HardHat, Boxes, Building, Bath,
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

// 720px covers the largest frame these sit in (about 400px) on a 2x screen;
// quality 70 is invisible under the page's treatment and about half the bytes
// of 80. They load just below the first screen, while the cover is still
// coming in, so every kilobyte here is one the cover waits for.
const unsplash = (id: string, w = 720) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=70&w=${w}`;

/** Each of these was looked at; the gallery's sample list has a box of doughnuts in it. */
export const PHOTOS = {
  friendsCoffee: unsplash('1550623627-755160d35f08', 1000),  // two friends sharing coffee at home (Mad Fish Digital)
  hero: unsplash('1600607687939-ce8a6c25118c', 1600),            // bright, cleaned living space
  windowClean: unsplash('1581578731548-c64695cc6952'),      // cleaner at a window
  bathroom: unsplash('1584622650111-993a426fbf0a'),
  kitchen: unsplash('1556911220-e15b29be8c8f'),
  livingRoom: unsplash('1560185127-6ed189bf02f4'),
  bedroom: unsplash('1505693416388-ac5ce068fe85'),
  houseAtDusk: unsplash('1600585154340-be6161a56a0c'),
  sprayBottle: unsplash('1563453392212-326f5e854473'),
  sofa: unsplash('1484101403633-562f891dc89a'),
  office: unsplash('1497366754035-f200968a6e72'),
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
  { title: 'Home Organizing', service: 'Home Organizing', Icon: Boxes,
    description: 'Closets, pantries and rooms put back in order, quoted by the size of the home.' },
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
    label: ['Hand-Picked', 'Team'],
    lead: 'Our team is hand-picked by Dany: people she personally knows and trusts, trained by her to '
      + 'her own standards in every home and workplace we clean.',
    follow: 'Cleaning is tailored to each home, with attention to detail and respect for your space.',
    photos: [PHOTOS.kitchen, PHOTOS.bathroom, PHOTOS.windowClean],
  },
  {
    label: ['Five Years', 'of Care'],
    lead: 'Dany Clean Pro is a professional residential and commercial cleaning company based in '
      + 'Waterbury, Connecticut. With over five years of experience in the United States, we take pride '
      + 'in attentive, reliable cleaning.',
    follow: 'More than 2,000 cleanings across Connecticut, from recurring house cleaning to '
      + 'move-out and post-construction work.',
    photos: [PHOTOS.houseAtDusk, PHOTOS.bedroom, PHOTOS.livingRoom],
  },
  {
    label: ['Free', 'Estimates'],
    lead: 'Tell us about your home or office, and Dany will get back to you within 30 minutes to confirm '
      + 'the day and send your price. The estimate is completely free.',
    follow: 'Serving Waterbury and communities across Connecticut, subject to availability.',
    photos: [PHOTOS.bathroom, PHOTOS.sofa, PHOTOS.sprayBottle],
  },
];

/** The tab open on arrival — the middle one, as in the reference. */
export const REASON_DEFAULT = 1;

/*
 * The sections modelled on the large American cleaning sites: how it works,
 * what a cleaning includes, the 24-hour promise and the questions people ask.
 * Every line is something the owner confirmed in November 2026; nothing here
 * promises insurance, background checks, contracts or prices.
 */

export interface Step {
  title: string;
  text: string;
}

export const HOW_IT_WORKS: Step[] = [
  {
    title: 'Tell us about your home',
    text: 'Fill in the quick form, call or text. Bedrooms, bathrooms and how often you would like cleaning.',
  },
  {
    title: 'Get your price',
    text: 'Dany gets back to you with your price. For a deep cleaning, a few photos of the home let us give you the exact number.',
  },
  {
    title: 'We clean, you pay after',
    text: 'We text you when we arrive and when we finish. You pay on the day, once the cleaning is done, by Zelle, Venmo or cash.',
  },
];

export const PROMISE = {
  name: "Dany's 24-Hour Promise",
  text: "If anything isn't right, tell us within 24 hours and we'll come back to fix it, at no cost to you.",
};

export interface ChecklistRoom {
  room: string;
  items: string[];
}

/** What a regular cleaning covers, room by room, as Dany listed it. */
export const CHECKLIST: ChecklistRoom[] = [
  {
    room: 'Kitchen',
    items: [
      'Counters and sink cleaned',
      'Stovetop cleaned',
      'Outside of appliances wiped',
      'Inside of the microwave',
      'Floors vacuumed and mopped',
      'Trash taken out',
    ],
  },
  {
    room: 'Bathrooms',
    items: [
      'Toilet cleaned',
      'Sink cleaned',
      'Shower and tub cleaned',
      'Mirrors cleaned',
      'Floors vacuumed and mopped',
      'Trash taken out',
    ],
  },
  {
    room: 'Bedrooms & Living Areas',
    items: [
      'Dusting',
      'Beds made',
      'Floors vacuumed and mopped',
      'Trash taken out',
    ],
  },
];

export const CHECKLIST_DEEP =
  'Inside the oven, baseboards, doors, ceiling fans, spot cleaning on walls and interior window glass.';

export const CHECKLIST_MOVE =
  'An empty home, with the inside of the cabinets, the oven and the refrigerator included.';

export const CHECKLIST_ADDONS = 'Inside the refrigerator and inside the cabinets can be added to any cleaning.';

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'Do I need to be home during the cleaning?',
    a: "No. Many clients give us a key or a door code and we clean while they're out. We text you when we arrive and when we finish.",
  },
  {
    q: 'Do you bring your own supplies?',
    a: "Yes, we bring our own products and equipment. If you'd rather we use yours, just let us know.",
  },
  {
    q: 'Is it okay if I have pets?',
    a: "Of course. Dogs and cats are no problem. We just don't pick up pet waste.",
  },
  {
    q: 'How is the price set?',
    a: 'By the size of your home, its condition and how often you would like cleaning. Your first cleaning has its own price, and recurring visits cost less per visit.',
  },
  {
    q: "What's the difference between a regular and a deep cleaning?",
    a: `A regular cleaning keeps your home fresh visit after visit. A deep cleaning goes further: ${CHECKLIST_DEEP.charAt(0).toLowerCase()}${CHECKLIST_DEEP.slice(1)} It's a good fit for a home that hasn't been professionally cleaned in a while.`,
  },
  {
    q: 'How do I pay?',
    a: 'On the day, once the cleaning is finished, by Zelle, Venmo or cash.',
  },
  {
    q: "What if I'm not happy with something?",
    a: `Tell us within 24 hours and we'll come back to fix it at no cost. That's ${PROMISE.name}.`,
  },
  {
    q: 'Can I cancel or reschedule?',
    a: "Yes, free of charge with at least 3 days' notice. Cancelling with less than 3 days' notice has a $60 fee, and if we can't get into the home on the day, half the price of the cleaning is charged.",
  },
  {
    q: 'What areas do you serve?',
    a: "We're based in Waterbury and serve communities across Connecticut. Send us your city and ZIP code and we'll confirm availability.",
  },
];
