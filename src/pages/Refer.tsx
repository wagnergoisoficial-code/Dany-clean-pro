import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Copy, Gift, Home as HomeIcon, Share2, Sparkles } from 'lucide-react';
import SiteContainer from '../components/home/SiteContainer';
import { openQuote } from '../lib/quote';
import { REFERRAL, cleanName, referralLink, rememberReferral } from '../lib/referral';
import { fieldClass, labelClass } from '../lib/forms';
import { PHOTOS } from '../components/home/content';

const button =
  'inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-9 text-[13px] font-semibold uppercase tracking-[0.1em] transition-[background-color,transform] duration-300 ease-[var(--ease-settle)] active:scale-[0.98]';

/**
 * The referral program. With ?from=Name it greets the friend who was sent
 * the link; without it, it explains the program and makes a client's own
 * link to share.
 */
export default function Refer() {
  const [params] = useSearchParams();
  const from = cleanName(params.get('from'));

  useEffect(() => {
    document.title = from
      ? `${from} sent you $${REFERRAL.friendGets} off — Dany Clean Pro`
      : `Refer a Friend — Give $${REFERRAL.friendGets}, Get $${REFERRAL.referrerGets} — Dany Clean Pro`;
    if (from) rememberReferral(from);
  }, [from]);

  return (
    <div className="font-site">
      <section className="bg-site-deep pb-[80px] pt-[50px] lg:pb-[100px] lg:pt-[70px]">
        <SiteContainer className="grid items-center gap-12 text-center lg:grid-cols-[1fr_440px] lg:gap-16 lg:text-left">
          <div className="[&>*:first-child]:mx-auto lg:[&>*:first-child]:mx-0 lg:[&_p]:mx-0">
            {from ? <FriendHeading from={from} /> : <ProgramHeading />}
          </div>
          <figure className="mx-auto w-full max-w-[440px]">
            <img
              src={PHOTOS.friendsCoffee}
              alt="Two friends sharing coffee at home"
              width={880}
              height={660}
              className="aspect-[4/3] w-full rounded-[4px] border-[3px] border-white/90 object-cover shadow-[0_30px_60px_-25px_rgba(0,0,0,0.65)]"
            />
          </figure>
        </SiteContainer>
      </section>

      <section className="bg-site-mist py-[80px] lg:py-[100px]">
        <SiteContainer>
          <ol className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {[
              { Icon: Share2, title: 'Share your link', text: 'Send your personal link to a neighbor, friend or family member.' },
              { Icon: Gift, title: `They get $${REFERRAL.friendGets} off`, text: `$${REFERRAL.friendGets} comes off their first cleaning with Dany Clean Pro.` },
              { Icon: Sparkles, title: `You get $${REFERRAL.referrerGets} off`, text: `After their second cleaning, $${REFERRAL.referrerGets} comes off your next cleaning.` },
            ].map(({ Icon, title, text }, i) => (
              <li key={title} className="bg-white px-7 pb-9 pt-10 shadow-[0_18px_40px_-28px_rgba(15,44,102,0.45)]">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-site-blue/10 text-site-blue">
                  <Icon size={26} strokeWidth={1.6} />
                </span>
                <h2 className="mt-6 text-[15px] font-bold uppercase tracking-[0.05em] text-site-navy">
                  <span className="sr-only">Step {i + 1}: </span>{title}
                </h2>
                <p className="mt-3 text-[14px] leading-[1.8] text-site-text">{text}</p>
              </li>
            ))}
          </ol>

          <p className="mx-auto mt-10 max-w-[720px] border-l-[3px] border-site-blue bg-white/60 px-6 py-5 text-[14px] leading-[1.8] text-site-text">
            <strong className="text-site-navy">Bonus:</strong> for every {REFERRAL.bonusEvery} friends who become
            clients, you get a free extra of your choice: {REFERRAL.bonusExtras}. That is on top of the
            ${REFERRAL.referrerGets} for each friend.
          </p>

          {!from && <LinkMaker />}
        </SiteContainer>
      </section>
    </div>
  );
}

function FriendHeading({ from }: { from: string }) {
  return (
    <>
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
        <Gift size={30} strokeWidth={1.5} />
      </span>
      <h1 className="mt-6 text-[32px] font-bold leading-tight text-white lg:text-[46px]">
        {from} sent you ${REFERRAL.friendGets} off your first cleaning
      </h1>
      <p className="mx-auto mt-5 max-w-[600px] text-[16px] leading-[1.8] text-white/85">
        {from} trusts Dany Clean Pro with their home and thought you would like us too. Ask for your free
        quote and the ${REFERRAL.friendGets} comes off your first cleaning.
      </p>
      <button type="button" onClick={() => openQuote()} className={`${button} mt-9 bg-white text-site-blue hover:bg-[#eef5ff]`}>
        Claim my ${REFERRAL.friendGets} off
      </button>
    </>
  );
}

function ProgramHeading() {
  return (
    <>
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
        <HomeIcon size={30} strokeWidth={1.5} />
      </span>
      <p className="mt-6 text-[14px] font-light uppercase tracking-[0.3em] text-white/80 lg:text-[18px]">Know a neighbor?</p>
      <h1 className="mt-2 text-[34px] font-bold leading-tight text-white lg:text-[50px]">
        Give ${REFERRAL.friendGets}, Get ${REFERRAL.referrerGets}
      </h1>
      <p className="mx-auto mt-5 max-w-[600px] text-[16px] leading-[1.8] text-white/85">
        Share Dany Clean Pro with the people next door. They save on their first cleaning, and you save on
        your next one.
      </p>
      <a href="#your-link" className={`${button} mt-9 bg-white text-site-blue hover:bg-[#eef5ff]`}>
        Get my link
      </a>
    </>
  );
}

/** Type a name, get the personal link, share it or copy it. */
function LinkMaker() {
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const clean = cleanName(name);
  const link = useMemo(() => (clean ? referralLink(clean) : ''), [clean]);
  const message = `I use Dany Clean Pro for my home. Here's $${REFERRAL.friendGets} off your first cleaning: ${link}`;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard blocked: the link is on screen to select */ }
  }

  async function share() {
    try { await navigator.share({ title: 'Dany Clean Pro', text: message }); } catch { /* closed */ }
  }

  return (
    <div id="your-link" className="mx-auto mt-14 max-w-[720px] scroll-mt-24 bg-white px-7 py-9 shadow-[0_18px_40px_-28px_rgba(15,44,102,0.45)] lg:px-10">
      <h2 className="text-[22px] font-bold text-site-navy">Get your personal link</h2>
      <p className="mt-2 text-[14px] leading-[1.8] text-site-text">Type your name. Your link tells us who to thank.</p>

      <label className={`${labelClass} mt-6`} htmlFor="refer-name">Your Name</label>
      <input
        id="refer-name"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={40}
        placeholder="e.g. Jane"
        className={fieldClass}
      />

      {link && (
        <div className="mt-6">
          <p className="break-all rounded-[3px] bg-site-mist px-4 py-3 text-[14px] font-medium text-site-navy">{link}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {canShare && (
              <button type="button" onClick={share} className={`${button} bg-site-blue text-white hover:bg-site-blue-strong`}>
                <Share2 size={16} /> Share
              </button>
            )}
            <button type="button" onClick={copy} className={`${button} border border-site-blue bg-white text-site-blue hover:bg-[#eef5ff]`}>
              {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy link</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
