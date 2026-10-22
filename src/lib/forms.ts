/**
 * The public site's form parts, shared by the quote request and the review
 * form so the two read as one design.
 */
export const fieldClass =
  "w-full h-[50px] rounded-[3px] bg-site-mist px-4 text-[14.5px] font-medium text-site-navy placeholder:font-normal placeholder:text-[#a3acb9] border border-transparent focus:border-site-blue focus:bg-white outline-none transition-colors";

export const labelClass = "mb-2 block text-[12.5px] font-semibold uppercase tracking-[0.06em] text-site-navy";

/** The services the forms offer; a card elsewhere on the page can pick one of these. */
export const SERVICES = [
  'Standard Residential Cleaning',
  'Deep Cleaning',
  'Move-In / Move-Out',
  'Office & Commercial',
  'Airbnb / Vacation Rental',
  'Post-Construction',
  'Post-Event',
];
