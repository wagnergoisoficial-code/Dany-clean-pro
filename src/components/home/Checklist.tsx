import { Check } from 'lucide-react';
import SiteContainer from './SiteContainer';
import { CHECKLIST, CHECKLIST_ADDONS, CHECKLIST_DEEP, CHECKLIST_MOVE } from './content';

/**
 * "What's Included": the room-by-room checklist American clients expect to
 * see before they book, with what a deep or move-out cleaning adds.
 */
export default function Checklist() {
  return (
    <section id="included" className="scroll-mt-6 bg-site-mist py-[90px] lg:py-[120px]">
      <SiteContainer>
        <h2 className="text-center text-[28px] font-bold leading-tight text-site-navy lg:text-[33px]">
          What's Included
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-center text-[14.5px] leading-[1.8] text-site-text">
          Every regular cleaning covers the whole home, room by room.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-14 lg:gap-8">
          {CHECKLIST.map(({ room, items }) => (
            <div key={room} className="bg-white px-7 py-8 shadow-[0_18px_40px_-28px_rgba(15,44,102,0.45)]">
              <h3 className="text-[14px] font-bold uppercase tracking-[0.06em] text-site-navy">{room}</h3>
              <ul className="mt-5 space-y-3">
                {items.map(item => (
                  <li key={item} className="flex items-start gap-3 text-[14px] leading-[1.6] text-site-text">
                    <span className="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-site-blue text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <dl className="mt-8 grid gap-6 md:grid-cols-3 lg:gap-8">
          {[
            ['Deep cleaning adds', CHECKLIST_DEEP],
            ['Move-in / move-out', CHECKLIST_MOVE],
            ['Add-ons', CHECKLIST_ADDONS],
          ].map(([title, text]) => (
            <div key={title} className="border-l-[3px] border-site-blue bg-white/60 px-6 py-5">
              <dt className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-site-navy">{title}</dt>
              <dd className="mt-2 text-[13.5px] leading-[1.7] text-site-text">{text}</dd>
            </div>
          ))}
        </dl>
      </SiteContainer>
    </section>
  );
}
