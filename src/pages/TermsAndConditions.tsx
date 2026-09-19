import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Container from '../components/ui/Container';
import { 
  FileText,
  ShieldCheck,
  Layers,
  DollarSign,
  Key,
  Calendar,
  ThumbsUp,
  ShieldAlert,
  Dog,
  AlertTriangle,
  CreditCard,
  Clock,
  Globe,
  MessageSquare,
  Lock,
  Scale,
  RefreshCw,
  Mail,
  ArrowUpRight
} from 'lucide-react';

export default function TermsAndConditions() {
  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'acceptance', label: '1. Acceptance of Terms', icon: ShieldCheck },
    { id: 'services', label: '2. Services Provided', icon: Layers },
    { id: 'pricing', label: '3. Estimates & Pricing', icon: DollarSign },
    { id: 'access', label: '4. Appointments & Access', icon: Key },
    { id: 'cancellation', label: '5. Cancellation & Policy', icon: Calendar },
    { id: 'satisfaction', label: '6. Satisfaction Guarantee', icon: ThumbsUp },
    { id: 'safety', label: '7. Safety Conditions', icon: ShieldAlert },
    { id: 'pets', label: '8. Pet Policy', icon: Dog },
    { id: 'liability', label: '9. Damages & Liability', icon: AlertTriangle },
    { id: 'payment', label: '10. Payment Terms', icon: CreditCard },
    { id: 'recurring', label: '11. Recurring Services', icon: Clock },
    { id: 'website-use', label: '12. Website Use', icon: Globe },
    { id: 'communication', label: '13. SMS & Consent', icon: MessageSquare },
    { id: 'limitation-liability', label: '14. Limitation of Liability', icon: AlertTriangle },
    { id: 'refusal', label: '15. Right to Refuse Service', icon: ShieldAlert },
    { id: 'privacy', label: '16. Privacy Protection', icon: Lock },
    { id: 'governing-law', label: '17. Governing Law', icon: Scale },
    { id: 'changes', label: '18. Changes to Terms', icon: RefreshCw },
    { id: 'contact', label: '19. Contact Information', icon: Mail },
  ];

  return (
    <div className="bg-surface-low min-h-screen text-ink-soft">
      <Helmet>
        <title>Terms and Conditions | Dany Clean Pro</title>
        <meta name="description" content="Official Terms and Conditions for Dany Clean Pro. Learn about our cleaning service terms, cancellation policies, satisfaction guarantees, and operations in Connecticut." />
      </Helmet>

      {/* Hero Section */}
      {/* Masthead */}
      <section className="w-full bg-ink py-16 lg:py-24">
        <Container>
          <div className="max-w-3xl">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-label-md uppercase text-white/50 hover:text-white transition-colors mb-10 group"
            >
              <span className="transition-transform group-hover:-translate-x-1">&larr;</span> Back to home
            </Link>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-1.5 h-1.5 bg-white/60" />
              <span className="text-label-sm uppercase text-white/60">Service Agreement</span>
            </div>
            <h1 className="font-display text-headline-lg lg:text-display text-white tracking-tight mb-6">
              Terms &amp; Conditions
            </h1>
            <p className="text-body-lg text-white/70 max-w-2xl">
              This agreement sets out the appointment policies, cancellation rules and satisfaction
              guarantees that govern our cleaning operations across Connecticut.
            </p>
            <div className="mt-10 pt-8 border-t border-white/15 flex flex-wrap items-center gap-x-8 gap-y-3">
              <span className="text-label-sm uppercase text-white/60">Effective: May 1, 2026</span>
              <span className="hidden sm:block w-px h-4 bg-white/20" />
              <span className="text-label-sm uppercase text-white/60">Scope: Connecticut state compliant</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content Area */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Sticky Sidebar Navigator */}
            <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              <div className="bg-surface p-6 sm:p-8 border border-rule/85">
                <h3 className="text-label-md text-ink uppercase mb-6 pb-4 border-b border-rule font-mono">
                  Document Sections
                </h3>
                <nav className="space-y-1 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm font-semibold text-ink-muted hover:bg-surface-low hover:text-accent transition-all group cursor-pointer font-sans"
                      >
                        <IconComponent size={15} className="text-ink-faint group-hover:text-accent transition-colors shrink-0" />
                        <span className="truncate">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Contact Desk */}
              <div className="bg-ink p-6 sm:p-8 text-white border border-white/10 relative overflow-hidden">
                <h4 className="text-label-md uppercase text-accent mb-4 font-mono">
                  Questions About Our Terms?
                </h4>
                <p className="text-xs text-ink-faint leading-relaxed mb-6">
                  For scheduling questions, specialized liability definitions, or commercial service parameters, reach out directly to our Connecticut hub.
                </p>
                <div className="space-y-4 text-xs font-medium">
                  <a 
                    href="mailto:danycleanenpro@gmail.com" 
                    className="flex items-center gap-3 text-ink-faint hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Mail size={14} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-label-sm uppercase text-ink-muted font-mono">Email Support</p>
                      <p className="font-semibold text-rule">danycleanenpro@gmail.com</p>
                    </div>
                  </a>
                  <a 
                    href="tel:+12183575938" 
                    className="flex items-center gap-3 text-ink-faint hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <MessageSquare size={14} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-label-sm uppercase text-ink-muted font-mono">SMS Hub</p>
                      <p className="font-semibold text-rule">+1 (218) 357-5938</p>
                    </div>
                  </a>
                </div>
              </div>
            </aside>

            {/* Right Column: Complete Terms content */}
            <main className="lg:col-span-8 space-y-12 bg-surface border border-rule/80 p-8 sm:p-12 lg:p-16 no-prose text-ink-soft leading-relaxed">
              
              {/* Introduction Notification */}
              <div className="bg-surface-low border border-rule p-6 space-y-3 font-sans">
                <p className="text-label-md uppercase text-accent font-mono">Notice of Binding Agreement</p>
                <p className="text-xs text-ink-muted leading-relaxed">
                  By accessing Dany Clean Pro, submitting request forms, booking cleanings, or executing communications with us, you agree to be bound by these Terms and Conditions. Please review them carefully before securing appointments.
                </p>
              </div>

              {/* 1. Acceptance of Terms */}
              <article id="acceptance" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <ShieldCheck className="text-accent shrink-0" size={20} />
                  <span>1. Acceptance of Terms</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  By accessing this website, requesting an estimate, booking a service, or using any services provided by Dany Clean Pro, you agree to be bound by these Terms and Conditions.
                </p>
                <p className="font-sans text-sm sm:text-base">
                  If you do not agree with these Terms and Conditions, please do not use our website or services.
                </p>
              </article>

              {/* 2. Services Provided */}
              <article id="services" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Layers className="text-accent shrink-0" size={20} />
                  <span>2. Services Provided</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Dany Clean Pro provides residential and commercial cleaning services, including but not limited to:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {[
                    "Regular Cleaning (Routine home maintenance)",
                    "Deep Cleaning (Intense, detailed scrub)",
                    "Move-In Cleaning (Detailed empty-home prep)",
                    "Move-Out Cleaning (Tenant & lease transitions)",
                    "Post-Construction Cleaning (Dust & debris clearance)",
                    "Vacation Rental / Airbnb Cleaning",
                    "Commercial Cleaning (Business environments)"
                  ].map((srv, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-surface-low border border-rule">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-ink-soft">{srv}</span>
                    </div>
                  ))}
                </div>
                <p className="font-sans text-xs text-ink-muted italic mt-3">
                  * Services may vary depending on property condition, customer requirements, and availability.
                </p>
              </article>

              {/* 3. Estimates and Pricing */}
              <article id="pricing" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <DollarSign className="text-accent shrink-0" size={20} />
                  <span>3. Estimates and Pricing</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  All estimates are based on information provided by the customer.
                </p>
                <div className="p-5 bg-accent-soft border border-accent/20 space-y-3">
                  <p className="text-ink text-label-md sm:text-sm uppercase font-mono">Final pricing may adjust if:</p>
                  <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-ink-soft">
                    <li>Additional rooms or unrecognized areas are discovered post-arrival.</li>
                    <li>The true physical condition of the property differs significantly from input descriptions.</li>
                    <li>Additional customization or detailing services are added on-site.</li>
                    <li>Excessive manual labor time is required due to extraordinary environmental debris.</li>
                  </ul>
                </div>
                <p className="font-sans text-sm sm:text-base text-ink-muted">
                  Customers will be informed of any pricing adjustments before additional work is performed.
                </p>
              </article>

              {/* 4. Appointments and Property Access */}
              <article id="access" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Key className="text-accent shrink-0" size={20} />
                  <span>4. Appointments and Property Access</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Customers must provide safe and timely access to the property.
                </p>
                <p className="font-sans text-sm sm:text-base">
                  If our cleaning team cannot access the property at the scheduled appointment time (due to locked keyboxes, deadbolts, lack of access codes, or guard clearance issues), Dany Clean Pro reserves the right to charge a lockout fee of up to <strong className="text-ink">$75</strong>.
                </p>
                <p className="font-sans text-sm sm:text-base">
                  Repeated access and security clearance issues may result in complete service cancellation.
                </p>
              </article>

              {/* 5. Cancellation and Rescheduling Policy */}
              <article id="cancellation" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Calendar className="text-accent shrink-0" size={20} />
                  <span>5. Cancellation & Rescheduling Policy</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Appointments may be canceled or rescheduled without penalty when notice is provided at least <strong>24 hours</strong> before the scheduled service time.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 my-4 text-center">
                  <div className="p-4 bg-surface-low border border-rule">
                    <span className="text-label-sm uppercase text-ink-muted font-mono">Less than 24h</span>
                    <p className="text-lg font-bold text-ink mt-1">Up to 50%</p>
                    <span className="text-[9px] text-ink-muted">of service cost fee</span>
                  </div>
                  <div className="p-4 bg-surface-low border border-rule">
                    <span className="text-label-sm uppercase text-ink-muted font-mono">Same-day Cancel</span>
                    <p className="text-lg font-bold text-rose-600 mt-1">Up to 100%</p>
                    <span className="text-[9px] text-ink-muted">of service cost fee</span>
                  </div>
                  <div className="p-4 bg-surface-low border border-rule">
                    <span className="text-label-sm uppercase text-ink-muted font-mono">No-show Onsite</span>
                    <p className="text-lg font-bold text-rose-600 mt-1">Full Charge</p>
                    <span className="text-[9px] text-ink-muted">may apply</span>
                  </div>
                </div>
              </article>

              {/* 6. Satisfaction Guarantee */}
              <article id="satisfaction" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <ThumbsUp className="text-accent shrink-0" size={20} />
                  <span>6. Satisfaction Guarantee</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Customer satisfaction is important to us.
                </p>
                <p className="font-sans text-sm sm:text-base">
                  If you are not satisfied with any section or item cleaned, you must notify Dany Clean Pro within <strong>24 hours</strong> of service completion.
                </p>
                <div className="bg-surface-low p-5 border border-rule text-ink-soft space-y-2">
                  <p className="text-ink text-label-md text-accent font-mono uppercase">At our direction, we may:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li>Return to re-clean the affected areas or surfaces free of charge.</li>
                    <li>Provide another reasonable, tailored resolution to resolve quality concerns.</li>
                  </ul>
                </div>
                <p className="font-sans text-xs text-ink-muted">
                  * Refunds are not guaranteed and will be evaluated on an individual, case-by-case basis.
                </p>
              </article>

              {/* 7. Safety Conditions */}
              <article id="safety" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <ShieldAlert className="text-accent shrink-0" size={20} />
                  <span>7. Safety Conditions</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Dany Clean Pro reserves the right to refuse, suspend, or immediately terminate services when unsafe, hazardous, or high-risk conditions exist.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs font-semibold">
                  {[
                    "Biohazards, extreme waste, mold or animal droppings",
                    "Hazardous materials or structural loose chemicals",
                    "Aggressive, loose, or unpredictable animal environments",
                    "Severe structural hazards (flooded, unstable floor, utility loss)",
                    "Threatening, abusive, or demeaning customer conduct"
                  ].map((itm, idx) => (
                    <div key={idx} className="flex gap-2 p-3 bg-rose-50/50 border border-rose-100 text-rose-955">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                      <span>{itm}</span>
                    </div>
                  ))}
                </div>
                <p className="font-sans text-label-md text-ink-muted uppercase mt-4">
                  The safety of our crews and customers is our highest priority.
                </p>
              </article>

              {/* 8. Pet Policy */}
              <article id="pets" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Dog className="text-accent shrink-0" size={20} />
                  <span>8. Pet Policy</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Customers are solely responsible for securing aggressive or potentially dangerous pets inside closed spaces, crates, or separate areas during cleaning sessions.
                </p>
                <p className="font-sans text-sm sm:text-base">
                  Dany Clean Pro is not responsible for pets escaping or running loose due to unsecured doors, sliding panels, gates, or back fences utilized during operations.
                </p>
              </article>

              {/* 9. Damages and Liability */}
              <article id="liability" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <AlertTriangle className="text-accent shrink-0" size={20} />
                  <span>9. Damages and Liability</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Dany Clean Pro is insured and takes extreme care while performing residential and commercial cleaning services.
                </p>
                <p className="font-sans text-sm sm:text-base">
                  Any damage claim must be formally reported within <strong>48 hours</strong> following service completion.
                </p>
                <div className="p-5 bg-surface-low border border-rule text-sm space-y-2">
                  <p className="font-bold text-ink text-xs">Dany Clean Pro is not responsible for:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-ink-muted">
                    <li>Pre-existing structural damage, scratches, faded surface varnishes, or stained surfaces.</li>
                    <li>Improperly installed fixtures, loose bathroom rods, unstable picture frames, or wall mounts.</li>
                    <li>Expected normal wear and tear on floor boards or older home structural components.</li>
                    <li>Unstable or loose decorative furniture pieces.</li>
                    <li>Unsecured, unlocked valuables, precious gems, cash, or credit cards.</li>
                    <li>Special high-risk items not formally disclosed to us in writing prior to booking.</li>
                  </ul>
                </div>
              </article>

              {/* 10. Payment Terms */}
              <article id="payment" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <CreditCard className="text-accent shrink-0" size={20} />
                  <span>10. Payment Terms</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Payment is due strictly upon completion of service unless otherwise agreed in writing.
                </p>
                <p className="font-sans text-sm sm:text-base font-bold text-ink">
                  Accepted Payment Methods:
                </p>
                <div className="flex flex-wrap gap-2 text-label-md leading-none uppercase">
                  {["Credit Card", "Debit Card", "ACH Transfer", "Cash", "Personal/Biz Check"].map((m, i) => (
                    <span key={i} className="bg-surface-mid border border-rule px-3 py-2 text-ink-soft">{m}</span>
                  ))}
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-ink-muted mt-2">
                  <li>Returned checks with zero clearance will be subject to processing penalty fees.</li>
                  <li>Outstanding billing balances will result in immediate suspension of future scheduled cleaning routes.</li>
                </ul>
              </article>

              {/* 11. Recurring Services */}
              <article id="recurring" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Clock className="text-accent shrink-0" size={20} />
                  <span>11. Recurring Services</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Recurring service pricing is based on the agreed-upon cleaning frequency (e.g., Weekly, Bi-weekly, Monthly).
                </p>
                <p className="font-sans text-sm sm:text-base">
                  If recurring services are skipped, paused, or canceled for an extended period of time, pricing for subsequent appointments may be reassessed based on:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-xs text-ink-muted">
                  <li>Changes in property buildup condition.</li>
                  <li>Time elapsed since the last formal professional cleaning.</li>
                  <li>Additional manual cleaning labor requirements.</li>
                </ul>
              </article>

              {/* 12. Website Use */}
              <article id="website-use" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Globe className="text-accent shrink-0" size={20} />
                  <span>12. Website Use</span>
                </h2>
                <p className="font-sans text-sm sm:text-base text-ink-muted">
                  Users agree to use our online CRM Portal, calculation widgets, booking forms, and dashboards strictly for legitimate operational purposes.
                </p>
                <p className="font-sans text-sm sm:text-base font-bold text-ink">Users agree NOT to:</p>
                <ul className="list-disc pl-6 space-y-1.5 text-xs text-ink-muted">
                  <li>Submit false, misleading, spoofed, or fraudulent information.</li>
                  <li>Attempt unauthorized panel entries or security clearance system hacking.</li>
                  <li>Interfere with website server performance or page scripts.</li>
                  <li>Upload malicious software, virus scripts, or harmful payload content.</li>
                  <li>Use the digital channels or information for unlawful purposes.</li>
                </ul>
              </article>

              {/* 13. SMS, Email, and Communication Consent */}
              <article id="communication" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <MessageSquare className="text-accent shrink-0" size={20} />
                  <span>13. SMS, Email, and Communication Consent</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  By submitting your information through our website, quote forms, chat tools, phone calls, or text messages, you consent and agree to receive direct SMS/MMS communications from Dany Clean Pro (also referred to as Brazilian Clean) regarding your service requests and inquiries.
                </p>
                <div className="p-5 bg-accent-soft border border-accent/20 space-y-3 font-sans text-xs sm:text-sm text-ink-soft">
                  <p className="text-label-md uppercase text-accent-ink font-mono">Mobile Messaging Disclosures:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>SMS Agreement:</strong> By submitting forms or providing your number, you agree to receive SMS messages from Dany Clean Pro / Brazilian Clean.</li>
                    <li><strong>Message Frequency:</strong> Message frequency varies based on your requests, active cleaning schedules, and response sequences.</li>
                    <li><strong>Standard Charges:</strong> Message and data rates may apply depending on your custom wireless tier.</li>
                    <li><strong>Opt-Out Protocol:</strong> You may reply <span className="font-bold text-accent-ink font-mono">STOP</span> at any time to opt out of further text communications.</li>
                    <li><strong>Help Protocol:</strong> You may reply <span className="font-bold text-accent-ink font-mono">HELP</span> for instant support, call our Hub, or email us.</li>
                  </ul>
                </div>
                <p className="font-sans text-sm sm:text-base text-ink-muted">
                  All mobile information is kept strictly private. Text messaging originator opt-in data and consent will not be shared with any third parties or affiliates for marketing or promotional purposes.
                </p>
              </article>

              {/* 14. Limitation of Liability */}
              <article id="limitation-liability" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <AlertTriangle className="text-accent shrink-0" size={20} />
                  <span>14. Limitation of Liability</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  To the maximum extent permitted by applicable laws, Dany Clean Pro shall not be held liable for:
                </p>
                <ul className="list-disc pl-6 space-y-1.5 text-xs text-ink-muted">
                  <li>Indirect, accidental, or consequential structural damages.</li>
                  <li>Real or projected loss of income or personal business opportunities due to scheduling.</li>
                  <li>Delays or missed appointments caused by extreme New England weather, local CT emergencies, unexpected traffic congestion, or force majeure events beyond our control.</li>
                </ul>
              </article>

              {/* 15. Right to Refuse Service */}
              <article id="refusal" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <ShieldAlert className="text-accent shrink-0" size={20} />
                  <span>15. Right to Refuse Service</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Dany Clean Pro reserves the absolute right to refuse or immediately discontinue physical service if:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-xs text-ink-muted">
                  <li>Payment obligations are skipped or credit cards are repeatedly declined.</li>
                  <li>Unsafe, hazardous, high-clutter, or biological risks are discovered inside the space.</li>
                  <li>Fraudulent bookings or identity spoofing are detected on lead requests.</li>
                  <li>Harassment, physical abuse, or abusive language is leveled toward cleaning crews.</li>
                  <li>Discriminatory conduct of any sort occurs toward staff, employees, or sub-contractors.</li>
                </ul>
              </article>

              {/* 16. Privacy and Data Protection */}
              <article id="privacy" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Lock className="text-accent shrink-0" size={20} />
                  <span>16. Privacy and Data Protection</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Customer information is collected solely for legitimate operational purposes, including estimates, scheduling, calendar synchronization, billing, and system support.
                </p>
                <p className="font-sans text-sm sm:text-base">
                  <strong>Dany Clean Pro does not sell customer personal information to third parties.</strong> Information may be shared only when required by law or to coordinate tasks with vetted crews.
                </p>
              </article>

              {/* 17. Governing Law */}
              <article id="governing-law" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Scale className="text-accent shrink-0" size={20} />
                  <span>17. Governing Law</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  These Terms and Conditions shall be governed by, interpreted and construed under the laws of the <strong>State of Connecticut</strong> and applicable federal laws of the United States.
                </p>
                <p className="font-sans text-sm sm:text-base">
                  Any dispute, mediation, or legal filing arising from these Terms or operational service actions shall be subject exclusively to the jurisdiction of the courts located within the State of Connecticut.
                </p>
              </article>

              {/* 18. Changes to These Terms */}
              <article id="changes" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <RefreshCw className="text-accent shrink-0" size={20} />
                  <span>18. Changes to These Terms</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  Dany Clean Pro reserves the right to modify these Terms and Conditions at any time.
                </p>
                <p className="font-sans text-sm sm:text-base text-ink-muted">
                  Updated versions will be posted immediately on this website with a revised effective date. Continued use of the website or booking of services after changes are posted constitutes acceptance of those modified parameters.
                </p>
              </article>

              {/* 19. Contact Information */}
              <article id="contact" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Mail className="text-accent shrink-0" size={20} />
                  <span>19. Contact Information</span>
                </h2>
                <p className="font-sans text-sm sm:text-base">
                  To register a query regarding service agreements, damage liabilities, or terms modifications, please touch base with our management desk:
                </p>
                <div className="bg-surface-low border border-rule p-6 space-y-4 font-sans text-ink-muted">
                  <p className="text-ink text-label-md sm:text-sm uppercase font-mono">DANY CLEAN PRO OPERATIONS</p>
                  <p className="text-xs sm:text-sm">Headquartered in Connecticut, United States</p>
                  <p className="text-xs sm:text-sm">Phone: <a href="tel:+12183575938" className="text-accent hover:underline font-semibold font-mono">+1 (218) 357-5938</a></p>
                  <p className="text-xs sm:text-sm">Email: <a href="mailto:danycleanenpro@gmail.com" className="text-accent hover:underline font-semibold">danycleanenpro@gmail.com</a></p>
                  <p className="text-xs sm:text-sm">Website: <a href="https://ais-pre-4fnvpzw3cvjvt7ikeaspo5-19020320692.us-west2.run.app" className="text-accent hover:underline font-mono">Dany Clean Pro Portal</a></p>
                </div>
              </article>

            </main>

          </div>
        </Container>
      </section>
    </div>
  );
}
