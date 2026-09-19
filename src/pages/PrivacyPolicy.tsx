import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Container from '../components/ui/Container';
import { 
  Shield, 
  Lock, 
  UserCheck, 
  FileText, 
  PhoneCall, 
  Eye, 
  Globe, 
  Users, 
  AlertTriangle, 
  Sliders, 
  RefreshCcw, 
  Mail, 
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';

export default function PrivacyPolicy() {
  // Smooth scroll to element helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 90; // Adjust for sticky navigation header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'introduction', label: '1. Introduction', icon: Shield },
    { id: 'information-collected', label: '2. Information We Collect', icon: Eye },
    { id: 'how-we-use', label: '3. How We Use Your Data', icon: Sliders },
    { id: 'tcpa-compliance', label: '4. SMS & TCPA Compliance', icon: PhoneCall },
    { id: 'tracking-tech', label: '5. Cookies & Tracking', icon: Globe },
    { id: 'third-party-sharing', label: '6. Third-Party Pricing', icon: Users },
    { id: 'limitation-liability', label: '7. Limitation of Liability', icon: AlertTriangle },
    { id: 'contractor-disclaimer', label: '8. Independent Contractors', icon: UserCheck },
    { id: 'security-measures', label: '9. Platform Security', icon: Lock },
    { id: 'data-retention', label: '10. Data Retention', icon: FileText },
    { id: 'user-rights', label: '11. Your Legal Rights', icon: Sliders },
    { id: 'minor-privacy', label: "12. Children's Privacy", icon: AlertTriangle },
    { id: 'policy-updates', label: '13. Policy Updates', icon: RefreshCcw },
    { id: 'contact-us', label: '14. Contact Operations', icon: Mail },
  ];

  return (
    <div className="bg-surface-low min-h-screen text-ink-soft">
      <Helmet>
        <title>Privacy Policy | Dany Clean Pro</title>
        <meta name="description" content="Official Privacy Policy and terms for Dany Clean Pro. Learn how we securely protect, manage, and process your residential and commercial cleaning requests in Connecticut." />
      </Helmet>

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
              <span className="text-label-sm uppercase text-white/60">Security &amp; Client Trust</span>
            </div>
            <h1 className="font-display text-headline-lg lg:text-display text-white tracking-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-body-lg text-white/70 max-w-2xl">
              Your trust is our most valuable asset. This policy sets out how we process, use and
              protect your information while coordinating cleaning services for your home or
              business in Connecticut.
            </p>
            <div className="mt-10 pt-8 border-t border-white/15 flex flex-wrap items-center gap-x-8 gap-y-3">
              <span className="text-label-sm uppercase text-white/60">Effective: May 21, 2026</span>
              <span className="hidden sm:block w-px h-4 bg-white/20" />
              <span className="text-label-sm uppercase text-white/60">Standard: US-TCPA compliant</span>
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
              <div className="bg-surface p-6 sm:p-8 border border-rule/80">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-6 pb-4 border-b border-rule">
                  Document Sections
                </h3>
                <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm font-medium text-ink-muted hover:bg-surface-low hover:text-accent transition-all group"
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
                <h4 className="text-sm font-bold uppercase tracking-wider text-accent mb-4">
                  Need Legal Assistance?
                </h4>
                <p className="text-xs text-ink-faint leading-relaxed mb-6">
                  If you have queries regarding data deletion, CCPA compliance, or our communication practices, our dedicated operations team is ready to assist.
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
                      <p className="text-label-sm uppercase text-ink-muted">Email Address</p>
                      <p className="font-semibold text-rule">danycleanenpro@gmail.com</p>
                    </div>
                  </a>
                  <a 
                    href="tel:+12183575938" 
                    className="flex items-center gap-3 text-ink-faint hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <PhoneCall size={14} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-label-sm uppercase text-ink-muted">SMS / Operations</p>
                      <p className="font-semibold text-rule">+1 (218) 357-5938</p>
                    </div>
                  </a>
                </div>
              </div>
            </aside>

            {/* Right Column: Complete Privacy Text */}
            <main className="lg:col-span-8 space-y-12 bg-surface border border-rule/80 p-8 sm:p-12 lg:p-16 no-prose text-ink-soft leading-relaxed">
              
              {/* Introduction */}
              <article id="introduction" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Shield className="text-accent shrink-0" size={24} />
                  <span>1. Introduction & Overview</span>
                </h2>
                <p>
                  Welcome to <strong>Dany Clean Pro</strong>. We value your business and the trust you place in us to clean, manage, and care for your spaces. This Privacy Policy describes how Dany Clean Pro ("we", "us", "our") collects, uses, shares, and protects information gathered from clients, users, visitors, and anyone utilizing our service platform, phone lines, and booking configurations located in the state of Connecticut.
                </p>
                <p>
                  By accessing, browsing, or scheduling an appointment via our website, local booking widgets, or communicating with us via phone, text message (SMS), or automated communication services, you agree to the practices outlined in this policy.
                </p>
              </article>

              {/* Information Collected */}
              <article id="information-collected" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Eye className="text-accent shrink-0" size={24} />
                  <span>2. Information We Collect</span>
                </h2>
                <p>
                  To provide highly tailored, premium, and reliable cleaning solutions, we collect several categories of information directly from you, automatically through device interactions, or via official integrations. This information includes:
                </p>
                <ul className="list-disc pl-6 space-y-3 pl-layout text-ink-muted">
                  <li>
                    <strong className="text-ink">Personal Identifiers:</strong> Your full name, email address, direct phone numbers, billing details, physical cleaning address, and zip/postal codes.
                  </li>
                  <li>
                    <strong className="text-ink">Communication History:</strong> Any logs, comments, special structural home guidelines, pet instructions, ratings, and media files (such as interior space images, home layout screenshots) you upload or send using our online quote system or email channels.
                  </li>
                  <li>
                    <strong className="text-ink">Device & Usage Metrics:</strong> Automatic capture of IP addresses, cookies, unique device identifiers, operational browser characteristics, and analytics detailing how you navigate our pages.
                  </li>
                  <li>
                    <strong className="text-ink">Lead & Booking Records:</strong> Time slots selected, structural parameters chosen (e.g., number of rooms, commercial vs. residential configuration), customized special requests, and historical receipts.
                  </li>
                </ul>
              </article>

              {/* How We Use Your Data */}
              <article id="how-we-use" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Sliders className="text-accent shrink-0" size={24} />
                  <span>3. How We Use Your Data</span>
                </h2>
                <p>
                  We operate as a client-first, family-driven cleaning provider. Under no circumstances do we sell, lease, or distribute your private contact details for third-party commercial marketing. The information we gather is exclusively leveraged to:
                </p>
                <div className="grid md:grid-cols-2 gap-4 my-6">
                  <div className="p-5 bg-surface-low border border-rule space-y-2">
                    <h4 className="font-bold text-ink text-sm">Service Scheduling</h4>
                    <p className="text-xs text-ink-muted">To secure booking slots, design specific cleaning plans, assign coordinators, and process location routes.</p>
                  </div>
                  <div className="p-5 bg-surface-low border border-rule space-y-2">
                    <h4 className="font-bold text-ink text-sm">Automated Alerts</h4>
                    <p className="text-xs text-ink-muted">To send live updates, ETA alerts, structural confirmations, and follow-up satisfaction surveys.</p>
                  </div>
                  <div className="p-5 bg-surface-low border border-rule space-y-2">
                    <h4 className="font-bold text-ink text-sm">Operational Safety</h4>
                    <p className="text-xs text-ink-muted">To protect our crew, cross-check structural risks, verify addresses, and prevent visual fraudulent bookings.</p>
                  </div>
                  <div className="p-5 bg-surface-low border border-rule space-y-2">
                    <h4 className="font-bold text-ink text-sm">Customer Care</h4>
                    <p className="text-xs text-ink-muted">To maintain robust CRM logs, analyze client preferences over multi-year periods, and respond to direct tickets.</p>
                  </div>
                </div>
              </article>

              {/* SMS & TCPA Compliance */}
              <article id="tcpa-compliance" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <PhoneCall className="text-accent shrink-0" size={24} />
                  <span>4. SMS & TCPA Compliance</span>
                </h2>
                <p>
                  Dany Clean Pro is fully committed to compliance under the United States Telephone Consumer Protection Act (TCPA) and applicable CT communication regulations. Mobile information will not be shared with third parties or affiliates for marketing or promotional purposes.
                </p>
                <div className="p-6 bg-accent-soft border border-accent/20 text-ink-soft text-sm space-y-3">
                  <p className="font-semibold text-ink">Please review our explicit mobile policies below:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-ink">Consent Authorization:</strong> By providing your mobile telephone number on any form or lead collector, you declare written consent to receive operational text messages (including scheduling updates, automated dispatch confirmations, and support follow-ups) from Dany Clean Pro.
                    </li>
                    <li>
                      <strong className="text-ink">Opt-Out Control:</strong> You can cancel our text messaging connection at any time. Simply reply <span className="font-bold text-accent uppercase">STOP</span> to any SMS you receive. After sending "STOP", we will transmit a concluding text confirming you have been cleanly opt-outed.
                    </li>
                    <li>
                      <strong className="text-ink">Carrier Rates:</strong> Message and data rates as applied by your wireless provider may apply under standard mobile parameters.
                    </li>
                    <li>
                      <strong className="text-ink">Frequency Guarantee:</strong> Text messages are dispatched only as logically needed to organize scheduled operations. We do not dispatch unsolicited mass promotional text streams.
                    </li>
                  </ul>
                </div>
              </article>

              {/* Cookies & Tracking Technologies */}
              <article id="tracking-tech" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Globe className="text-accent shrink-0" size={24} />
                  <span>5. Cookies & Tracking Technologies</span>
                </h2>
                <p>
                  To optimize administrative dashboards and consumer checkouts, we utilize tracking cookies, tracking pixels, and client-side secure localStorage caches. These technologies are crucial to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                  <li>Recall active input values (preventing redundant data reentry upon page refreshes).</li>
                  <li>Verify secure admin session tokens (preventing malicious dashboard intrusion).</li>
                  <li>Track functional performance of pages on individual web view layers.</li>
                  <li>Identify geographical coordinates if requested to facilitate direct regional service-area mapping.</li>
                </ul>
              </article>

              {/* Shared with Third Parties */}
              <article id="third-party-sharing" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Users className="text-accent shrink-0" size={24} />
                  <span>6. Third-Party Pricing & Infrastructure Providers</span>
                </h2>
                <p>
                  To deliver seamless operations, some data layers are integrated securely with modern cloud services. <strong>Mobile information will not be shared with third parties or affiliates for marketing or promotional purposes.</strong> All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
                </p>
                <div className="space-y-4 mt-4">
                  <div className="flex gap-4 p-4 border border-rule">
                    <span className="w-10 h-10 bg-surface-mid flex items-center justify-center shrink-0 text-ink-soft font-bold font-mono text-xs">FB</span>
                    <div>
                      <h4 className="font-bold text-ink text-sm">Firebase & Firestore Suite</h4>
                      <p className="text-xs text-ink-muted">Secure backend processing, booking parameters management, and user authentication infrastructure.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 border border-rule">
                    <span className="w-10 h-10 bg-surface-mid flex items-center justify-center shrink-0 text-ink-soft font-bold font-mono text-xs">TW</span>
                    <div>
                      <h4 className="font-bold text-ink text-sm">Twilio Integrations</h4>
                      <p className="text-xs text-ink-muted">Triggering and executing instant TCPA/SMS booking confirmations to customer devices.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 border border-rule">
                    <span className="w-10 h-10 bg-surface-mid flex items-center justify-center shrink-0 text-ink-soft font-bold font-mono text-xs">GA</span>
                    <div>
                      <h4 className="font-bold text-ink text-sm">Google Analytics</h4>
                      <p className="text-xs text-ink-muted">Measuring user traffic volumes and identifying page speed glitches across different browsers.</p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Limitation of Liability */}
              <article id="limitation-liability" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <AlertTriangle className="text-accent shrink-0" size={24} />
                  <span>7. Limitation of Liability</span>
                </h2>
                <div className="p-6 bg-amber-50/50 border border-amber-200/60 text-ink-soft text-sm space-y-3">
                  <p>
                    While we deploy high-fidelity SSL databases, secure tokens, and trusted Firebase platforms, no digital system can offer an absolute guarantee of continuous, impenetrable protection. 
                  </p>
                  <p>
                    Dany Clean Pro does not guarantee that our administrative panel, customer portals, billing forms, or automated reminder tools will remain 100% uninterrupted, error-free, or devoid of third-party cloud outages. To the maximum extent permitted by local CT laws, Dany Clean Pro shall not be liable for any direct, indirect, incidental, or structural damages arising from performance latency, internet delivery interruptions, data leaks caused by device vulnerabilities, or temporary host server errors.
                  </p>
                </div>
              </article>

              {/* Independent Contractors Disclaimer */}
              <article id="contractor-disclaimer" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <UserCheck className="text-accent shrink-0" size={24} />
                  <span>8. Independent Contractors Disclaimer</span>
                </h2>
                <p>
                  To maximize scheduling flexibility and scale specialized services (such as post-construction cleanings or intensive deep carpet detailing), Dany Clean Pro operates under a hybrid service model. We utilize both direct employees and vetted independent contracting crews ("Cleaners").
                </p>
                <div className="p-6 bg-surface-low border border-rule text-sm space-y-2">
                  <p className="font-bold text-ink">Legal Relationship & Responsibilities:</p>
                  <p className="text-ink-muted">
                    Independent cleaning professionals connected through our platform are not direct legal employees of Dany Clean Pro. While each independent contractor conforms strictly to our premier checklist criteria, satisfaction baselines, and safety validations, the execution of work, structural physical liability during deep-cleaning, and adherence to safe equipment usage guidelines remains the sole physical responsibility of the assigned independent professional.
                  </p>
                </div>
              </article>

              {/* Platform Security */}
              <article id="security-measures" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Lock className="text-accent shrink-0" size={24} />
                  <span>9. Platform Security & Prohibited Activities</span>
                </h2>
                <p>
                  Our digital systems, server routes, database registries, and custom UI components are protected by legal intellectual property rules. To keep the Dany Clean Pro community safe, the following behaviors are strictly prohibited on our website:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-ink-muted">
                  <li>Deploying web scrapers, bots, spider software, or automated scripts to capture client data, lead structures, or visual elements.</li>
                  <li>Engaging in reverse engineering, server penetration tests, DDOS injection attempts, or unauthorized token spoofing.</li>
                  <li>Entering fraudulent leads, fake phone lines, malicious image files, or mock booking requests designed to flood our dashboard queue.</li>
                </ul>
              </article>

              {/* Data Retention */}
              <article id="data-retention" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <FileText className="text-accent shrink-0" size={24} />
                  <span>10. Data Retention Policy</span>
                </h2>
                <p>
                  We store and retain client files and CRM parameters for as long as is necessary to support operational appointments, handle long-term recurring packages, fulfill local Connecticut financial bookkeeping regulations, and dispute potential chargebacks or structural insurance disputes. If you request full database deletion, we will archive active values while maintaining the bare baseline required to conform to US state and federal tax codes.
                </p>
              </article>

              {/* Your Legal Rights */}
              <article id="user-rights" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Sliders className="text-accent shrink-0" size={24} />
                  <span>11. Your Legal Rights & Data Controls</span>
                </h2>
                <p>
                  Under US guidelines (including principles aligned with state privacy legislation like CTDPA - Connecticut Data Privacy Act), you possess specific consumer rights regarding your information:
                </p>
                <div className="grid md:grid-cols-3 gap-4 my-6">
                  <div className="p-4 border border-rule space-y-2">
                    <div className="w-8 h-8 rounded-full bg-accent-soft text-accent font-bold text-xs flex items-center justify-center">1</div>
                    <h5 className="font-bold text-ink text-xs">Right to Access</h5>
                    <p className="text-[11px] text-ink-muted">Request a full export of individual records currently maintained inside our system registries.</p>
                  </div>
                  <div className="p-4 border border-rule space-y-2">
                    <div className="w-8 h-8 rounded-full bg-accent-soft text-accent font-bold text-xs flex items-center justify-center">2</div>
                    <h5 className="font-bold text-ink text-xs">Right to Correct</h5>
                    <p className="text-[11px] text-ink-muted">Safely request changes to names, address locations, misspelled email headers, or error parameters.</p>
                  </div>
                  <div className="p-4 border border-rule space-y-2">
                    <div className="w-8 h-8 rounded-full bg-accent-soft text-accent font-bold text-xs flex items-center justify-center">3</div>
                    <h5 className="font-bold text-ink text-xs">Right to Erasure</h5>
                    <p className="text-[11px] text-ink-muted">Instruct our operations crew to purge non-legal CRM records, custom uploaded images, and lead entries.</p>
                  </div>
                </div>
              </article>

              {/* Children's Privacy */}
              <article id="minor-privacy" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <AlertTriangle className="text-accent shrink-0" size={24} />
                  <span>12. Children's Privacy</span>
                </h2>
                <p>
                  Our websites, checkout channels, and automated routing services are geared entirely toward adults, property owners, and business operators who are at least 18 years old. We do not intentionally target, collect, or catalog information from children under the age of 13. If you believe a minor has entered personal telemetry data, please notify us, and we will purge the record immediately.
                </p>
              </article>

              {/* Policy Updates */}
              <article id="policy-updates" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <RefreshCcw className="text-accent shrink-0" size={24} />
                  <span>13. Policy Updates & Notifications</span>
                </h2>
                <p>
                  Dany Clean Pro preserves the clear authority to amend or update this Privacy Policy at any designated moment. If material adjustments are applied (such as modifications to SMS TCPA protocols or payment gateway parameters), we will modify the "Effective Date" at the header of this policy. Continuing to schedule appointments or utilize our application pathways following modifications constitutes standard client acceptance of updated guidelines.
                </p>
              </article>

              {/* Contact Operations */}
              <article id="contact-us" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight flex items-center gap-3 border-b border-rule pb-4">
                  <Mail className="text-accent shrink-0" size={24} />
                  <span>14. Contact Operations Desk</span>
                </h2>
                <p>
                  If you wish to invoke data rights, unsubscribe from communications, or learn more about our privacy frameworks, please touch base directly with our Connecticut management office:
                </p>
                
                <div className="bg-surface-low p-6 sm:p-8 border border-rule space-y-4 text-ink-soft mt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-accent text-white flex items-center justify-center shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink text-sm">Official Email Desk</h4>
                      <p className="text-xs text-ink-muted mb-1">Monitored during business hours (Mon-Sat, 8am-6pm)</p>
                      <a href="mailto:danycleanenpro@gmail.com" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
                        danycleanenpro@gmail.com
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-rule/60">
                    <div className="w-10 h-10 bg-accent text-white flex items-center justify-center shrink-0">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink text-sm">SMS & Direct Operations</h4>
                      <p className="text-xs text-ink-muted mb-1">Standard mobile assistance and immediate support</p>
                      <a href="tel:+12183575938" className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
                        +1 (218) 357-5938
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </article>

            </main>

          </div>
        </Container>
      </section>
    </div>
  );
}
