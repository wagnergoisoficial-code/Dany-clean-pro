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
    { id: 'minor-privacy', label: '12. Children’s Privacy', icon: AlertTriangle },
    { id: 'policy-updates', label: '13. Policy Updates', icon: RefreshCcw },
    { id: 'contact-us', label: '14. Contact Operations', icon: Mail },
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <Helmet>
        <title>Privacy Policy | Dany Clean Pro</title>
        <meta name="description" content="Official Privacy Policy and terms for Dany Clean Pro. Learn how we securely protect, manage, and process your residential and commercial cleaning requests in Connecticut." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 py-24 lg:py-32">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 opacity-30 select-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent" />
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <Container className="relative z-10">
          <div className="max-w-3xl">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest mb-8 group"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Home Page
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold mb-6">
              <Shield size={12} />
              <span>Dany Clean Pro Security & Client Trust</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-none mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
              Your trust is our most valuable asset. This policy outlines how we safely process, utilize, and protect your information as we coordinate premium, family-focused cleaning services for your home or business in Connecticut.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <span className="bg-white/5 px-3 py-1.5 rounded-md border border-white/10 uppercase tracking-widest font-bold">Effective: May 21, 2026</span>
              <span className="bg-white/5 px-3 py-1.5 rounded-md border border-white/10 uppercase tracking-widest font-bold">Standard: US-TCPA Compliant</span>
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
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">
                  Document Sections
                </h3>
                <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all group"
                      >
                        <IconComponent size={15} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                        <span className="truncate">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Contact Desk */}
              <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-900 shadow-xl relative overflow-hidden">
                <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-blue-600/10 rounded-full blur-[40px]" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-4">
                  Need Legal Assistance?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  If you have queries regarding data deletion, CCPA compliance, or our communication practices, our dedicated operations team is ready to assist.
                </p>
                <div className="space-y-4 text-xs font-medium">
                  <a 
                    href="mailto:danycleanenpro@gmail.com" 
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Mail size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Email Address</p>
                      <p className="font-semibold text-slate-200">danycleanenpro@gmail.com</p>
                    </div>
                  </a>
                  <a 
                    href="tel:+14753413699" 
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <PhoneCall size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">SMS / Operations</p>
                      <p className="font-semibold text-slate-200">+1 (475) 341-3699</p>
                    </div>
                  </a>
                </div>
              </div>
            </aside>

            {/* Right Column: Complete Privacy Text */}
            <main className="lg:col-span-8 space-y-12 bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 lg:p-16 shadow-xl no-prose text-slate-700 leading-relaxed">
              
              {/* Introduction */}
              <article id="introduction" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Shield className="text-blue-600 shrink-0" size={24} />
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
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Eye className="text-blue-600 shrink-0" size={24} />
                  <span>2. Information We Collect</span>
                </h2>
                <p>
                  To provide highly tailored, premium, and reliable cleaning solutions, we collect several categories of information directly from you, automatically through device interactions, or via official integrations. This information includes:
                </p>
                <ul className="list-disc pl-6 space-y-3 pl-layout text-slate-600">
                  <li>
                    <strong className="text-slate-900">Personal Identifiers:</strong> Your full name, email address, direct phone numbers, billing details, physical cleaning address, and zip/postal codes.
                  </li>
                  <li>
                    <strong className="text-slate-900">Communication History:</strong> Any logs, comments, special structural home guidelines, pet instructions, ratings, and media files (such as interior space images, home layout screenshots) you upload or send using our online quote system or email channels.
                  </li>
                  <li>
                    <strong className="text-slate-900">Device & Usage Metrics:</strong> Automatic capture of IP addresses, cookies, unique device identifiers, operational browser characteristics, and analytics detailing how you navigate our pages.
                  </li>
                  <li>
                    <strong className="text-slate-900">Lead & Booking Records:</strong> Time slots selected, structural parameters chosen (e.g., number of rooms, commercial vs. residential configuration), customized special requests, and historical receipts.
                  </li>
                </ul>
              </article>

              {/* How We Use Your Data */}
              <article id="how-we-use" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Sliders className="text-blue-600 shrink-0" size={24} />
                  <span>3. How We Use Your Data</span>
                </h2>
                <p>
                  We operate as a client-first, family-driven cleaning provider. Under no circumstances do we sell, lease, or distribute your private contact details for third-party commercial marketing. The information we gather is exclusively leveraged to:
                </p>
                <div className="grid md:grid-cols-2 gap-4 my-6">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Service Scheduling</h4>
                    <p className="text-xs text-slate-600">To secure booking slots, design specific cleaning plans, assign coordinators, and process location routes.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Automated Alerts</h4>
                    <p className="text-xs text-slate-600">To send live updates, ETA alerts, structural confirmations, and follow-up satisfaction surveys.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Operational Safety</h4>
                    <p className="text-xs text-slate-600">To protect our crew, cross-check structural risks, verify addresses, and prevent visual fraudulent bookings.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Customer Care</h4>
                    <p className="text-xs text-slate-600">To maintain robust CRM logs, analyze client preferences over multi-year periods, and respond to direct tickets.</p>
                  </div>
                </div>
              </article>

              {/* SMS & TCPA Compliance */}
              <article id="tcpa-compliance" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <PhoneCall className="text-blue-600 shrink-0" size={24} />
                  <span>4. SMS & TCPA Compliance</span>
                </h2>
                <p>
                  Dany Clean Pro is fully committed to compliance under the United States Telephone Consumer Protection Act (TCPA) and applicable CT communication regulations. 
                </p>
                <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 text-slate-700 text-sm space-y-3">
                  <p className="font-semibold text-slate-900">Please review our explicit mobile policies below:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-slate-900">Consent Authorization:</strong> By providing your mobile telephone number on any form or lead collector, you declare written consent to receive operational text messages (including scheduling updates, automated dispatch confirmations, and support follow-ups) from Dany Clean Pro.
                    </li>
                    <li>
                      <strong className="text-slate-900">Opt-Out Control:</strong> You can cancel our text messaging connection at any time. Simply reply <span className="font-bold text-blue-600 uppercase">STOP</span> to any SMS you receive. After sending "STOP", we will transmit a concluding text confirming you have been cleanly opt-outed.
                    </li>
                    <li>
                      <strong className="text-slate-900">Carrier Rates:</strong> Message and data rates as applied by your wireless provider may apply under standard mobile parameters.
                    </li>
                    <li>
                      <strong className="text-slate-900">Frequency Guarantee:</strong> Text messages are dispatched only as logically needed to organize scheduled operations. We do not dispatch unsolicited mass promotional text streams.
                    </li>
                  </ul>
                </div>
              </article>

              {/* Cookies & Tracking Technologies */}
              <article id="tracking-tech" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Globe className="text-blue-600 shrink-0" size={24} />
                  <span>5. Cookies & Tracking Technologies</span>
                </h2>
                <p>
                  To optimize administrative dashboards and consumer checkouts, we utilize tracking cookies, tracking pixels, and client-side secure localStorage caches. These technologies are crucial to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                  <li>Recall active input values (preventing redundant data reentry upon page refreshes).</li>
                  <li>Verify secure admin session tokens (preventing malicious dashboard intrusion).</li>
                  <li>Track functional performance of pages on individual web view layers.</li>
                  <li>Identify geographical coordinates if requested to facilitate direct regional service-area mapping.</li>
                </ul>
              </article>

              {/* Shared with Third Parties */}
              <article id="third-party-sharing" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Users className="text-blue-600 shrink-0" size={24} />
                  <span>6. Third-Party Pricing & Infrastructure Providers</span>
                </h2>
                <p>
                  To deliver seamless operations, some data layers are integrated securely with modern cloud services:
                </p>
                <div className="space-y-4 mt-4">
                  <div className="flex gap-4 p-4 rounded-xl border border-slate-100">
                    <span className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-800 font-bold font-mono text-xs">FB</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Firebase & Firestore Suite</h4>
                      <p className="text-xs text-slate-500">Secure backend processing, booking parameters management, and user authentication infrastructure.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-xl border border-slate-100">
                    <span className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-800 font-bold font-mono text-xs">TW</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Twilio Integrations</h4>
                      <p className="text-xs text-slate-500">Triggering and executing instant TCPA/SMS booking confirmations to customer devices.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-xl border border-slate-100">
                    <span className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-800 font-bold font-mono text-xs">GA</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Google Analytics</h4>
                      <p className="text-xs text-slate-500">Measuring user traffic volumes and identifying page speed glitches across different browsers.</p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Limitation of Liability */}
              <article id="limitation-liability" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <AlertTriangle className="text-blue-600 shrink-0" size={24} />
                  <span>7. Limitation of Liability</span>
                </h2>
                <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-slate-700 text-sm space-y-3">
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
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <UserCheck className="text-blue-600 shrink-0" size={24} />
                  <span>8. Independent Contractors Disclaimer</span>
                </h2>
                <p>
                  To maximize scheduling flexibility and scale specialized services (such as post-construction cleanings or intensive deep carpet detailing), Dany Clean Pro operates under a hybrid service model. We utilize both direct employees and vetted independent contracting crews ("Cleaners").
                </p>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm space-y-2">
                  <p className="font-bold text-slate-900">Legal Relationship & Responsibilities:</p>
                  <p className="text-slate-600">
                    Independent cleaning professionals connected through our platform are not direct legal employees of Dany Clean Pro. While each independent contractor conforms strictly to our premier checklist criteria, satisfaction baselines, and safety validations, the execution of work, structural physical liability during deep-cleaning, and adherence to safe equipment usage guidelines remains the sole physical responsibility of the assigned independent professional.
                  </p>
                </div>
              </article>

              {/* Platform Security */}
              <article id="security-measures" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Lock className="text-blue-600 shrink-0" size={24} />
                  <span>9. Platform Security & Prohibited Activities</span>
                </h2>
                <p>
                  Our digital systems, server routes, database registries, and custom UI components are protected by legal intellectual property rules. To keep the Dany Clean Pro community safe, the following behaviors are strictly prohibited on our website:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                  <li>Deploying web scrapers, bots, spider software, or automated scripts to capture client data, lead structures, or visual elements.</li>
                  <li>Engaging in reverse engineering, server penetration tests, DDOS injection attempts, or unauthorized token spoofing.</li>
                  <li>Entering fraudulent leads, fake phone lines, malicious image files, or mock booking requests designed to flood our dashboard queue.</li>
                </ul>
              </article>

              {/* Data Retention */}
              <article id="data-retention" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <FileText className="text-blue-600 shrink-0" size={24} />
                  <span>10. Data Retention Policy</span>
                </h2>
                <p>
                  We store and retain client files and CRM parameters for as long as is necessary to support operational appointments, handle long-term recurring packages, fulfill local Connecticut financial bookkeeping regulations, and dispute potential chargebacks or structural insurance disputes. If you request full database deletion, we will archive active values while maintaining the bare baseline required to conform to US state and federal tax codes.
                </p>
              </article>

              {/* Your Legal Rights */}
              <article id="user-rights" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Sliders className="text-blue-600 shrink-0" size={24} />
                  <span>11. Your Legal Rights & Data Controls</span>
                </h2>
                <p>
                  Under US guidelines (including principles aligned with state privacy legislation like CTDPA - Connecticut Data Privacy Act), you possess specific consumer rights regarding your information:
                </p>
                <div className="grid md:grid-cols-3 gap-4 my-6">
                  <div className="p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 font-bold text-xs flex items-center justify-center">1</div>
                    <h5 className="font-bold text-slate-900 text-xs">Right to Access</h5>
                    <p className="text-[11px] text-slate-500">Request a full export of individual records currently maintained inside our system registries.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 font-bold text-xs flex items-center justify-center">2</div>
                    <h5 className="font-bold text-slate-900 text-xs">Right to Correct</h5>
                    <p className="text-[11px] text-slate-500">Safely request changes to names, address locations, misspelled email headers, or error parameters.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 font-bold text-xs flex items-center justify-center">3</div>
                    <h5 className="font-bold text-slate-900 text-xs">Right to Erasure</h5>
                    <p className="text-[11px] text-slate-500">Instruct our operations crew to purge non-legal CRM records, custom uploaded images, and lead entries.</p>
                  </div>
                </div>
              </article>

              {/* Children’s Privacy */}
              <article id="minor-privacy" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <AlertTriangle className="text-blue-600 shrink-0" size={24} />
                  <span>12. Children’s Privacy</span>
                </h2>
                <p>
                  Our websites, checkout channels, and automated routing services are geared entirely toward adults, property owners, and business operators who are at least 18 years old. We do not intentionally target, collect, or catalog information from children under the age of 13. If you believe a minor has entered personal telemetry data, please notify us, and we will purge the record immediately.
                </p>
              </article>

              {/* Policy Updates */}
              <article id="policy-updates" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <RefreshCcw className="text-blue-600 shrink-0" size={24} />
                  <span>13. Policy Updates & Notifications</span>
                </h2>
                <p>
                  Dany Clean Pro preserves the clear authority to amend or update this Privacy Policy at any designated moment. If material adjustments are applied (such as modifications to SMS TCPA protocols or payment gateway parameters), we will modify the "Effective Date" at the header of this policy. Continuing to schedule appointments or utilize our application pathways following modifications constitutes standard client acceptance of updated guidelines.
                </p>
              </article>

              {/* Contact Operations */}
              <article id="contact-us" className="scroll-mt-32 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Mail className="text-blue-600 shrink-0" size={24} />
                  <span>14. Contact Operations Desk</span>
                </h2>
                <p>
                  If you wish to invoke data rights, unsubscribe from communications, or learn more about our privacy frameworks, please touch base directly with our Connecticut management office:
                </p>
                
                <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 space-y-4 text-slate-700 mt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/15">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-950 text-sm">Official Email Desk</h4>
                      <p className="text-xs text-slate-500 mb-1">Monitored during business hours (Mon-Sat, 8am-6pm)</p>
                      <a href="mailto:danycleanenpro@gmail.com" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                        danycleanenpro@gmail.com
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-slate-200/60">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/15">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-950 text-sm">SMS & Direct Operations</h4>
                      <p className="text-xs text-slate-500 mb-1">Standard mobile assistance and immediate support</p>
                      <a href="tel:+14753413699" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                        +1 (475) 341-3699
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
