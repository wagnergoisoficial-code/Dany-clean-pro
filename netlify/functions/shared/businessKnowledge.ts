import { firestore } from './firestore';
import { softly } from './withTimeout';

/**
 * What the AI knows about the business.
 *
 * The model itself knows nothing about Dany Clean Pro — it only knows what this
 * file tells it. Both the phone and the SMS receptionist read from here, so a
 * fact is corrected once and both channels change.
 *
 * The defaults below are taken from what the website already states publicly.
 * Anything the site does not answer is marked TODO: those are decisions only
 * the owner can make, and until they are filled the assistant is instructed to
 * hand the question to a person rather than invent an answer.
 *
 * Editable without a deploy: a document at settings/ai_knowledge whose `value`
 * is free text gets appended to the prompt. Firestore being unavailable simply
 * means the defaults are used.
 */

export const BUSINESS = {
  name: 'Dany Clean Pro',
  phone: '(218) 357-5938',
  email: 'danycleanenpro@gmail.com',
  region: 'Connecticut',

  services: [
    'Standard residential cleaning — weekly or bi-weekly upkeep',
    'Deep cleaning — top to bottom, recommended seasonally',
    'Move-in / move-out cleaning — empty home, inspection ready',
    'Office and commercial cleaning — clinics, small businesses, shared offices',
    'Post-construction cleaning — fine dust and residue after a remodel',
    'Rental and Airbnb turnovers — same-day guest turnaround',
  ],

  areas: [
    'Stamford', 'Greenwich', 'Norwalk', 'Bridgeport',
    'Danbury', 'Fairfield', 'Westport', 'New Canaan',
  ],

  hours: 'Monday to Friday 8am to 6pm, Saturday 9am to 4pm. Sunday is not a service day but requests are taken.',

  facts: [
    'Family owned and operated, serving Connecticut since 2014.',
    'Licensed and fully insured. Every cleaner is background checked.',
    'Cleaning supplies and equipment are brought by the team — nothing is needed from the customer.',
    'Products are non-toxic and safe for children and pets.',
    'Satisfaction guarantee: if something was missed, the team returns and re-cleans at no charge.',
    'No payment is required to get an estimate.',
  ],

  // --- Only the owner can answer these. Left blank on purpose. ---
  pricing: '',          // TODO e.g. "Standard 3 bed/2 bath starts around $X"
  leadTime: '',         // TODO e.g. "usually books 3 to 5 days out"
  accessPolicy: '',     // TODO e.g. "lockbox code, smart lock PIN, or meet at the door"
  cancellation: '',     // TODO e.g. "48 hours notice to reschedule"
  outOfArea: '',        // TODO what to say to a caller outside the towns above
};

/** Rules that hold on every channel, including the ones that keep the AI honest. */
const RULES = `
HOW TO BEHAVE
- Never invent a fact. If you do not know, say a team member will confirm, and move on.
- Never quote or estimate a price. Pricing is confirmed by the team after reviewing the home.
- Never promise a specific appointment time. You take the customer's preferred day; the team confirms it.
- If the caller is outside the service area, take the details anyway and say the team will confirm whether they can reach them.
- If the caller is upset or wants a person, give the phone number and offer to have someone call back.
`.trim();

function render(extra: string): string {
  const todo = (label: string, value: string) =>
    value ? `- ${label}: ${value}` : `- ${label}: not established — hand this question to a person.`;

  return `
ABOUT THE BUSINESS
${BUSINESS.name} — residential and commercial cleaning in ${BUSINESS.region}.
Phone ${BUSINESS.phone}. Email ${BUSINESS.email}.

SERVICES
${BUSINESS.services.map(s => `- ${s}`).join('\n')}

SERVICE AREA
${BUSINESS.areas.join(', ')}.

HOURS
${BUSINESS.hours}

WHAT CUSTOMERS ASK ABOUT
${BUSINESS.facts.map(f => `- ${f}`).join('\n')}
${todo('Pricing', BUSINESS.pricing)}
${todo('How far out bookings go', BUSINESS.leadTime)}
${todo('How the cleaner gets in', BUSINESS.accessPolicy)}
${todo('Cancellation policy', BUSINESS.cancellation)}
${todo('Outside the service area', BUSINESS.outOfArea)}

${RULES}
${extra ? `\nADDITIONAL NOTES FROM THE OWNER\n${extra}` : ''}
`.trim();
}

/** Prompt block for the assistants. Owner notes are merged when reachable. */
export async function knowledgePrompt(): Promise<string> {
  // Defaults are enough; this read is a bonus, never a dependency.
  const extra = await softly(
    async () => {
      const snap = await firestore().collection('settings').doc('ai_knowledge').get();
      const value = snap.exists ? (snap.data() as any)?.value : '';
      return value && String(value).trim() ? String(value).trim().slice(0, 4000) : '';
    },
    1500, 'owner notes', '',
  );
  return render(extra);
}

/** Same content without the Firestore round-trip, for anything that cannot wait. */
export const knowledgePromptSync = () => render('');
