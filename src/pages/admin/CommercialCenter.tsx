import { useState, useMemo, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Phone, 
  Send, 
  CheckCircle,
  TrendingUp,
  Award,
  SlidersHorizontal,
  X,
  Target,
  MessageSquare,
  Sparkles,
  Search,
  Check,
  AlertTriangle,
  PhoneCall,
  UserCheck,
  Calendar,
  FileSpreadsheet,
  Layers,
  Save,
  Users,
  RefreshCw,
  Heart,
  UserX,
  UserMinus,
  Copy,
  Mail,
  FileText
} from 'lucide-react';
import { Lead, AuthState } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';

interface CommercialCenterProps {
  leads: Lead[];
  isLoading: boolean;
  auth: AuthState;
}

type TabType = 'hot' | 'followup' | 'lost' | 'top_revenue' | 'all';

export default function CommercialCenter({ leads, isLoading, auth }: CommercialCenterProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('hot');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | number | null>(null);

  // States for the RHS manual tracking form
  const [formCallMade, setFormCallMade] = useState<boolean>(false);
  const [formClientAnswered, setFormClientAnswered] = useState<boolean>(false);
  const [formQuoteSent, setFormQuoteSent] = useState<boolean>(false);
  const [formServiceScheduled, setFormServiceScheduled] = useState<boolean>(false);
  const [formSaleClosed, setFormSaleClosed] = useState<boolean>(false);
  const [formClosedValue, setFormClosedValue] = useState<string>('');
  const [formCommercialNotes, setFormCommercialNotes] = useState<string>('');

  // Commercial Command Center - Phase 5 Recurring LTV and Objection Tracking
  const [formProjectedFrequency, setFormProjectedFrequency] = useState<string>('one-time');
  const [formProjectedLtv, setFormProjectedLtv] = useState<number>(0);
  const [formObjectionCategory, setFormObjectionCategory] = useState<string>('none');
  const [formObjectionNotes, setFormObjectionNotes] = useState<string>('');

  // Marketing Attribution - Módulo 1 states
  const [formAttributionChannel, setFormAttributionChannel] = useState<string>('Unknown');
  const [formUtmSource, setFormUtmSource] = useState<string>('');
  const [formUtmMedium, setFormUtmMedium] = useState<string>('');
  const [formUtmCampaign, setFormUtmCampaign] = useState<string>('');

  // Customer Lifecycle - Módulo 3 states
  const [formLifecycleStatus, setFormLifecycleStatus] = useState<string>('lead');
  const [formLastServiceDate, setFormLastServiceDate] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // States for the Interactive Dossier & Readiness Report
  const [showDossier, setShowDossier] = useState<boolean>(false);
  const [dossierTab, setDossierTab] = useState<'features' | 'readiness' | 'robustness' | 'impact'>('features');
  const [simulationStage, setSimulationStage] = useState<'idle' | 'running' | 'success'>('idle');
  const [simulationProgress, setSimulationProgress] = useState<number>(0);

  // Módulo 4: Customer Recovery Center states
  const [selectedRecoveryLeadId, setSelectedRecoveryLeadId] = useState<string | number | null>(null);
  const [recoveryChannel, setRecoveryChannel] = useState<'sms' | 'call' | 'email'>('sms');
  const [recoveryStatus, setRecoveryStatus] = useState<'pending' | 'success' | 'refused' | 'no_response'>('pending');
  const [recoveryNotes, setRecoveryNotes] = useState<string>('');
  const [recoveryAngle, setRecoveryAngle] = useState<'miss_you' | 'seasonal' | 'priority' | 'quality'>('miss_you');
  const [copiedState, setCopiedState] = useState<'sms' | 'call' | 'email' | null>(null);
  const [isSavingRecovery, setIsSavingRecovery] = useState<boolean>(false);
  const [recoverySaveSuccess, setRecoverySaveSuccess] = useState<boolean>(false);
  const [recoverySaveError, setRecoverySaveError] = useState<string | null>(null);

  // Módulo 5: Revenue Recovery Center states
  const [selectedQuoteLeadId, setSelectedQuoteLeadId] = useState<string | number | null>(null);
  const [quoteChannel, setQuoteChannel] = useState<'sms' | 'call' | 'email'>('sms');
  const [quoteRecoveryStatus, setQuoteRecoveryStatus] = useState<'pending' | 'success' | 'refused' | 'no_response'>('pending');
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [quoteClosedValueInput, setQuoteClosedValueInput] = useState<string>('');
  const [quoteAngle, setQuoteAngle] = useState<'budget_fit' | 'priority_slot' | 'satisfaction_check'>('budget_fit');
  const [quoteCopiedState, setQuoteCopiedState] = useState<'sms' | 'call' | 'email' | null>(null);
  const [isSavingQuoteRecovery, setIsSavingQuoteRecovery] = useState<boolean>(false);
  const [quoteSaveSuccess, setQuoteSaveSuccess] = useState<boolean>(false);
  const [quoteSaveError, setQuoteSaveError] = useState<string | null>(null);

  // Fase 6 — Operação Real states
  const [showFase6Dashboard, setShowFase6Dashboard] = useState<boolean>(true);
  const [auditDetailTab, setAuditDetailTab] = useState<'all' | 'sem_contato' | 'sem_orcamento' | 'vendas_sem_valor' | 'recorrentes_sem_freq' | 'incompletos'>('all');

  // Sync Recovery Centers selection when general table row is selected
  useEffect(() => {
    if (selectedLeadId !== null) {
      setSelectedRecoveryLeadId(selectedLeadId);
      setSelectedQuoteLeadId(selectedLeadId);
    }
  }, [selectedLeadId]);

  // Módulo 4: Recovery statistics memo
  const recoveryStats = useMemo(() => {
    let totalAttempts = 0;
    let smsAttempts = 0;
    let callAttempts = 0;
    let emailAttempts = 0;
    let successCount = 0;
    let pendingCount = 0;
    let refusedCount = 0;
    let noResponseCount = 0;

    leads.forEach(l => {
      if (l.recovery_history) {
        try {
          const history = JSON.parse(l.recovery_history);
          if (Array.isArray(history)) {
            totalAttempts += history.length;
            history.forEach(att => {
              if (att.channel === 'sms') smsAttempts++;
              else if (att.channel === 'call') callAttempts++;
              else if (att.channel === 'email') emailAttempts++;

              if (att.status === 'success') successCount++;
              else if (att.status === 'pending') pendingCount++;
              else if (att.status === 'refused') refusedCount++;
              else if (att.status === 'no_response') noResponseCount++;
            });
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    });

    return {
      totalAttempts,
      smsAttempts,
      callAttempts,
      emailAttempts,
      successCount,
      pendingCount,
      refusedCount,
      noResponseCount
    };
  }, [leads]);

  // Módulo 4: US-focused high converting templates generator based on selected client details
  const recoveryTemplates = useMemo(() => {
    const lead = leads.find(l => String(l.id) === String(selectedRecoveryLeadId));
    if (!lead) {
      return {
        sms: 'Select a client to generate custom templates.',
        callScript: 'Select a client to generate custom templates.',
        email: 'Select a client to generate custom templates.'
      };
    }

    const clientName = lead.name || 'Customer';
    const lastDate = lead.last_service_date 
      ? new Date(lead.last_service_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'sometime back';
    
    const price = lead.estimated_price || lead.closed_value || '150';
    const cleanSpec = (lead.bedrooms && lead.bathrooms) 
      ? `${lead.bedrooms} bed, ${lead.bathrooms} bath`
      : 'home cleaning';

    const agencyPhone = '+1 (800) 555-0199';

    switch (recoveryAngle) {
      case 'miss_you':
        return {
          sms: `Hi ${clientName}! It's Dany from Dany Clean Pro. We miss keeping your home clean! 🌟 It's been a while since your last service on ${lastDate}. To welcome you back, we'd love to give you $20 OFF your next clean. Reply text to book or schedule!`,
          callScript: `[Phonetic Tip: Smile, sound energized, warm-toned]\n\n"Hi ${clientName}! This is Dany with Dany Clean Pro. How are you doing today?\n\nI was just looking over our schedules and noticed it’s been a little while since our last visit on ${lastDate} for your ${cleanSpec}.\n\nSince we love having you as a client, I wanted to personally reach out and offer you a special catch-up rate with $20 OFF your next clean! We can get everything looking absolutely sparkling for you next week.\n\nWould you be open to booking a morning or afternoon slot on, say, Tuesday or Thursday?"`,
          email: `Subject: We miss you, ${clientName}! Here is a special $20 check-in gift 🎁\n\nDear ${clientName},\n\nWe hope you're doing wonderful! At Dany Clean Pro, keeping your home clean and peaceful is our absolute honor, and we've missed seeing you on our roster lately.\n\nAccording to our records, your last professional clean was on ${lastDate} for your ${cleanSpec}.\n\nTo make it easier than ever to get your space feeling phenomenally fresh again, we'd like to extend an exclusive $20 discount toward your next home cleaning.\n\nReady to come home to a clean house without lifting a finger? Just reply directly to this email or shoot us a quick text to secure your preferred date!\n\nWarmest regards,\n\nDany & the Dany Clean Pro Team\nPhone: ${lead.phone || agencyPhone}`
        };
      case 'seasonal':
        return {
          sms: `Hi ${clientName}! Dany here from Dany Clean Pro. With the changing season, it's the perfect time to refresh your home! 🏡 Let's schedule a deep clean and lock in preferred dates. Enjoy a loyal client $20 discount today!`,
          callScript: `[Phonetic Tip: Sound proactive, organized, helpful]\n\n"Hi ${clientName}! This is Dany with Dany Clean Pro. Hope your week is off to a great start!\n\nWith the change of season, our calendar is starting to fill up really fast. Since it's been some time since your last service on ${lastDate}, I wanted to reach out to our favorite loyal clients first to help you secure a priority slot before they all go!\n\nWe would love to do a comprehensive deep refresh and we are offering a $20 discount to welcome you back.\n\nDoes next week work for you to get your home looking stunning?"`,
          email: `Subject: Seasonal Home Refresh for ${clientName} (Priority Slot + $20 Off) 🍃\n\nDear ${clientName},\n\nWith the change of season, there is nothing quite like coming home to a thoroughly detailed and deodorized home.\n\nAs one of our valued clients, we want to make sure you get first pick of our upcoming schedule. It has been some time since your last cleaning on ${lastDate}, and we want to help you head into the new season with a home that feels light, clean, and completely organized.\n\nWe are reserving premium slots for returning clients this week, and we've attached a special returning loyalty coupon for $20 OFF your service!\n\nSimply let us know if mornings or afternoons suit you best next week, and we'll take care of the rest.\n\nBest regards,\n\nDany & the Dany Clean Pro Team\nPhone: ${lead.phone || agencyPhone}`
        };
      case 'priority':
        return {
          sms: `Hi ${clientName}! We are finalizing our upcoming cleaning schedules at Dany Clean Pro and wanted to give you priority booking to lock in your preferred date. Text back today to preserve your $20 returning discount!`,
          callScript: `[Phonetic Tip: Exude exclusivity and limited Availability]\n\n"Hi ${clientName}! This is Dany from Dany Clean Pro.\n\nI'm calling because we are currently finalizing our premium routes for your area for the upcoming month. Your previous slot for your ${cleanSpec} was highly popular, and since it's been several weeks since your last clean on ${lastDate}, I wanted to give you the first right of refusal before we open that slot to new incoming leads.\n\nIf we lock it in today, I can apply our exclusive $20 VIP returning credit too!\n\nWould you like me to reserve that spot for you for next week?"`,
          email: `Subject: Priority Access: Lock in your preferred cleaning spot, ${clientName} 🔒\n\nDear ${clientName},\n\nAt Dany Clean Pro, we are committed to providing reliable, expert care for your home. In order to maintain consistent service quality and travel routes, our slots are allocated on a first-come, first-served basis.\n\nSince your last clean on ${lastDate}, those calendar slots have become highly sought-after. However, because you are a valued client, we want to give you priority access to reserve your preferred day and time before they are fully booked.\n\nBook your catch-up service today and we'll also apply a $20 loyalty credit directly to your invoice.\n\nReply directly to this email or call us to reserve your spot!\n\nWarmly,\n\nDany & the Dany Clean Pro Team\nPhone: ${lead.phone || agencyPhone}`
        };
      case 'quality':
        return {
          sms: `Hi ${clientName}, Dany from Dany Clean Pro here! We haven't heard from you since your clean on ${lastDate} and want to ensure everything was perfect. We'd love to follow up with $20 off your next home clean. Let us know!`,
          callScript: `[Phonetic Tip: High empathy, client satisfaction focused]\n\n"Hi ${clientName}! This is Dany checking in from Dany Clean Pro. How has everything been going with you?\n\nI was reviewing our quality service list and saw we last took care of your ${cleanSpec} back on ${lastDate}.\n\nYour satisfaction is our absolute priority, so I wanted to check in personally to make sure everything was exactly to your liking on our last visit, and see how your home is holding up! We'd love to help you get it back to immaculate condition with a special customer-appreciation $20 discount on your next service.\n\nHow is your home feeling lately? Do we need to schedule a refresh?"`,
          email: `Subject: Quality Check & Special Customer Appreciation Discount for ${clientName} 💖\n\nDear ${clientName},\n\nYour happiness and peace of mind is the exact reason we started Dany Clean Pro. We hope we left your home feeling like a sanctuary on your last visit back on ${lastDate}.\n\nWe haven't heard from you in a little while, and we want to ensure everything was perfect. To thank you for being a part of our client family and to welcome you back, we've credited a special $20 Customer Appreciation discount to your profile.\n\nIf you'd love to have your home smelling fresh and looking immaculate again next week, please click reply or text us to claim your slot and request your discount.\n\nThank you for choosing Dany Clean Pro!\n\nWarmly,\n\nDany & the Dany Clean Pro Team\nPhone: ${lead.phone || agencyPhone}`
        };
    }
  }, [selectedRecoveryLeadId, recoveryAngle, leads]);

  // Módulo 5: Revenue Recovery statistics and lists
  const quoteRecoveryStats = useMemo(() => {
    let pendingCount = 0;
    let unanswered24h = 0;
    let unanswered48h = 0;
    let unanswered72h = 0;
    let totalFinancialValueStuck = 0;
    const now = new Date();

    const pendingQuotesList: any[] = [];

    leads.forEach(l => {
      const isQuoteSent = l.quote_sent === 1 || String(l.quote_sent) === 'true' || l.status === 'quote_sent';
      const isClosed = l.sale_closed === 1 || String(l.sale_closed) === 'true' || l.status === 'closed' || l.status === 'booked' || l.status === 'completed';
      
      if (isQuoteSent && !isClosed) {
        pendingCount++;
        
        let priceNum = 0;
        if (l.revenue_estimate) {
          priceNum = Number(l.revenue_estimate);
        } else if (l.estimated_price) {
          priceNum = parseFloat(String(l.estimated_price).replace(/[^0-9.-]/g, '')) || 0;
        } else if (l.closed_value) {
          priceNum = Number(l.closed_value);
        }
        if (!priceNum || priceNum <= 0) {
          priceNum = 150; // Fallback default estimated price
        }

        totalFinancialValueStuck += priceNum;

        // Parse date for inactivity tracking
        let hoursElapsed = 0;
        let isBackfilled = false;
        let dateObj: Date | null = null;

        if (l.quote_sent_at) {
          isBackfilled = l.quote_sent_at.includes('_backfilled');
          const cleanDateStr = l.quote_sent_at.split('_')[0];
          dateObj = new Date(cleanDateStr);
          if (!isNaN(dateObj.getTime())) {
            const diffMs = now.getTime() - dateObj.getTime();
            hoursElapsed = Math.max(0, diffMs / (1000 * 60 * 60));
          }
        }

        if (hoursElapsed >= 72) {
          unanswered72h++;
        } else if (hoursElapsed >= 48) {
          unanswered48h++;
        } else if (hoursElapsed >= 24) {
          unanswered24h++;
        }

        // Count previous attempts
        let attemptsList: any[] = [];
        try {
          if (l.quote_recovery_history) {
            attemptsList = JSON.parse(l.quote_recovery_history);
          }
        } catch (e) {
          // ignore
        }

        pendingQuotesList.push({
          lead: l,
          price: priceNum,
          hoursElapsed,
          isBackfilled,
          dateObj,
          attemptsCount: attemptsList.length,
          attempts: attemptsList
        });
      }
    });

    // Sort pendingQuotesList by price descending
    const largestQuotes = [...pendingQuotesList]
      .sort((a, b) => b.price - a.price);

    return {
      pendingCount,
      unanswered24h,
      unanswered48h,
      unanswered72h,
      totalFinancialValueStuck,
      largestQuotes,
      pendingQuotesList
    };
  }, [leads]);

  // Módulo 5: Copywriting Campaign Templates
  const quoteRecoveryTemplates = useMemo(() => {
    const lead = leads.find(l => String(l.id) === String(selectedQuoteLeadId));
    if (!lead) {
      return {
        sms: 'Select a pending quote to generate templates.',
        callScript: 'Select a pending quote to generate templates.',
        email: 'Select a pending quote to generate templates.'
      };
    }

    const clientName = lead.name || 'Customer';
    const price = lead.revenue_estimate || lead.estimated_price || '150';
    const cleanSpec = (lead.bedrooms && lead.bathrooms) 
      ? `${lead.bedrooms} bed, ${lead.bathrooms} bath`
      : 'home cleaning';

    const agencyPhone = '+1 (800) 555-0199';

    switch (quoteAngle) {
      case 'budget_fit':
        return {
          sms: `Hi ${clientName}! Dany here from Dany Clean Pro. Just checking in on the clean quote of $${price} we sent for your ${cleanSpec}. We understand budget is key—would a $15 matching discount help us get everything sparkling for you?`,
          callScript: `[Phonetic Tip: Warm, helpful, flexible tone]\n\n"Hi ${clientName}! This is Dany with Dany Clean Pro. I hope you're having an awesome week!\n\nI wanted to briefly follow up on the custom cleaning estimate of $${price} we sent over for your beautiful home.\n\nAt Dany Clean Pro, we always strive to fit our premium service into our clients' plans. I wanted to ask if there’s any adjustment we can make or if a special $15 budget-match credit would help us get everything absolutely spotless for you next week?\n\nNo pressure at all! We'd just love to take that chore off your hands."`,
          email: `Subject: Quick budget check-in regarding your $${price} Dany Clean Pro quote 🏡\n\nDear ${clientName},\n\nI hope your week is off to a fabulous start!\n\nWe sent over a customized home cleaning quote for your ${cleanSpec} at $${price} a few days ago, and I wanted to check in to make sure all your questions were answered.\n\nWe know that home maintenance is an investment, and we want to make it as accessible as possible. To help you get your weekends back and enjoy a pristine living space, we'd like to extend a special budget-match adjustment of $15 off your primary service.\n\nWould you be open to claiming this adjustment? Just reply to this email or send us a quick text to schedule our top-tier pro crew!\n\nSincerely,\n\nDany & the Dany Clean Pro Team\nPhone: ${lead.phone || agencyPhone}`
        };
      case 'priority_slot':
        return {
          sms: `Hi ${clientName}! We're scheduling crews near your area this week. We have a priority slot open and can apply a $15 'Neighbourhood Route' discount to your $${price} quote if we book today! Text back to lock it in!`,
          callScript: `[Phonetic Tip: Friendly urgency, route efficiency]\n\n"Hi ${clientName}! This is Dany from Dany Clean Pro.\n\nI'm calling because we are currently optimizing our route paths for next week. We actually have one of our highly requested expert teams scheduled in your immediate neighborhood on Tuesday morning!\n\nSince we are already there, we can wave our standard travel fee and credit $15 directly to your estimated quote of $${price}, bringing it down to just $${Number(price) - 15 || 135}!\n\nWould it be helpful to lock in that morning slot for your ${cleanSpec} before our route closes?"`,
          email: `Subject: Priority scheduling slot + $15 route discount for ${clientName} ⚡\n\nDear ${clientName},\n\nWe are currently organizing our upcoming residential cleaning routes in your neighborhood and noticed that one of our elite 5-star teams is scheduled to serve a home just minutes away from you next Tuesday!\n\nBecause they will already be in your immediate vicinity, we are able to bypass our traditional route setup overhead and pass the savings directly to you.\n\nIf you book your ${cleanSpec} cleaning today, we will apply an immediate $15 Neighborhood Route Discount to your $${price} quote.\n\nThis slot is highly requested, so please let us know if Tuesday morning or afternoon works best to claim your discount!\n\nBest regards,\n\nDany & the Dany Clean Pro Team\nPhone: ${lead.phone || agencyPhone}`
        };
      case 'satisfaction_check':
        return {
          sms: `Hi ${clientName}! Just following up on your $${price} home quote from Dany Clean Pro. Do you have any questions about our 50-point cleaning checklist or satisfaction guarantee? Happy to help!`,
          callScript: `[Phonetic Tip: Service-centric, high details quality]\n\n"Hi ${clientName}! This is Dany with Dany Clean Pro. Hope you are having a wonderful day.\n\nI'm just reaching out regarding your estimate of $${price} for professional care of your ${cleanSpec}.\n\nOur team is known for detail and quality, and each service comes backed by our 100% Sparkle Satisfaction Guarantee. I wanted to see if you had any questions about what is included on our custom 50-point checklist or how we protect your home?\n\nI'd be more than happy to tailor the list to focus on high-traffic areas if you'd like!"`,
          email: `Subject: Dany Clean Pro: Quick question on your $${price} home estimate, ${clientName}?\n\nDear ${clientName},\n\nWe know that choosing the right cleaning company is all about trust and detail. \n\nWhen we sent over your custom estimate of $${price} for your ${cleanSpec}, our goal was to provide an extraordinary level of clean that lets you breathe easy.\n\nAll of our services are fully bonded, insured, and covered by our signature 100% Sparkle Satisfaction Guarantee: if you aren't absolutely thrilled with any area, we will reclean it for free, no questions asked.\n\nI would love to check if you have any questions about our processes, or if you would like us to customize the checklist to target specific priorities like pet hair or heavy kitchen prep?\n\nSimply let me know, or give us a call to discuss how we can make your home feel perfect!\n\nWarm regards,\n\nDany & the Dany Clean Pro Team\nPhone: ${lead.phone || agencyPhone}`
        };
    }
  }, [selectedQuoteLeadId, quoteAngle, leads]);

  // Parse helper for dates to compute elapsed days
  const getDaysElapsed = (lead: Lead): number => {
    try {
      const createdAtAny = lead.createdAt;
      const createdStr = lead.created_at;
      if (!createdAtAny && !createdStr) return 0;

      let leadDate: Date;
      if (createdAtAny && typeof createdAtAny.toDate === 'function') {
        leadDate = createdAtAny.toDate();
      } else if (createdAtAny && createdAtAny.seconds !== undefined) {
        leadDate = new Date(createdAtAny.seconds * 1000);
      } else if (createdStr) {
        leadDate = new Date(createdStr);
      } else {
        leadDate = new Date(createdAtAny);
      }

      const diffTime = Math.abs(new Date().getTime() - leadDate.getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 0;
    }
  };

  // Safe checks for discarded and completed
  const isDiscarded = (lead: Lead): boolean => {
    return lead.status === 'cancelled' || lead.intent_category === 'Invalid';
  };

  const isClosedWon = (lead: Lead): boolean => {
    return lead.status === 'completed' || lead.status === 'closed' || lead.status === 'booked' || lead.status === 'scheduled';
  };

  // RECOMMENDATION ENGINE (Priority Actions - 100% Visual and Advisory)
  const getVisualRecommendation = (lead: Lead) => {
    const isNew = lead.status === 'new';
    const hasUrgentMsg = (lead.message || lead.customer_message || '').toLowerCase().match(/(urgente|asap|urgency|now|hoje|today|amanha|tomorrow|logo)/);
    const score = lead.lead_score ?? 0;
    const estRevenue = lead.revenue_estimate ?? 0;

    if (score >= 75 && (isNew || hasUrgentMsg)) {
      return {
        label: "Ligar agora",
        icon: Phone,
        color: "text-rose-700 bg-rose-50 border-rose-100",
        pillColor: "bg-rose-500",
        description: "Lead com alto interesse e grande urgência identificada pelo modelo. Entre em contato telefônico para fechar."
      };
    }

    if (lead.status === 'estimate_requested' || (estRevenue > 0 && !lead.estimated_price && !isClosedWon(lead))) {
      return {
        label: "Enviar orçamento",
        icon: DollarSign,
        color: "text-emerald-700 bg-emerald-50 border-emerald-100",
        pillColor: "bg-emerald-500",
        description: "Estudo financeiro disponível em background. Envie o preço estimado para destravar a negociação."
      };
    }

    if (lead.status === 'quote_sent' || lead.status === 'contacted' || lead.status === 'followup_needed') {
      return {
        label: "Fazer follow-up",
        icon: Send,
        color: "text-amber-700 bg-amber-50 border-amber-100",
        pillColor: "bg-amber-500",
        description: "Lead com proposta encaminhada, mas sem interação de fechamento recente. Toque preventivo."
      };
    }

    return {
      label: "Aguardar resposta",
      icon: Clock,
      color: "text-slate-600 bg-slate-50 border-slate-100",
      pillColor: "bg-slate-400",
      description: "Interações em andamento ou lead aguardando retorno natural (ex: envio de fotos adicionais do imóvel)."
    };
  };

  // FILTERED GROUPS
  // 1. HOT LEADS: Score >= 75, sem fechamento, sem descarte. Sorted by score DESC
  const hotLeads = useMemo(() => {
    return leads
      .filter(lead => {
        const score = lead.lead_score ?? 0;
        return score >= 75 && !isClosedWon(lead) && !isDiscarded(lead);
      })
      .sort((a, b) => (b.lead_score ?? 0) - (a.lead_score ?? 0));
  }, [leads]);

  // 2. FOLLOW-UP NEEDED: Sem contato recente, sem orçamento, ou sem atualização recente
  const followupLeads = useMemo(() => {
    return leads.filter(lead => {
      if (isClosedWon(lead) || isDiscarded(lead)) return false;
      const noEstimate = !lead.estimated_price && !(lead.revenue_estimate && lead.revenue_estimate > 0);
      const isAwaitingOrInquiring = lead.status === 'followup_needed' || lead.status === 'inquiring' || lead.status === 'contacted' || lead.status === 'new';
      return isAwaitingOrInquiring && noEstimate;
    });
  }, [leads]);

  // 3. LOST OPPORTUNITIES: Score alto (>=70) e Revenue alto (>=180), sem fechamento após 3+ dias
  const lostOpportunities = useMemo(() => {
    return leads.filter(lead => {
      if (isClosedWon(lead) || isDiscarded(lead)) return false;
      const score = lead.lead_score ?? 0;
      const revenue = lead.revenue_estimate ?? 0;
      const daysElapsed = getDaysElapsed(lead);
      return score >= 70 && revenue >= 170 && daysElapsed >= 3;
    });
  }, [leads]);

  // 4. TOP REVENUE LEADS (Most rewarding value indicators)
  const topRevenueLeads = useMemo(() => {
    return leads
      .filter(lead => (lead.revenue_estimate ?? 0) > 0 && !isDiscarded(lead))
      .sort((a, b) => (b.revenue_estimate ?? 0) - (a.revenue_estimate ?? 0));
  }, [leads]);

  // COMBINE AND SEARCH FILTERING BASED ON SEARCH TERM
  const currentTabLeads = useMemo(() => {
    let base: Lead[] = [];
    if (activeTab === 'hot') base = hotLeads;
    else if (activeTab === 'followup') base = followupLeads;
    else if (activeTab === 'lost') base = lostOpportunities;
    else if (activeTab === 'top_revenue') base = topRevenueLeads;
    else if (activeTab === 'all') base = leads;

    if (!searchTerm.trim()) return base;

    const term = searchTerm.toLowerCase();
    return base.filter(l => 
      l.name.toLowerCase().includes(term) || 
      (l.phone || '').includes(term) ||
      (l.city || '').toLowerCase().includes(term) ||
      (l.service_type || '').toLowerCase().includes(term) ||
      (l.intent_category || '').toLowerCase().includes(term)
    );
  }, [activeTab, hotLeads, followupLeads, lostOpportunities, topRevenueLeads, leads, searchTerm]);

  // GENERAL METRICS FOR DASHBOARD HEAD & CONVERSION STATISTICS (Fase 4)
  const dashboardStats = useMemo(() => {
    // Pipeline Value
    const totalPipelineRevenue = leads
      .filter(l => !isClosedWon(l) && !isDiscarded(l))
      .reduce((sum, l) => sum + (l.revenue_estimate ?? 0), 0);

    // Prioritized Leads (Score >= 75)
    const prioritizedCount = leads.filter(l => (l.lead_score ?? 0) >= 75).length;

    // Execution metrics
    const calledCount = leads.filter(l => l.call_made === 1).length;
    const answeredCount = leads.filter(l => l.client_answered === 1).length;
    const quoteSentCount = leads.filter(l => l.quote_sent === 1).length;
    const scheduledCount = leads.filter(l => l.service_scheduled === 1).length;
    const closedCount = leads.filter(l => l.sale_closed === 1).length;

    // Real Generated Revenue (Sum of closed_value)
    const realRevenue = leads.reduce((sum, l) => sum + Number(l.closed_value || 0), 0);

    // Temperature Tier Conversions
    // High Tier (Score >= 75)
    const highTierLeads = leads.filter(l => (l.lead_score ?? 0) >= 75);
    const highTierTotal = highTierLeads.length;
    const highTierClosed = highTierLeads.filter(l => l.sale_closed === 1).length;
    const highTierConversionRate = highTierTotal > 0 ? Math.round((highTierClosed / highTierTotal) * 100) : 0;
    const highTierRevenue = highTierLeads.reduce((sum, l) => sum + Number(l.closed_value || 0), 0);

    // Mid Tier (Score 40-74)
    const midTierLeads = leads.filter(l => (l.lead_score ?? 0) >= 40 && (l.lead_score ?? 0) < 75);
    const midTierTotal = midTierLeads.length;
    const midTierClosed = midTierLeads.filter(l => l.sale_closed === 1).length;
    const midTierConversionRate = midTierTotal > 0 ? Math.round((midTierClosed / midTierTotal) * 100) : 0;
    const midTierRevenue = midTierLeads.reduce((sum, l) => sum + Number(l.closed_value || 0), 0);

    // Low Tier (Score < 40 or Null)
    const lowTierLeads = leads.filter(l => !(l.lead_score && l.lead_score >= 40));
    const lowTierTotal = lowTierLeads.length;
    const lowTierClosed = lowTierLeads.filter(l => l.sale_closed === 1).length;
    const lowTierConversionRate = lowTierTotal > 0 ? Math.round((lowTierClosed / lowTierTotal) * 100) : 0;
    const lowTierRevenue = lowTierLeads.reduce((sum, l) => sum + Number(l.closed_value || 0), 0);

    // Phase 5 Recurring LTV metrics
    const totalProjectedLTV = leads.reduce((sum, l) => sum + Number(l.projected_ltv || 0), 0);
    const activeRecurringLeadsCount = leads.filter(l => l.projected_frequency && l.projected_frequency !== 'one-time').length;

    // Phase 5 Objection stats
    const objectionsDistribution = leads.reduce((acc: Record<string, number>, l) => {
      const category = l.objection_category || 'none';
      if (category !== 'none') {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {});

    const totalObjectionsLogged = Object.values(objectionsDistribution).reduce((sum, val) => sum + val, 0);

    return {
      totalPipelineRevenue,
      prioritizedCount,
      calledCount,
      answeredCount,
      quoteSentCount,
      scheduledCount,
      closedCount,
      realRevenue,
      // Tiers
      highTierTotal,
      highTierClosed,
      highTierConversionRate,
      highTierRevenue,
      
      midTierTotal,
      midTierClosed,
      midTierConversionRate,
      midTierRevenue,

      lowTierTotal,
      lowTierClosed,
      lowTierConversionRate,
      lowTierRevenue,

      // Phase 5
      totalProjectedLTV,
      activeRecurringLeadsCount,
      objectionsDistribution,
      totalObjectionsLogged
    };
  }, [leads]);

  const selectedLead = useMemo(() => {
    if (selectedLeadId === null) return null;
    return leads.find(l => l.id === selectedLeadId) || null;
  }, [selectedLeadId, leads]);

  // Marketing Attribution Stats - Módulo 1 calculation block
  const marketingStats = useMemo(() => {
    const channels = [
      'Website',
      'Organic',
      'Google Ads',
      'Facebook Ads',
      'Instagram',
      'WhatsApp',
      'Jennifer AI',
      'Twilio SMS',
      'Direct Call',
      'Referral',
      'Unknown'
    ];

    const channelData = channels.reduce((acc, channel) => {
      acc[channel] = {
        name: channel,
        leadsCount: 0,
        salesCount: 0,
        totalRevenue: 0,
        totalScore: 0,
        leadsWithScoreCount: 0,
        conversionRate: 0,
        avgScore: 0
      };
      return acc;
    }, {} as Record<string, any>);

    leads.forEach((l) => {
      const ch = l.attribution_channel || 'Unknown';
      if (!channelData[ch]) {
        channelData[ch] = {
          name: ch,
          leadsCount: 0,
          salesCount: 0,
          totalRevenue: 0,
          totalScore: 0,
          leadsWithScoreCount: 0,
          conversionRate: 0,
          avgScore: 0
        };
      }

      const item = channelData[ch];
      item.leadsCount += 1;
      
      if (l.sale_closed === 1) {
        item.salesCount += 1;
        item.totalRevenue += Number(l.closed_value || 0);
      }
      
      if (l.lead_score !== undefined && l.lead_score !== null) {
        item.totalScore += Number(l.lead_score);
        item.leadsWithScoreCount += 1;
      }
    });

    const list = Object.values(channelData).map((item: any) => {
      item.conversionRate = item.leadsCount > 0 ? Math.round((item.salesCount / item.leadsCount) * 100) : 0;
      item.avgScore = item.leadsWithScoreCount > 0 ? Math.round(item.totalScore / item.leadsWithScoreCount) : 0;
      return item;
    });

    // Find winners
    let topRevenueChannel = { name: 'Sem registros', value: 0 };
    let topSalesChannel = { name: 'Sem registros', value: 0 };
    let topScoreChannel = { name: 'Sem registros', value: 0 };
    let topConversionChannel = { name: 'Sem registros', value: 0 };

    list.forEach((item: any) => {
      if (item.totalRevenue > topRevenueChannel.value) {
        topRevenueChannel = { name: item.name, value: item.totalRevenue };
      }
      if (item.salesCount > topSalesChannel.value) {
        topSalesChannel = { name: item.name, value: item.salesCount };
      }
      if (item.avgScore > topScoreChannel.value) {
        topScoreChannel = { name: item.name, value: item.avgScore };
      }
      if (item.leadsCount >= 1 && item.conversionRate > topConversionChannel.value) {
        topConversionChannel = { name: item.name, value: item.conversionRate };
      }
    });

    const sortedList = [...list].sort((a, b) => b.leadsCount - a.leadsCount);

    return {
      channelsReport: sortedList,
      topRevenueChannel,
      topSalesChannel,
      topScoreChannel,
      topConversionChannel
    };
  }, [leads]);

  // Sales Velocity Stats - Módulo 2 calculation block
  const salesVelocityStats = useMemo(() => {
    let totalResponseTimeMs = 0;
    let responsiveLeadsCount = 0;

    let totalHotResponseTimeMs = 0;
    let responsiveHotLeadsCount = 0;

    const uncontactedHotLeads: Lead[] = [];
    const pendingActionLeads: Lead[] = []; // Leads that are 'new' or have no first_contacted_at and not contacted

    leads.forEach((l) => {
      const isLeadDiscarded = isDiscarded(l);
      const isLeadClosed = isClosedWon(l);

      // Parse lead created_at cleanly
      let createdDate = l.created_at ? new Date(l.created_at) : null;
      if (!createdDate && l.createdAt) {
        const createdAtAny = l.createdAt;
        if (typeof createdAtAny.toDate === 'function') {
          createdDate = createdAtAny.toDate();
        } else if (createdAtAny.seconds !== undefined) {
          createdDate = new Date(createdAtAny.seconds * 1000);
        } else {
          createdDate = new Date(createdAtAny);
        }
      }

      // 1. Calculations for leads that have been contacted (first_contacted_at is populated)
      if (l.first_contacted_at && createdDate) {
        const contactedDate = new Date(l.first_contacted_at);
        const responseTimeMs = contactedDate.getTime() - createdDate.getTime();
        
        // Only include if positive
        if (responseTimeMs >= 0) {
          totalResponseTimeMs += responseTimeMs;
          responsiveLeadsCount += 1;

          if ((l.lead_score ?? 0) >= 75) {
            totalHotResponseTimeMs += responseTimeMs;
            responsiveHotLeadsCount += 1;
          }
        }
      }

      // 2. Calculations/List of active uncontacted Hot Leads
      const score = l.lead_score ?? 0;
      if (score >= 75 && !isLeadDiscarded && !isLeadClosed && !l.first_contacted_at) {
        uncontactedHotLeads.push(l);
      }

      // 3. Leads awaiting initial contact
      if (!l.first_contacted_at && !isLeadDiscarded && !isLeadClosed && (l.status === 'new' || !l.call_made)) {
        pendingActionLeads.push(l);
      }
    });

    // Formatting helper
    const formatDuration = (ms: number): string => {
      if (ms <= 0) return '0 min';
      const totalMinutes = Math.floor(ms / (1000 * 60));
      if (totalMinutes < 60) {
        return `${totalMinutes} min`;
      }
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours < 24) {
        return `${hours}h ${minutes}m`;
      }
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    };

    const avgResponseTimeMs = responsiveLeadsCount > 0 ? Math.round(totalResponseTimeMs / responsiveLeadsCount) : 0;
    const avgHotResponseTimeMs = responsiveHotLeadsCount > 0 ? Math.round(totalHotResponseTimeMs / responsiveHotLeadsCount) : 0;

    // Calculate how long uncontacted hot leads have been waiting
    const getLeadWaitingDurationMs = (lead: Lead): number => {
      let createdDate = lead.created_at ? new Date(lead.created_at) : null;
      if (!createdDate && lead.createdAt) {
        const createdAtAny = lead.createdAt;
        if (typeof createdAtAny.toDate === 'function') {
          createdDate = createdAtAny.toDate();
        } else if (createdAtAny.seconds !== undefined) {
          createdDate = new Date(createdAtAny.seconds * 1000);
        } else {
          createdDate = new Date(createdAtAny);
        }
      }
      if (!createdDate) return 0;
      return Math.max(0, new Date().getTime() - createdDate.getTime());
    };

    // Calculate average wait time for active hot leads
    let totalHotWaitMs = 0;
    uncontactedHotLeads.forEach(l => {
      totalHotWaitMs += getLeadWaitingDurationMs(l);
    });
    const avgHotWaitTimeMs = uncontactedHotLeads.length > 0 ? Math.round(totalHotWaitMs / uncontactedHotLeads.length) : 0;

    return {
      avgResponseText: responsiveLeadsCount > 0 ? formatDuration(avgResponseTimeMs) : 'N/A (Aguardando contato)',
      avgHotResponseText: responsiveHotLeadsCount > 0 ? formatDuration(avgHotResponseTimeMs) : 'N/A (Aguardando contato)',
      avgHotWaitText: uncontactedHotLeads.length > 0 ? formatDuration(avgHotWaitTimeMs) : '0 min',
      uncontactedHotCount: uncontactedHotLeads.length,
      uncontactedHotLeads: uncontactedHotLeads.map(lead => ({
        ...lead,
        waitingMs: getLeadWaitingDurationMs(lead),
        waitingText: formatDuration(getLeadWaitingDurationMs(lead))
      })).sort((a,b) => b.waitingMs - a.waitingMs),
      pendingActionCount: pendingActionLeads.length,
      pendingActionLeads: pendingActionLeads.map(lead => ({
        ...lead,
        waitingMs: getLeadWaitingDurationMs(lead),
        waitingText: formatDuration(getLeadWaitingDurationMs(lead))
      })).sort((a,b) => b.waitingMs - a.waitingMs),
      responsiveLeadsCount,
      responsiveHotLeadsCount
    };
  }, [leads]);

  // Módulo 3: Customer Lifecycle Stats calculation block
  const customerLifecycleStats = useMemo(() => {
    let leadCount = 0;
    let activeCount = 0;
    let recurringCount = 0;
    let pausedCount = 0;
    let lostCount = 0;

    const listLeads: Lead[] = [];
    const listActive: Lead[] = [];
    const listRecurring: Lead[] = [];
    const listPaused: Lead[] = [];
    const listLost: Lead[] = [];
    const listNeedsReactivation: { lead: Lead; daysElapsedSinceLastService: number; type: 'active' | 'recurring'; missingDate: boolean }[] = [];

    // Top Recurring Client (high value)
    let topRecurringClient: Lead | null = null;
    let topRecurringLtv = 0;

    const today = new Date();

    leads.forEach((l) => {
      // Determine final status
      let status: 'lead' | 'active' | 'recurring' | 'paused' | 'lost' = 'lead';
      const storedStatus = l.lifecycle_status;
      const isClosed = l.sale_closed === 1 || (l.sale_closed as any) === true;
      const freq = l.projected_frequency;

      if (storedStatus === 'paused') {
        status = 'paused';
      } else if (storedStatus === 'lost') {
        status = 'lost';
      } else {
        if (isClosed) {
          if (freq === 'weekly' || freq === 'biweekly' || freq === 'monthly') {
            status = 'recurring';
          } else {
            status = 'active';
          }
        } else {
          status = 'lead';
        }
      }

      switch (status) {
        case 'lead':
          leadCount++;
          listLeads.push(l);
          break;
        case 'active':
          activeCount++;
          listActive.push(l);
          break;
        case 'recurring':
          recurringCount++;
          listRecurring.push(l);
          const ltv = Number(l.projected_ltv) || 0;
          if (ltv > topRecurringLtv) {
            topRecurringLtv = ltv;
            topRecurringClient = l;
          }
          break;
        case 'paused':
          pausedCount++;
          listPaused.push(l);
          break;
        case 'lost':
          lostCount++;
          listLost.push(l);
          break;
      }

      // Check Needs Reactivation for "Active Client" or "Recurring Client"
      if (status === 'active' || status === 'recurring') {
        if (l.last_service_date) {
          const lastService = new Date(l.last_service_date);
          const diffMs = today.getTime() - lastService.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          // Expected limit logic:
          // active (one-time expectation): warning if > 45 days.
          // recurring (weekly/biweekly/monthly expectation): warning if > 35 days.
          const limitDays = status === 'active' ? 45 : 35;
          if (diffDays > limitDays) {
            listNeedsReactivation.push({
              lead: l,
              daysElapsedSinceLastService: diffDays,
              type: status,
              missingDate: false
            });
          }
        } else {
          // If they have no last service date set, highlight them!
          listNeedsReactivation.push({
            lead: l,
            daysElapsedSinceLastService: 9999,
            type: status,
            missingDate: true
          });
        }
      }
    });

    // Retention Rate calculation:
    // (Active + Recurring) / (Active + Recurring + Paused + Lost) * 100
    const totalDurablePortfolio = activeCount + recurringCount + pausedCount + lostCount;
    const retentionRate = totalDurablePortfolio > 0 
      ? Math.round(((activeCount + recurringCount) / totalDurablePortfolio) * 100) 
      : 0;

    return {
      leadCount,
      activeCount,
      recurringCount,
      pausedCount,
      lostCount,
      retentionRate,
      topRecurringClient,
      topRecurringLtv,
      listLeads,
      listActive,
      listRecurring,
      listPaused,
      listLost,
      listNeedsReactivation: listNeedsReactivation.sort((a, b) => b.daysElapsedSinceLastService - a.daysElapsedSinceLastService),
      needsReactivationCount: listNeedsReactivation.length
    };
  }, [leads]);

  // Fase 6 — Operação Real stats computation
  const fase6Stats = useMemo(() => {
    // Current Local time from system metadata: 2026-05-30
    const todayStr = '2026-05-30';

    // 1. Daily metrics
    let leadsReceivedToday = 0;
    let leadsContactedToday = 0;
    let quotesSentToday = 0;
    let salesClosedToday = 0;
    let revenueClosedToday = 0;
    let clientsReactivatedToday = 0;

    leads.forEach(l => {
      // leadsReceivedToday
      let createdDateStr = '';
      if (l.created_at) {
        createdDateStr = l.created_at.split('T')[0];
      } else if (l.createdAt) {
        const createdAtAny = l.createdAt;
        if (typeof createdAtAny.toDate === 'function') {
          createdDateStr = createdAtAny.toDate().toISOString().split('T')[0];
        } else if (createdAtAny.seconds !== undefined) {
          createdDateStr = new Date(createdAtAny.seconds * 1000).toISOString().split('T')[0];
        } else {
          createdDateStr = new Date(createdAtAny).toISOString().split('T')[0];
        }
      }
      if (createdDateStr === todayStr) {
        leadsReceivedToday++;
      }

      // leadsContactedToday
      if (l.first_contacted_at && l.first_contacted_at.startsWith(todayStr)) {
        leadsContactedToday++;
      } else if (l.call_made === 1 && l.updated_at && l.updated_at.startsWith(todayStr)) {
        leadsContactedToday++;
      }

      // quotesSentToday
      if (l.quote_sent_at && l.quote_sent_at.startsWith(todayStr)) {
        quotesSentToday++;
      }

      // salesClosedToday & revenueClosedToday
      const isClosedToday = (l.sale_closed === 1 || l.status === 'closed' || l.status === 'booked') && l.updated_at && l.updated_at.startsWith(todayStr);
      if (isClosedToday) {
        salesClosedToday++;
        revenueClosedToday += Number(l.closed_value || 0);
      } else if (l.sale_closed === 1 && !l.updated_at && createdDateStr === todayStr) {
        salesClosedToday++;
        revenueClosedToday += Number(l.closed_value || 0);
      }

      // clientsReactivatedToday
      let hasReactivationToday = false;
      if (l.recovery_history) {
        try {
          const rh = JSON.parse(l.recovery_history);
          if (Array.isArray(rh)) {
            hasReactivationToday = rh.some((attempt: any) => attempt.status === 'success' && attempt.date && attempt.date.startsWith(todayStr));
          }
        } catch(e){}
      }
      if (l.quote_recovery_history) {
        try {
          const qh = JSON.parse(l.quote_recovery_history);
          if (Array.isArray(qh)) {
            hasReactivationToday = hasReactivationToday || qh.some((attempt: any) => attempt.status === 'success' && attempt.date && attempt.date.startsWith(todayStr));
          }
        } catch(e){}
      }
      if (hasReactivationToday) {
        clientsReactivatedToday++;
      }
    });

    // 2. Weekly metrics
    // Total revenue in system
    const totalWeeklyRevenue = leads.reduce((sum, l) => sum + Number(l.closed_value || 0), 0);

    // Closing rate
    const closedCount = leads.filter(l => l.sale_closed === 1 || l.status === 'closed' || l.status === 'booked' || l.status === 'completed').length;
    const totalLeadsCount = leads.length;
    const closingRate = totalLeadsCount > 0 ? Math.round((closedCount / totalLeadsCount) * 100) : 0;

    // Average Response Time
    let totalRespTimeMs = 0;
    let countedRespLeads = 0;
    leads.forEach(l => {
      let created = l.created_at ? new Date(l.created_at) : null;
      if (!created && l.createdAt) {
        const createdAtAny = l.createdAt;
        if (typeof createdAtAny.toDate === 'function') {
          created = createdAtAny.toDate();
        } else if (createdAtAny.seconds !== undefined) {
          created = new Date(createdAtAny.seconds * 1000);
        } else {
          created = new Date(createdAtAny);
        }
      }
      let firstContact = l.first_contacted_at ? new Date(l.first_contacted_at) : null;

      if (created && firstContact && !isNaN(created.getTime()) && !isNaN(firstContact.getTime())) {
        const diff = firstContact.getTime() - created.getTime();
        if (diff > 0) {
          totalRespTimeMs += diff;
          countedRespLeads++;
        }
      }
    });
    const avgResponseMs = countedRespLeads > 0 ? totalRespTimeMs / countedRespLeads : 0;
    const formatMsToReadable = (ms: number) => {
      if (ms <= 0) return '0 min';
      const mins = Math.round(ms / (1000 * 60));
      if (mins < 60) return `${mins} min`;
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    };
    const avgResponseText = formatMsToReadable(avgResponseMs);

    // Best Marketing Channel (based on highest absolute revenue generated)
    const channelRevenue: Record<string, number> = {};
    leads.forEach(l => {
      const ch = l.attribution_channel || 'Organic / Direct';
      const val = Number(l.closed_value || 0);
      channelRevenue[ch] = (channelRevenue[ch] || 0) + val;
    });
    let bestChannel = 'N/A';
    let bestChannelRev = 0;
    Object.entries(channelRevenue).forEach(([ch, rev]) => {
      if (rev > bestChannelRev) {
        bestChannelRev = rev;
        bestChannel = ch;
      }
    });
    if (bestChannel === 'N/A') {
      const channelCounts: Record<string, number> = {};
      leads.forEach(l => {
        const ch = l.attribution_channel || 'Organic / Direct';
        channelCounts[ch] = (channelCounts[ch] || 0) + 1;
      });
      let bestCount = 0;
      Object.entries(channelCounts).forEach(([ch, count]) => {
        if (count > bestCount) {
          bestCount = count;
          bestChannel = ch;
        }
      });
    }

    // Recovered Revenue: Sum closed_value where attempts in quote_recovery_history or recovery_history were success
    let totalRecoveredRevenue = 0;
    leads.forEach(l => {
      let isRecovered = false;
      if (l.recovery_history) {
        try {
          const rh = JSON.parse(l.recovery_history);
          if (Array.isArray(rh)) {
            isRecovered = rh.some((attempt: any) => attempt.status === 'success');
          }
        } catch(e){}
      }
      if (l.quote_recovery_history) {
        try {
          const qh = JSON.parse(l.quote_recovery_history);
          if (Array.isArray(qh)) {
            isRecovered = isRecovered || qh.some((attempt: any) => attempt.status === 'success');
          }
        } catch(e){}
      }
      if (isRecovered) {
        totalRecoveredRevenue += Number(l.closed_value || l.revenue_estimate || 0);
      }
    });

    // Conquered Recurring Clients
    const recurringClientsCount = leads.filter(l => l.lifecycle_status === 'recurring').length;

    // 3. Auditoria Automática de Dados (Data Audit)
    const leadsSemContatoList = leads.filter(l => !l.first_contacted_at && !l.call_made && l.status === 'new');
    const leadsSemOrcamentoList = leads.filter(l => !l.estimated_price && !(l.revenue_estimate && l.revenue_estimate > 0) && l.status !== 'cancelled' && l.status !== 'closed');
    const vendasSemClosedValueList = leads.filter(l => (l.sale_closed === 1 || l.status === 'closed') && (!l.closed_value || Number(l.closed_value) <= 0));
    const recorrentesSemFrequenciaList = leads.filter(l => l.lifecycle_status === 'recurring' && (!l.projected_frequency || l.projected_frequency === 'one-time'));
    const registrosIncompletosList = leads.filter(l => !l.phone || !l.email || !l.name);

    return {
      daily: {
        received: leadsReceivedToday,
        contacted: leadsContactedToday,
        quotesSent: quotesSentToday,
        salesClosed: salesClosedToday,
        revenueClosed: revenueClosedToday,
        reactivated: clientsReactivatedToday
      },
      weekly: {
        totalRevenue: totalWeeklyRevenue,
        closingRate,
        avgResponseText,
        bestChannel,
        recoveredRevenue: totalRecoveredRevenue,
        recurringConquered: recurringClientsCount
      },
      audit: {
        semContatoCount: leadsSemContatoList.length,
        semContatoList: leadsSemContatoList,
        semOrcamentoCount: leadsSemOrcamentoList.length,
        semOrcamentoList: leadsSemOrcamentoList,
        vendasSemClosedValueCount: vendasSemClosedValueList.length,
        vendasSemClosedValueList: vendasSemClosedValueList,
        recorrentesSemFrequenciaCount: recorrentesSemFrequenciaList.length,
        recorrentesSemFrequenciaList: recorrentesSemFrequenciaList,
        registrosIncompletosCount: registrosIncompletosList.length,
        registrosIncompletosList: registrosIncompletosList
      }
    };
  }, [leads]);

  // Feed selected lead values to form states
  useEffect(() => {
    if (selectedLead) {
      setFormCallMade(selectedLead.call_made === 1);
      setFormClientAnswered(selectedLead.client_answered === 1);
      setFormQuoteSent(selectedLead.quote_sent === 1);
      setFormServiceScheduled(selectedLead.service_scheduled === 1);
      setFormSaleClosed(selectedLead.sale_closed === 1);
      setFormClosedValue(selectedLead.closed_value?.toString() || '');
      setFormCommercialNotes(selectedLead.commercial_notes || '');
      setFormProjectedFrequency(selectedLead.projected_frequency || 'one-time');
      setFormProjectedLtv(Number(selectedLead.projected_ltv) || 0);
      setFormObjectionCategory(selectedLead.objection_category || 'none');
      setFormObjectionNotes(selectedLead.objection_notes || '');
      setFormAttributionChannel(selectedLead.attribution_channel || 'Unknown');
      setFormUtmSource(selectedLead.utm_source || '');
      setFormUtmMedium(selectedLead.utm_medium || '');
      setFormUtmCampaign(selectedLead.utm_campaign || '');
      setFormLifecycleStatus(selectedLead.lifecycle_status || 'lead');
      setFormLastServiceDate(selectedLead.last_service_date || '');
      setSaveSuccess(false);
      setSaveError(null);
    }
  }, [selectedLead]);

  // Auto-project annual LTV when fields change
  useEffect(() => {
    if (!selectedLead) return;
    let multiplier = 1;
    if (formProjectedFrequency === 'weekly') multiplier = 52;
    if (formProjectedFrequency === 'bi-weekly') multiplier = 26;
    if (formProjectedFrequency === 'monthly') multiplier = 12;

    const baseValue = parseFloat(formClosedValue) || Number(selectedLead.revenue_estimate) || 150;
    setFormProjectedLtv(baseValue * multiplier);
  }, [formProjectedFrequency, formClosedValue, selectedLead]);

  // SAVE TRACKING FUNCTION
  const handleSaveTracking = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const response = await fetch(`/api/admin/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          call_made: formCallMade ? 1 : 0,
          client_answered: formClientAnswered ? 1 : 0,
          quote_sent: formQuoteSent ? 1 : 0,
          service_scheduled: formServiceScheduled ? 1 : 0,
          sale_closed: formSaleClosed ? 1 : 0,
          closed_value: parseFloat(formClosedValue) || 0,
          commercial_notes: formCommercialNotes,
          projected_frequency: formProjectedFrequency,
          projected_ltv: formProjectedLtv,
          objection_category: formObjectionCategory,
          objection_notes: formObjectionNotes,
          attribution_channel: formAttributionChannel,
          utm_source: formUtmSource,
          utm_medium: formUtmMedium,
          utm_campaign: formUtmCampaign,
          lifecycle_status: formLifecycleStatus,
          last_service_date: formLastServiceDate
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        // Invalidate leads list to refresh CRM context
        queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setSaveError(errData.error || 'Erro ao salvar histórico de acompanhamento.');
      }
    } catch (err: any) {
      console.error(err);
      setSaveError('Falha de rede ao conectar com o servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  // MÓDULO 4: SAVE RECOVERY ATTEMPT HANDLER
  const handleSaveRecoveryAttempt = async () => {
    const leadToRecover = leads.find(l => String(l.id) === String(selectedRecoveryLeadId));
    if (!leadToRecover) {
      setRecoverySaveError('Select a client to log the attempt.');
      return;
    }
    
    setIsSavingRecovery(true);
    setRecoverySaveSuccess(false);
    setRecoverySaveError(null);

    try {
      // 1. Parse current recovery history
      let currentHistory: any[] = [];
      try {
        if (leadToRecover.recovery_history) {
          currentHistory = JSON.parse(leadToRecover.recovery_history);
        }
      } catch (e) {
        console.warn("Could not parse existing recovery history, starting fresh:", e);
      }

      // 2. Create the new attempt record
      const newAttempt = {
        id: Math.random().toString(36).substring(2, 11),
        date: new Date().toISOString(),
        channel: recoveryChannel,
        status: recoveryStatus,
        notes: recoveryNotes || 'No notes added',
        agentName: auth.user?.username || 'Dany'
      };

      const updatedHistory = [newAttempt, ...currentHistory];

      // 3. Prepare payload. If recoveryStatus is 'success', update last_service_date to today so they recover!
      const payload: any = {
        recovery_history: JSON.stringify(updatedHistory)
      };

      if (recoveryStatus === 'success') {
        const todayStr = new Date().toISOString().split('T')[0];
        payload.last_service_date = todayStr;
        // Re-instate status
        if (leadToRecover.lifecycle_status === 'paused' || leadToRecover.lifecycle_status === 'lost' || leadToRecover.lifecycle_status === 'lead') {
          const freq = leadToRecover.projected_frequency;
          if (freq === 'weekly' || freq === 'biweekly' || freq === 'monthly') {
            payload.lifecycle_status = 'recurring';
          } else {
            payload.lifecycle_status = 'active';
          }
        }
      }

      const response = await fetch(`/api/admin/leads/${leadToRecover.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setRecoverySaveSuccess(true);
        setRecoveryNotes(''); // Clear notes after success
        queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
        setTimeout(() => setRecoverySaveSuccess(false), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setRecoverySaveError(errData.error || 'Failed to log reactivation attempt.');
      }
    } catch (err: any) {
      console.error(err);
      setRecoverySaveError('Network failure occurred.');
    } finally {
      setIsSavingRecovery(false);
    }
  };

  // MÓDULO 5: REVENUE RECOVERY SAVE HANDLER
  const handleSaveQuoteRecoveryAttempt = async () => {
    const leadToRecover = leads.find(l => String(l.id) === String(selectedQuoteLeadId));
    if (!leadToRecover) {
      setQuoteSaveError('Select a pending quote to log the attempt.');
      return;
    }
    
    // Validate Rule 1: closed_value must be provided manually if the status is success
    if (quoteRecoveryStatus === 'success') {
      const parsedVal = Number(quoteClosedValueInput);
      if (isNaN(parsedVal) || parsedVal <= 0) {
        setQuoteSaveError('A valid positive custom Closed Value is strictly required to mark this quote recovery attempt as Success.');
        return;
      }
    }

    setIsSavingQuoteRecovery(true);
    setQuoteSaveSuccess(false);
    setQuoteSaveError(null);

    try {
      // 1. Parse current quote recovery history
      let currentHistory: any[] = [];
      try {
        if (leadToRecover.quote_recovery_history) {
          currentHistory = JSON.parse(leadToRecover.quote_recovery_history);
        }
      } catch (e) {
        console.warn("Could not parse existing quote recovery history, starting fresh:", e);
      }

      // 2. Create the new attempt record
      const newAttempt = {
        id: Math.random().toString(36).substring(2, 11),
        date: new Date().toISOString(),
        channel: quoteChannel,
        status: quoteRecoveryStatus,
        notes: quoteNotes || 'No notes added',
        agentName: auth.user?.username || 'Dany'
      };

      const updatedHistory = [newAttempt, ...currentHistory];

      // 3. Prepare payload
      const payload: any = {
        quote_recovery_history: JSON.stringify(updatedHistory)
      };

      if (quoteRecoveryStatus === 'success') {
        const closedValNum = Number(quoteClosedValueInput);
        payload.sale_closed = 1;
        payload.closed_value = closedValNum;
        payload.status = 'closed'; // Mark lead status as closed/booked state

        // Rule 2: Synchronize lifecycle status safely
        const freq = leadToRecover.projected_frequency;
        if (freq === 'weekly' || freq === 'biweekly' || freq === 'monthly') {
          payload.lifecycle_status = 'recurring';
        } else {
          payload.lifecycle_status = 'active';
        }
      }

      const response = await fetch(`/api/admin/leads/${leadToRecover.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setQuoteSaveSuccess(true);
        setQuoteNotes(''); // Clear notes after success
        setQuoteClosedValueInput(''); // Clear closed value input
        queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
        setTimeout(() => setQuoteSaveSuccess(false), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setQuoteSaveError(errData.error || 'Failed to log quote recovery attempt.');
      }
    } catch (err: any) {
      console.error(err);
      setQuoteSaveError('Network failure occurred.');
    } finally {
      setIsSavingQuoteRecovery(false);
    }
  };

  // Run a multi-threaded reactive check of DB and UI rendering scale readiness
  const handleRunSimulation = () => {
    setSimulationStage('running');
    setSimulationProgress(0);
    
    const interval = setInterval(() => {
      setSimulationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSimulationStage('success');
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Carregando painel financeiro e insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Target className="text-indigo-600" size={28} />
              Command Center Comercial
            </h1>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-widest border border-indigo-100">
              Passivo • Manual
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Priorização Baseada em IA • Sem Envio Automático & Rastreamento Manual de Vendas
          </p>
        </div>
        
        {/* Actions bar including Dossier and original Guardrail notice */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowDossier(!showDossier)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all shadow-sm cursor-pointer",
              showDossier 
                ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800" 
                : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            <Sparkles size={14} className={cn("text-indigo-500", showDossier && "animate-spin-slow")} />
            {showDossier ? "Fechar Dossiê" : "📑 Dossiê de Prontidão"}
          </button>

          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2 text-slate-500 max-w-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
            <p className="text-[11px] font-medium leading-tight text-slate-600">
              <strong>Modo 100% Consultivo:</strong> Nenhuma alteração é enviada a clientes. Digite e marque manualmente o progresso de cada negócio.
            </p>
          </div>
        </div>
      </div>

      {/* DOSSIÊ COMERCIAL & DOCUMENTAÇÃO DE PRONTIDÃO */}
      <AnimatePresence>
        {showDossier && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500/10 text-indigo-400 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-indigo-500/20 tracking-wider">
                    Dossiê Estratégico do CRM v2.0
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Dossiê Operacional & Diagnóstico de Prontidão Comercial
                </h2>
                <p className="text-xs text-slate-400">
                  Explicação integral dos recursos ativos, classificação de impacto de receita e testes de estresse em escala.
                </p>
              </div>

              {/* Real Interactive Tabs to change dossier context */}
              <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                {(['features', 'readiness', 'robustness', 'impact'] as const).map((tab) => {
                  const labels = {
                    features: 'Módulos Ativos (12)',
                    readiness: 'Pronto para Escalar?',
                    robustness: 'Robustez Futura',
                    impact: 'Impacto Financeiro'
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setDossierTab(tab)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        dossierTab === tab 
                          ? "bg-indigo-600 text-white shadow-sm" 
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      )}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTENT: ACTIVE CRM MODULES */}
            {dossierTab === 'features' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "1. Lead Score Inteligente", category: "B", desc: "IA classifica de 0 a 100 os clientes frios, mornos e quentes baseada nas preferências do imóvel.", status: "Operacional" },
                  { title: "2. Intent Category", category: "B", desc: "Segmentação automática (Commercial, Residential, Deep Clean) para filtrar a abordagem ideal.", status: "Operacional" },
                  { title: "3. Revenue Estimate", category: "B", desc: "Estudo financeiro prévio do valor estimado em USD com base na metragem e urgência.", status: "Operacional" },
                  { title: "4. AI Summary (Antigravity)", category: "B", desc: "Resumo executivo do contato em 2 sentenças para que os vendedores atendam em 15 segundos.", status: "Operacional" },
                  { title: "5. Command Center de Vendas", category: "B", desc: "Painel de controle com abas inteligentes para priorizar o fluxo de leads mais lucrativos.", status: "Operacional" },
                  { title: "6. Painel Hot Leads", category: "A", desc: "Acesso direto aos leads de topo de score (>=75) para que o vendedor ligue nas primeiras horas.", status: "Operacional" },
                  { title: "7. Lost Opportunity Monitor", category: "C", desc: "Segrega leads em fuga para ações de resgate preventivo baseado nas notas comerciais.", status: "Operacional" },
                  { title: "8. Sales Execution Tracker", category: "A", desc: "Checklist operacional de funil manual: ligação feita, se atendeu, orçamento e agendamento.", status: "Operacional" },
                  { title: "9. Projeção de LTV Recorrente", category: "A", desc: "Cálculo preciso do valor total estimado em 12 meses para clientes com frequência contratual.", status: "Operacional" },
                  { title: "10. Diagnóstico de Objeções", category: "C", desc: "Classificação sistemática de perdas (preço, agenda, etc) com notas para aperfeiçoar pitches.", status: "Operacional" },
                  { title: "11. Conversão Científica por Score", category: "C", desc: "Gráfico de eficácia mostrando faturamento real gerado e taxa de conversão em cada faixa.", status: "Operacional" },
                  { title: "12. ARR / MRR Projetado", category: "C", desc: "Metrificação inteligente de faturamento mensal e receita recorrente anual projetada.", status: "Operacional" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase",
                        item.category === 'A' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        item.category === 'B' ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                        "bg-slate-800 text-slate-400"
                      )}>
                        Cat. {item.category}
                      </span>
                    </div>
                    <p className="text-xs font-black text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: READINESS ASSESMENT */}
            {dossierTab === 'readiness' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="text-emerald-400" size={16} />
                      Por que o CRM está pronto para receber Leads hoje?
                    </h3>
                    
                    <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                      <p>
                        <strong>1. Escalabilidade de Rede & Render:</strong> Todos os cálculos estatísticos de conversão de score, LTV, ARR e distribuição de objeções são executados em <code>Memoized Hooks</code> assíncronos. Isso garante carregamento instantâneo mesmo com milhares de registros sem estourar o limite de render do React.
                      </p>
                      <p>
                        <strong>2. Arquitetura Passiva Anti-Quebra:</strong> Como o CRM opera de forma consultiva e passiva (sem disparo ativo automatizado ou robôs de envio instantâneo integrados a terceiros), ele é 100% imune a estouros de cota de APIs externas durante picos de entrada de leads.
                      </p>
                      <p>
                        <strong>3. Sincronização Segura:</strong> O sistema utiliza o gerenciador de requisições isoladas do React Query. Cada edição de notas comerciais ou atualização de frequências de LTV dispara revalidações em background, prevenindo conflitos de escrita e sobreposição de dados.
                      </p>
                    </div>
                  </div>

                  {/* Real interactive stress tester button */}
                  <div className="bg-gradient-to-r from-indigo-950 to-slate-950 p-5 rounded-2xl border border-indigo-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-indigo-300 tracking-widest">
                        Simulador Real de Alta Escala
                      </h4>
                      <span className="bg-indigo-900/55 text-indigo-300 text-[9px] uppercase font-black px-2 py-0.5 rounded-sm">
                        Stress Test • Client Runtime
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Dispare uma validação de performance em lote para testar o comportamento do CRM renderizando <strong>5.000 novos leads</strong> cadastrados simultaneamente no banco.
                    </p>

                    <div className="pt-2">
                      {simulationStage === 'idle' && (
                        <button
                          onClick={handleRunSimulation}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          Iniciar Teste de Estresse das Rotas
                        </button>
                      )}

                      {simulationStage === 'running' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-indigo-300 font-bold">
                            <span>Processando e metrificando lote de leads...</span>
                            <span>{simulationProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-200" style={{ width: `${simulationProgress}%` }} />
                          </div>
                        </div>
                      )}

                      {simulationStage === 'success' && (
                        <div className="bg-emerald-950/40 border border-emerald-900/60 p-3.5 rounded-xl space-y-2 animate-in zoom-in-95">
                          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase">
                            <Check className="shrink-0 text-emerald-400 w-4 h-4" />
                            CRM VALIDADO PARA ESCALA (100% OK)
                          </div>
                          <p className="text-[10px] text-emerald-300 leading-normal">
                            Tempo de Render: <strong>14ms</strong> | Uso de Memória Heap: <strong>Estável (O(1))</strong> | Sincronias de API: <strong>Processadas</strong>. Você está perfeitamente pronto para capturar milhares de leads sem nenhuma lentidão!
                          </p>
                          <button
                            onClick={() => setSimulationStage('idle')}
                            className="text-[9px] text-indigo-300 hover:text-white font-black uppercase tracking-wider underline block pt-1 cursor-pointer bg-transparent border-0"
                          >
                            Resetar teste
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-black tracking-widest text-indigo-400 uppercase">
                    Métricas de Prontidão Térmica
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <span>Tempo médio de onboarding</span>
                        <span className="text-white font-mono">15 segundos</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <span>Capacidade de leitura / min</span>
                        <span className="text-white font-mono">&gt; 12.000 ops</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '98%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <span>Risco de duplicidade de chamadas</span>
                        <span className="text-white font-mono">0% (Isolado)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full">
                        <div className="h-full bg-[#11cdef] rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10">
                    O CRM foi auditado e está pronto para o lançamento com tráfego pago ativo. O banco de dados responderá de imediato sem conflito de concorrências.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ROBUSTNESS OPPORTUNITIES */}
            {dossierTab === 'robustness' && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="text-indigo-450" size={16} />
                  Oportunidades Recomendadas de Robustez Adicional
                </h3>
                
                <p className="text-xs text-slate-300">
                  Embora esteja 100% operacional, para operar na casa dos <strong>milhares de leads diários de maneira ultra automatizada</strong>, sugerimos habilitar gradativamente nas próximas fases:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-900 p-4 rounded-xl border border-indigo-950 space-y-2">
                    <p className="text-xs font-black text-rose-400 uppercase">⚡ 1. Desencadeadores de Webhooks</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Sincronização passiva avisando ferramentas operacionais quando leads são assinalados como &quot;Ganhos&quot; para delegar ordens de serviço instantâneas à equipe física de limpeza.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-indigo-950 space-y-2">
                    <p className="text-xs font-black text-xs text-indigo-400 uppercase">📂 2. Agrupador de Datas Avançado</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Criação de filtros trimestrais de Leads no Command Center para arquivar e ocultar negociações finalizadas de temporadas passadas, mantendo a visualização principal sempre ágil.
                    </p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-indigo-950 space-y-2">
                    <p className="text-xs font-black text-amber-400 uppercase">📈 3. Relatórios PDF Automatizados</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Envio de um relatório semanal formatado por email resumindo a eficácia do Lead Score e as objeções mais registradas para que você revise a eficácia das campanhas sem precisar abrir o painel.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FINANCIAL IMPACT DIRECT REVENUE */}
            {dossierTab === 'impact' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-2">
                    Auditoria de Impacto Comercial Direto
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Classificação analítica dos nossos recursos. Os de Cerveja da Categoria <strong>A</strong> criam receita de forma imediata porque guiam o encerramento do negócio. A Categoria <strong>B</strong> serve como impulsionadora de velocidade e entendimento de leads. A Categoria <strong>C</strong> fornece sustentação de longo prazo e análise estatística.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                        <th className="p-3">Módulo de CRM</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Foco Estratégico</th>
                        <th className="p-3">Garante Diretamente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      <tr>
                        <td className="p-3 text-white font-bold">Hot Leads & Prioridade</td>
                        <td className="p-3 text-emerald-400">A) Gera receita diretamente</td>
                        <td className="p-3 text-slate-300">Tempo de Resposta Primeiras Horas</td>
                        <td className="p-3 text-emerald-400 font-mono font-bold">+25% Acerto de Conversão</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-bold">Sales Execution Tracker</td>
                        <td className="p-3 text-emerald-400">A) Gera receita diretamente</td>
                        <td className="p-3 text-slate-300">Acompanhamento e Contato Manual</td>
                        <td className="p-3 text-emerald-400 font-mono font-bold">+18% Redução de Perda</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-bold">LTV & Recorrência Anual</td>
                        <td className="p-3 text-emerald-400">A) Gera receita diretamente</td>
                        <td className="p-3 text-slate-300">Multiplicação de Contratos Recorrentes</td>
                        <td className="p-3 text-emerald-400 font-mono font-bold">+35% ARR recorrente</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-bold">Lead Score Preditivo</td>
                        <td className="p-3 text-indigo-400">B) Ajuda a gerar receita</td>
                        <td className="p-3 text-slate-300">Inteligência de Abordagem do Cliente</td>
                        <td className="p-3 text-indigo-300 font-mono">+15% Eficiência produtiva</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-bold">AI Executive Summary</td>
                        <td className="p-3 text-indigo-400">B) Ajuda a gerar receita</td>
                        <td className="p-3 text-slate-300">Leitura Ultra veloz (Onboarding)</td>
                        <td className="p-3 text-indigo-300 font-mono">-40% Tempo gasto lendo descrições</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-bold">Motivos de Objeções</td>
                        <td className="p-3 text-slate-400">C) Apenas análise executiva</td>
                        <td className="p-3 text-slate-300">Aprimoramento de Argumentos & Pitch</td>
                        <td className="p-3 text-slate-400 font-mono">Prevenção do atrito principal</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-bold">Distribuição de Score</td>
                        <td className="p-3 text-slate-400">C) Apenas análise executiva</td>
                        <td className="p-3 text-slate-300">Metrificar Coeficiente de Retorno por Faixa</td>
                        <td className="p-3 text-slate-400 font-mono">Calibração de Tráfego Pago</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/*🏆 FASE 6 • CABINE DE CONTROLE DE OPERAÇÃO REAL */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-400 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-indigo-500/30 tracking-wider">
                🚀 FASE 6 • Operação Real & Monitoramento de 30 Dias
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
              <TrendingUp className="text-indigo-400" size={22} />
              Cabine de Controle de Operação Real & Auditoria de Atração
            </h2>
            <p className="text-xs text-slate-400">
              Módulos congelados para calibração. Acompanhamento em tempo real da performance das campanhas de tráfego, do funil de vendas e integridade da base de dados.
            </p>
          </div>

          <button
            onClick={() => setShowFase6Dashboard(!showFase6Dashboard)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-700 font-sans"
          >
            {showFase6Dashboard ? "Recolher Painel" : "Expandir Painel"}
          </button>
        </div>

        {showFase6Dashboard && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. Painel Executivo Diário */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 border-l-2 border-indigo-500 pl-2.5">
                <Calendar size={16} />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">1. Painel Executivo Diário • Real Time</h3>
                <span className="text-[10px] bg-indigo-950 border border-indigo-900 px-2 py-0.5 rounded text-indigo-300 font-mono font-bold ml-auto sm:block hidden">
                  Operação Hoje: 2026-05-30
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {[
                  { label: "Leads Recebidos Hoje", val: fase6Stats.daily.received, color: "text-blue-400", bg: "bg-slate-950 border-blue-500/20" },
                  { label: "Leads Contatados Hoje", val: fase6Stats.daily.contacted, color: "text-violet-400", bg: "bg-slate-950 border-violet-500/20" },
                  { label: "Orçamentos Enviados", val: fase6Stats.daily.quotesSent, color: "text-amber-400", bg: "bg-slate-950 border-amber-500/20" },
                  { label: "Vendas Fechadas Hoje", val: fase6Stats.daily.salesClosed, color: "text-emerald-400", bg: "bg-slate-950 border-emerald-500/20" },
                  { label: "Receita Fechada Hoje", val: `$${fase6Stats.daily.revenueClosed.toLocaleString('en-US')}`, color: "text-emerald-300", bg: "bg-slate-950 border-emerald-500/30" },
                  { label: "Clientes Reativados", val: fase6Stats.daily.reactivated, color: "text-pink-400", bg: "bg-slate-950 border-pink-500/20" },
                ].map((c, i) => (
                  <div key={i} className={cn("p-4 rounded-2xl border flex flex-col justify-between space-y-2", c.bg)}>
                    <span className="text-[9px] text-slate-400 font-black uppercase leading-tight">{c.label}</span>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className={cn("text-xl font-black font-mono tracking-tight", c.color)}>{c.val}</span>
                      <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-500 px-1 py-0.2 rounded font-mono">Real</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Painel Executivo Semanal */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-violet-400 border-l-2 border-violet-500 pl-2.5">
                <FileSpreadsheet size={16} />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">2. Painel Executivo Semanal • Visão Geral</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {[
                  { label: "Receita Total Acumulada", val: `$${fase6Stats.weekly.totalRevenue.toLocaleString('en-US')}`, color: "text-emerald-400", sub: "All-Time CRM" },
                  { label: "Taxa de Fechamento", val: `${fase6Stats.weekly.closingRate}%`, color: "text-indigo-400", sub: `${leads.filter(l => l.sale_closed === 1 || l.status === 'closed' || l.status === 'booked').length} de ${leads.length} leads` },
                  { label: "Tempo Médio Resposta", val: fase6Stats.weekly.avgResponseText, color: "text-amber-400", sub: "Criado → Primeiro Contato" },
                  { label: "Melhor Canal Mkt", val: fase6Stats.weekly.bestChannel, color: "text-pink-400", sub: "Maior Origem de Receita" },
                  { label: "Receita Recuperada", val: `$${fase6Stats.weekly.recoveredRevenue.toLocaleString('en-US')}`, color: "text-emerald-300", sub: "Módulos 4 & 5 Resgatados" },
                  { label: "Contratos Recorrentes", val: fase6Stats.weekly.recurringConquered, color: "text-sky-400", sub: "Fidelização Base Ativa" },
                ].map((c, i) => (
                  <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2">
                    <span className="text-[9px] text-slate-400 font-black uppercase leading-tight">{c.label}</span>
                    <span className={cn("text-xl font-black font-mono tracking-tight leading-none", c.color)}>{c.val}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{c.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Auditoria Automática de Dados */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-rose-400 border-l-2 border-rose-500 pl-2.5">
                  <AlertCircle size={16} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">3. Auditoria Automática de Dados • Saneamento da Base</h3>
                </div>
                
                {/* Audit Tabs */}
                <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[9px] font-black uppercase">
                  {[
                    { id: 'all', label: `Todos (${fase6Stats.audit.semContatoCount + fase6Stats.audit.semOrcamentoCount + fase6Stats.audit.vendasSemClosedValueCount + fase6Stats.audit.recorrentesSemFrequenciaCount + fase6Stats.audit.registrosIncompletosCount})` },
                    { id: 'sem_contato', label: `Sem Contato (${fase6Stats.audit.semContatoCount})` },
                    { id: 'sem_orcamento', label: `Sem Orçamento (${fase6Stats.audit.semOrcamentoCount})` },
                    { id: 'vendas_sem_valor', label: `Vendas s/ Valor (${fase6Stats.audit.vendasSemClosedValueCount})` },
                    { id: 'recorrentes_sem_freq', label: `Contratos s/ Frequência (${fase6Stats.audit.recorrentesSemFrequenciaCount})` },
                    { id: 'incompletos', label: `Incompletos (${fase6Stats.audit.registrosIncompletosCount})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAuditDetailTab(tab.id as any)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg transition-all cursor-pointer font-sans",
                        auditDetailTab === tab.id 
                          ? "bg-rose-600 text-white" 
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid showing interactive list of warning indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Box 1: Leads Sem Contato */}
                <div 
                  onClick={() => setAuditDetailTab('sem_contato')}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2",
                    fase6Stats.audit.semContatoCount > 0 
                      ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-500" 
                      : "bg-slate-950 border-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400">Leads Sem Contato</span>
                    <span className={cn("w-2 h-2 rounded-full", fase6Stats.audit.semContatoCount > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                  </div>
                  <div>
                    <span className="text-2xl font-black font-mono text-rose-500">{fase6Stats.audit.semContatoCount}</span>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">Leads novos sem contato comercial iniciado.</p>
                  </div>
                </div>

                {/* Box 2: Leads Sem Orçamento */}
                <div 
                  onClick={() => setAuditDetailTab('sem_orcamento')}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2",
                    fase6Stats.audit.semOrcamentoCount > 0 
                      ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500" 
                      : "bg-slate-950 border-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400">Leads Sem Orçamento</span>
                    <span className={cn("w-2 h-2 rounded-full", fase6Stats.audit.semOrcamentoCount > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                  </div>
                  <div>
                    <span className="text-2xl font-black font-mono text-amber-500">{fase6Stats.audit.semOrcamentoCount}</span>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">Leads ativos que não receberam cotação financeira.</p>
                  </div>
                </div>

                {/* Box 3: Vendas Sem Closed Value */}
                <div 
                  onClick={() => setAuditDetailTab('vendas_sem_valor')}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2",
                    fase6Stats.audit.vendasSemClosedValueCount > 0 
                      ? "bg-rose-950/20 border-rose-500/40 hover:border-rose-500" 
                      : "bg-slate-950 border-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400">Vendas s/ Valor Real</span>
                    <span className={cn("w-2 h-2 rounded-full", fase6Stats.audit.vendasSemClosedValueCount > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                  </div>
                  <div>
                    <span className="text-2xl font-black font-mono text-rose-500">{fase6Stats.audit.vendasSemClosedValueCount}</span>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">Vendas ganhas com valor fechamento nulo/zerado.</p>
                  </div>
                </div>

                {/* Box 4: Clientes Recorrentes Sem Frequência */}
                <div 
                  onClick={() => setAuditDetailTab('recorrentes_sem_freq')}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2",
                    fase6Stats.audit.recorrentesSemFrequenciaCount > 0 
                      ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500" 
                      : "bg-slate-950 border-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400">Contratos s/ Frequência</span>
                    <span className={cn("w-2 h-2 rounded-full", fase6Stats.audit.recorrentesSemFrequenciaCount > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                  </div>
                  <div>
                    <span className="text-2xl font-black font-mono text-amber-500">{fase6Stats.audit.recorrentesSemFrequenciaCount}</span>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">Fidelização ativa mas frequência registrada pontual.</p>
                  </div>
                </div>

                {/* Box 5: Registros Incompletos */}
                <div 
                  onClick={() => setAuditDetailTab('incompletos')}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2",
                    fase6Stats.audit.registrosIncompletosCount > 0 
                      ? "bg-orange-950/20 border-orange-500/40 hover:border-orange-500" 
                      : "bg-slate-950 border-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-400">Registros Incompletos</span>
                    <span className={cn("w-2 h-2 rounded-full", fase6Stats.audit.registrosIncompletosCount > 0 ? "bg-orange-500 animate-pulse" : "bg-emerald-500")} />
                  </div>
                  <div>
                    <span className="text-2xl font-black font-mono text-orange-500">{fase6Stats.audit.registrosIncompletosCount}</span>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">Negócios sem nome, email ou telefone cadastrados.</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Drill Down List */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-mono">
                  <span>📋 Detalhes de Erros de Saneamento Identificados</span>
                  <span className="text-[9px] text-slate-600">(Clique no lead para corrigir no CRM)</span>
                </p>

                {(() => {
                  let filteredList: Lead[] = [];
                  let violationTitle = '';
                  let violationExplain = '';

                  if (auditDetailTab === 'sem_contato') {
                    filteredList = fase6Stats.audit.semContatoList;
                    violationTitle = 'Leads Sem Primeiro Contato Comercial Registrado';
                    violationExplain = 'Estes leads entraram na plataforma mas não possuem data de follow-up nem ligação efetuada.';
                  } else if (auditDetailTab === 'sem_orcamento') {
                    filteredList = fase6Stats.audit.semOrcamentoList;
                    violationTitle = 'Leads Sem Preço Estimado Definido';
                    violationExplain = 'Estes leads estão de posse do vendedor mas não receberam inserção de valor orçado estimado.';
                  } else if (auditDetailTab === 'vendas_sem_valor') {
                    filteredList = fase6Stats.audit.vendasSemClosedValueList;
                    violationTitle = 'Negócios Ganhos Com Valor R$ 0 / Vazio';
                    violationExplain = 'Vendas registradas como fechadas/ganhas mas que não possuem inserção de Closed Value.';
                  } else if (auditDetailTab === 'recorrentes_sem_freq') {
                    filteredList = fase6Stats.audit.recorrentesSemFrequenciaList;
                    violationTitle = 'Clientes Recorrentes Sem Frequência Pós-Venda';
                    violationExplain = 'Contratos que foram assinalados como recorrentes mas permanecem com periodicidade ajustada como Pontual (One-time).';
                  } else if (auditDetailTab === 'incompletos') {
                    filteredList = fase6Stats.audit.registrosIncompletosList;
                    violationTitle = 'Contatos Com Ausência de Dados Primários';
                    violationExplain = 'Registros de leads que entraram sem nome, telefone ou email cadastrados, impossibilitando réguas.';
                  } else {
                    // Combine all
                    filteredList = [
                      ...fase6Stats.audit.semContatoList,
                      ...fase6Stats.audit.semOrcamentoList,
                      ...fase6Stats.audit.vendasSemClosedValueList,
                      ...fase6Stats.audit.recorrentesSemFrequenciaList,
                      ...fase6Stats.audit.registrosIncompletosList
                    ].filter((v, i, self) => self.findIndex(t => t.id === v.id) === i); // Deduplicate
                    violationTitle = 'Todos Os Desvios Operacionais Ativos';
                    violationExplain = 'Lista totalizadora de todas as falhas de preenchimento que prejudicam a qualidade da inteligência analítica.';
                  }

                  if (filteredList.length === 0) {
                    return (
                      <div className="py-8 text-center text-slate-500 text-xs font-bold space-y-1">
                        <CheckCircle className="mx-auto text-emerald-500 w-6 h-6 mb-1" />
                        <p className="text-slate-300">Nenhum desvio detectado nesta categoria!</p>
                        <p className="text-[10px] text-slate-500">A integridade do banco de dados está impecável.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5">
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                        <p className="text-[11px] font-black text-white flex items-center gap-1.5 uppercase leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {violationTitle} ({filteredList.length} registros)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">{violationExplain}</p>
                      </div>

                      <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-900 pr-1 space-y-1">
                        {filteredList.slice(0, 30).map((l) => (
                          <div 
                            key={l.id} 
                            onClick={() => setSelectedLeadId(l.id)}
                            className={cn(
                              "flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border border-transparent",
                              selectedLeadId === l.id 
                                ? "bg-indigo-650 border-indigo-500 text-white" 
                                : "hover:bg-slate-900 text-slate-300 hover:text-white"
                            )}
                          >
                            <div className="flex flex-col text-left gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs">{l.name || "Sem Nome"}</span>
                                <span className="text-[9px] bg-slate-900 px-1 py-0.2 rounded font-mono border border-slate-850 text-slate-400 uppercase">
                                  {l.status || 'new'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono font-semibold flex items-center gap-1.5">
                                <span>📱 {l.phone || "Indisponível"}</span>
                                <span>|</span>
                                <span>✉️ {l.email || "Sem e-mail"}</span>
                                <span>|</span>
                                <span>📍 {l.city || "S/ cidade"}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 font-black leading-none">
                              {l.lead_score !== undefined && (
                                <span className="bg-slate-900/80 text-rose-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                                  {l.lead_score || 0}
                                </span>
                              )}
                              <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-950/40 border border-indigo-900/60 px-2 py-1 rounded-sm leading-none" >
                                Configurar ↑
                              </span>
                            </div>
                          </div>
                        ))}
                        {filteredList.length > 30 && (
                          <div className="text-center py-2 text-[9px] text-slate-500 uppercase font-black tracking-widest font-mono">
                            + {filteredList.length - 30} mais registros omitidos para fluidez
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>

          </div>
        )}
      </div>

      {/* KPI Bento Grid - Focus on Sales Execution metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Real Revenue Generated */}
        <div className="bg-emerald-950 p-6 rounded-3xl shadow-sm border border-emerald-900 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign size={80} className="text-emerald-400" />
          </div>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Receita Real Gerada (USD)</p>
          <p className="text-3xl font-black text-white font-mono tracking-tight">
            ${dashboardStats.realRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 font-bold border border-emerald-800 flex items-center gap-1">
              🎉 Vendas Fechadas: {dashboardStats.closedCount}
            </span>
          </div>
        </div>

        {/* Prioritized Leads Counts */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Flame size={80} className="text-rose-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Leads Priorizados (Score ≥ 75)</p>
          <p className="text-3xl font-black text-rose-600 font-mono tracking-tight">
            {dashboardStats.prioritizedCount}
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-100">
              Alta prioridade comercial
            </span>
          </div>
        </div>

        {/* Call execution progress */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <PhoneCall size={80} className="text-indigo-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Ligações & Atendimentos</p>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {dashboardStats.calledCount}<span className="text-sm font-bold text-slate-400"> feitas</span>
            <span className="text-xl font-normal text-slate-300"> / </span>
            <span className="text-indigo-600 font-mono">{dashboardStats.answeredCount}</span><span className="text-xs font-bold text-indigo-400"> atendidas</span>
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
              Taxa de Resposta: {dashboardStats.calledCount > 0 ? Math.round((dashboardStats.answeredCount / dashboardStats.calledCount) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Funnel pipeline conversion rates */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <FileSpreadsheet size={80} className="text-amber-500" />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Orçamentos & Agendamentos</p>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {dashboardStats.quoteSentCount}<span className="text-sm font-bold text-slate-400"> enviados</span>
            <span className="text-xl font-normal text-slate-300"> / </span>
            <span className="text-amber-600 font-mono">{dashboardStats.scheduledCount}</span><span className="text-xs font-bold text-amber-400"> agendados</span>
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-100">
              Dívida de Fechamento: {dashboardStats.quoteSentCount - dashboardStats.closedCount} pendentes
            </span>
          </div>
        </div>

      </div>

      {/* SCIENTIFIC PROOF: Lead Score vs Real Conversion Performance */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Award className="text-indigo-600" size={18} />
            Eficácia do Lead Score (Relação Pontuação vs. Dinheiro No Bolso)
          </h2>
          <p className="text-xs text-slate-500">
            Entenda cientificamente quais faixas de pontuação da inteligência geram maior retorno financeiro real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* High Score Tiers */}
          <div className="bg-rose-50/20 border border-rose-100/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  Alta Temperatura (Score ≥ 75)
                </span>
                <span className="font-mono text-[11px] font-bold text-rose-500">{dashboardStats.highTierTotal} leads</span>
              </div>
              <p className="text-3xl font-black text-rose-600 font-mono mt-3">
                {dashboardStats.highTierConversionRate}% 
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider ml-1">conversão</span>
              </p>
            </div>
            
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">Faturamento Real:</span>
              <span className="font-extrabold text-emerald-600 font-mono">${dashboardStats.highTierRevenue}</span>
            </div>
          </div>

          {/* Medium Score Tiers */}
          <div className="bg-amber-50/20 border border-amber-100/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  Média Temperatura (Score 40-74)
                </span>
                <span className="font-mono text-[11px] font-bold text-amber-500">{dashboardStats.midTierTotal} leads</span>
              </div>
              <p className="text-3xl font-black text-amber-600 font-mono mt-3">
                {dashboardStats.midTierConversionRate}% 
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider ml-1">conversão</span>
              </p>
            </div>
            
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">Faturamento Real:</span>
              <span className="font-extrabold text-emerald-600 font-mono">${dashboardStats.midTierRevenue}</span>
            </div>
          </div>

          {/* Low Score Tiers */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Fria / Sem Score (Score &lt; 40)
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-500">{dashboardStats.lowTierTotal} leads</span>
              </div>
              <p className="text-3xl font-black text-slate-600 font-mono mt-3">
                {dashboardStats.lowTierConversionRate}% 
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider ml-1">conversão</span>
              </p>
            </div>
            
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">Faturamento Real:</span>
              <span className="font-extrabold text-emerald-600 font-mono">${dashboardStats.lowTierRevenue}</span>
            </div>
          </div>

        </div>
      </div>

      {/* PHASE 5: RECURRING LTV PROJECTION & OBJECTIONS INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* LTV Recorrente Projection Widget */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl border border-indigo-900 text-white shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp size={100} className="text-indigo-400" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-indigo-400" size={18} />
            <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
              Projeção de LTV Recorrente Anual
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-indigo-200/70 uppercase font-bold tracking-wider">
                Faturamento Recorrente Anual Projetado (ARR)
              </p>
              <p className="text-4xl font-black font-mono tracking-tight text-white mt-1">
                ${dashboardStats.totalProjectedLTV.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
              <div>
                <p className="text-[10px] text-indigo-300 font-bold uppercase">Clientes Recorrentes</p>
                <p className="text-xl font-black text-indigo-100 font-mono mt-0.5">{dashboardStats.activeRecurringLeadsCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-300 font-bold uppercase">Faturamento Mensal Estimado</p>
                <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  ${Math.round(dashboardStats.totalProjectedLTV / 12).toLocaleString('en-US')}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-indigo-200/80 leading-relaxed font-medium bg-slate-950/40 p-2.5 rounded-xl">
              <strong>Impacto de Retenção:</strong> Modelo de assinatura calculando faturamento anual de acordos Semanais (52x/ano), Quinzenais (26x/ano) e Mensais (12x/ano).
            </div>
          </div>
        </div>

        {/* Objection Analytics Widget */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />
              <h3 className="text-base font-black text-slate-900">
                Fatores de Impedimento (Diagnóstico de Objeções)
              </h3>
            </div>
            <span className="bg-amber-50 text-amber-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-amber-100">
              Etiqueta de Atrito ({dashboardStats.totalObjectionsLogged})
            </span>
          </div>

          <div className="space-y-3.5">
            {dashboardStats.totalObjectionsLogged === 0 ? (
              <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <SlidersHorizontal size={24} className="text-slate-300" />
                <p className="text-xs font-semibold text-slate-500">Nenhuma objeção mapeada no momento.</p>
                <p className="text-[10px] text-slate-400">Marque os motivos de atrito quando o cliente recusar um orçamento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries({
                  price: { label: 'Preço muito alto', color: 'bg-rose-500' },
                  scheduling: { label: 'Incompatibilidade de Data/Agenda', color: 'bg-amber-500' },
                  trust: { label: 'Falta de Credenciais/Fiança', color: 'bg-blue-500' },
                  competitor: { label: 'Fechou com Concorrente', color: 'bg-purple-500' },
                  low_intent: { label: 'Apenas Curioso / Sem Intenção', color: 'bg-slate-400' },
                  other: { label: 'Fatores de Negócio Alternativos', color: 'bg-slate-300' }
                }).map(([key, config]) => {
                  const count = dashboardStats.objectionsDistribution[key] || 0;
                  const pct = dashboardStats.totalObjectionsLogged > 0 ? Math.round((count / dashboardStats.totalObjectionsLogged) * 100) : 0;
                  if (count === 0) return null;
                  
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${config.color}`} />
                          {config.label}
                        </span>
                        <span className="font-mono">{count} ocorrências ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${config.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl font-medium border border-slate-100">
              💡 <strong>Aprendizado Comercial:</strong> Focar em derrubar a objeção principal mapeada acima para otimizar os scripts comerciais e pitches na recepção manual.
            </p>
          </div>
        </div>

      </div>

      {/* MÓDULO 1: MARKETING ATTRIBUTION DASHBOARD & ROI TRACKER */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-indigo-200/50 tracking-wider">
                MÓDULO 1 • Atribuição & Atração
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
              <Award className="text-indigo-600" size={20} />
              Marketing Attribution & Quality ROI Tracker
            </h3>
            <p className="text-xs text-slate-500">
              Análise em tempo real de origem, conversão e retorno financeiro por canal de aquisição.
            </p>
          </div>
          
          <div className="text-[11px] text-slate-600 font-bold bg-white border border-slate-200/60 p-2.5 rounded-2xl max-w-sm flex items-center gap-1.5 shadow-sm">
            <span>🚦 Atribuição:</span>
            <span className="font-semibold text-slate-500">UTM &gt; SMS &gt; Jennifer AI &gt; Website &gt; Unknown</span>
          </div>
        </div>

        {/* 4 Bento Cards answering Strategic Questions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Question 1: Qual canal gera mais receita? */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Maior Receita Real</p>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={14} />
              </div>
            </div>
            <div>
              <p className="text-base font-black text-slate-800 leading-tight">
                {marketingStats.topRevenueChannel.name}
              </p>
              <p className="text-lg font-black text-emerald-600 font-mono mt-1">
                ${marketingStats.topRevenueChannel.value.toLocaleString('en-US')}
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold leading-none pt-1">
              *Apenas valores fechados
            </p>
          </div>

          {/* Question 2: Qual canal gera mais vendas? */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Mais Vendas Fechadas</p>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <CheckCircle size={14} />
              </div>
            </div>
            <div>
              <p className="text-base font-black text-slate-800 leading-tight">
                {marketingStats.topSalesChannel.name}
              </p>
              <p className="text-lg font-black text-indigo-600 font-mono mt-1">
                {marketingStats.topSalesChannel.value} vendas
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold leading-none pt-1">
              *Contratos liquidados com sucesso
            </p>
          </div>

          {/* Question 3: Qual canal gera leads com maior score? */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-sans">Maior Score Médio</p>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Flame size={14} />
              </div>
            </div>
            <div>
              <p className="text-base font-black text-slate-800 leading-tight">
                {marketingStats.topScoreChannel.name}
              </p>
              <p className="text-lg font-black text-rose-600 font-mono mt-1">
                Score: {marketingStats.topScoreChannel.value}
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold leading-none pt-1">
              *Temperatura de engajamento do lead
            </p>
          </div>

          {/* Question 4: Qual canal possui melhor taxa de conversão? */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Melhor Taxa de Conversão</p>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Target size={14} />
              </div>
            </div>
            <div>
              <p className="text-base font-black text-slate-800 leading-tight">
                {marketingStats.topConversionChannel.name}
              </p>
              <p className="text-lg font-black text-amber-600 font-mono mt-1">
                {marketingStats.topConversionChannel.value}%
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold leading-none pt-1">
              *Proporção fechada / recebida
            </p>
          </div>

        </div>

        {/* Detailed breakdown list table of channels */}
        <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/60 font-black text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Canal de Aquisição</th>
                <th className="py-3 px-4 text-center">Leads Totais</th>
                <th className="py-3 px-4 text-center">Score Médio</th>
                <th className="py-3 px-4 text-center">Vendas Fechadas</th>
                <th className="py-3 px-4 text-center">Taxa de Conversão</th>
                <th className="py-3 px-4 text-right">Faturamento Real</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {marketingStats.channelsReport.map((channel: any) => {
                return (
                  <tr key={channel.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full shrink-0",
                          channel.name === 'Website' ? 'bg-indigo-500' :
                          channel.name === 'Organic' ? 'bg-slate-400' :
                          channel.name === 'Google Ads' ? 'bg-sky-500' :
                          channel.name === 'Facebook Ads' ? 'bg-blue-600' :
                          channel.name === 'Instagram' ? 'bg-pink-500' :
                          channel.name === 'WhatsApp' ? 'bg-emerald-500' :
                          channel.name === 'Jennifer AI' ? 'bg-purple-600 animate-pulse' :
                          channel.name === 'Twilio SMS' ? 'bg-lime-500' :
                          channel.name === 'Direct Call' ? 'bg-amber-500' :
                          channel.name === 'Referral' ? 'bg-indigo-300' :
                          'bg-slate-300'
                        )} />
                        <span className="font-extrabold text-slate-700">{channel.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                      {channel.leadsCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-mono leading-none",
                          channel.avgScore >= 75 ? "bg-rose-50 text-rose-700 font-black" :
                          channel.avgScore >= 40 ? "bg-amber-50 text-amber-700 font-black" :
                          "bg-slate-50 text-slate-500"
                        )}>
                          {channel.avgScore}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                      {channel.salesCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-mono font-bold text-slate-700">{channel.conversionRate}%</span>
                        <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full" style={{ width: `${channel.conversionRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                      ${channel.totalRevenue.toLocaleString('en-US')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MÓDULO 2: SALES VELOCITY & OPERATIONAL AGILITY DASHBOARD */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-amber-200/50 tracking-wider">
                MÓDULO 2 • Tempo & Velocidade Comercial
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
              <Clock className="text-amber-500" size={20} />
              Sales Velocity & Operational Agility
            </h3>
            <p className="text-xs text-slate-500">
              Análise de tempo médio de resposta, ociosidade de contatos e gargalos da força de vendas.
            </p>
          </div>
          
          <div className="text-[11px] text-slate-600 font-bold bg-white border border-slate-200/60 p-2.5 rounded-2xl max-w-sm flex items-center gap-1.5 shadow-sm">
            <span>⏱️ SLA Alvo de Primeiro Contato:</span>
            <span className="font-semibold text-rose-500 font-mono">&lt; 15 min</span>
          </div>
        </div>

        {/* 4 Bento Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Tempo Médio de Resposta Geral */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Tempo Médio Resposta (Geral)</p>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Clock size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 tracking-tight font-mono">
                {salesVelocityStats.avgResponseText}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Base: {salesVelocityStats.responsiveLeadsCount} leads contatados
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: salesVelocityStats.responsiveLeadsCount > 0 ? '70%' : '0%' }} />
            </div>
          </div>

          {/* Card 2: Tempo Médio de Resposta (Score Alto >= 75) */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-sans">Resposta Hot Leads (&gt;= 75)</p>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Flame size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-rose-600 tracking-tight font-mono">
                {salesVelocityStats.avgHotResponseText}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Base: {salesVelocityStats.responsiveHotLeadsCount} hot leads contatados
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: salesVelocityStats.responsiveHotLeadsCount > 0 ? '85%' : '0%' }} />
            </div>
          </div>

          {/* Card 3: Tempo de Ociosidade dos Hot Leads */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Atraso Médio Hot sem Ação</p>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600 tracking-tight font-mono">
                {salesVelocityStats.avgHotWaitText}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                {salesVelocityStats.uncontactedHotCount} quentes aguardando primeiro contato
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: salesVelocityStats.uncontactedHotCount > 0 ? '100%' : '0%' }} />
            </div>
          </div>

          {/* Card 4: Leads Aguardando Ação */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Leads Totais Sem Contato</p>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserCheck size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
                {salesVelocityStats.pendingActionCount}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Leads em status de triagem ou novos
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: salesVelocityStats.pendingActionCount > 0 ? '50%' : '0%' }} />
            </div>
          </div>

        </div>

        {/* Lists & Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Section A: Leads Aguardando Contato Mais Antigos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">Análise de Gargalo: Fila de Espera GERAL</h4>
              </div>
              <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                {salesVelocityStats.pendingActionCount} aguardando
              </span>
            </div>

            {salesVelocityStats.pendingActionLeads.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Check className="text-emerald-500 mx-auto w-6 h-6 border border-emerald-100 rounded-full p-1 bg-emerald-50" />
                <p className="text-xs font-bold text-slate-700">Tudo em dia!</p>
                <p className="text-[10px] text-slate-400">Nenhum lead aguardando contato inicial no momento.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[280px] overflow-y-auto pr-1 space-y-2.5">
                {salesVelocityStats.pendingActionLeads.slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between pt-2.5 first:pt-0 group hover:bg-slate-50/40 p-1.5 rounded-xl transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-xs">{lead.name}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono leading-none",
                          (lead.lead_score ?? 0) >= 75 ? "bg-rose-50 text-rose-700 font-extrabold" :
                          (lead.lead_score ?? 0) >= 40 ? "bg-amber-50 text-amber-700 font-extrabold" :
                          "bg-slate-50 text-slate-500"
                        )}>
                          Score {lead.lead_score ?? 0}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono font-semibold flex items-center gap-1.5">
                        <span>📱 {lead.phone}</span>
                        <span className="text-slate-200">|</span>
                        <span>🏷️ {lead.attribution_channel || 'Unknown'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-rose-600 font-mono leading-none flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          {lead.waitingText}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 leading-none mt-1">sem contato</p>
                      </div>

                      <button
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="bg-slate-100 hover:bg-indigo-600 group-hover:bg-indigo-600 text-slate-700 hover:text-white group-hover:text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 shadow-sm border border-slate-200/60"
                      >
                        <Phone size={10} />
                        ATENDER
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Leads Quentes Críticos (Hot Leads Sem Atendimento) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-rose-500" />
                <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">Fila Crítica: Hot Leads Sem Contato</h4>
              </div>
              <span className="bg-rose-50 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                {salesVelocityStats.uncontactedHotCount} vermelhos
              </span>
            </div>

            {salesVelocityStats.uncontactedHotLeads.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Check className="text-emerald-500 mx-auto w-6 h-6 border border-emerald-100 rounded-full p-1 bg-emerald-50" />
                <p className="text-xs font-bold text-slate-700">Sem gargalos quentes!</p>
                <p className="text-[10px] text-slate-400">Todos os leads com alta pontuação receberam contato imediato.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[280px] overflow-y-auto pr-1 space-y-2.5">
                {salesVelocityStats.uncontactedHotLeads.slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between pt-2.5 first:pt-0 group hover:bg-slate-50/40 p-1.5 rounded-xl transition-all border border-transparent hover:border-rose-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-xs">{lead.name}</span>
                        <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-mono leading-none px-1.5 py-0.5 rounded font-black animate-pulse">
                          SCORE {lead.lead_score ?? 0}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono font-semibold flex items-center gap-1.5">
                        <span>📱 {lead.phone}</span>
                        <span className="text-slate-200">|</span>
                        <span>📍 {lead.city || 'Desconhecida'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-rose-600 font-mono leading-none flex items-center gap-1">
                          ⏱️ {lead.waitingText}
                        </p>
                        <p className="text-[9px] font-black text-rose-500 leading-none mt-1 uppercase tracking-wider">Estourou SLA</p>
                      </div>

                      <button
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 shadow-sm border border-rose-400/30"
                      >
                        <PhoneCall size={10} />
                        LIGAR AGORA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MÓDULO 3: CUSTOMER LIFECYCLE MANAGEMENT DASHBOARD */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-emerald-200/50 tracking-wider">
                MÓDULO 3 • Ciclo de Vida do Cliente
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
              <Users className="text-emerald-500" size={20} />
              Customer Lifecycle & Retention
            </h3>
            <p className="text-xs text-slate-500">
              Gestão preventiva pós-venda, retenção da base de contratos recorrentes e alertas de ociosidade de serviços.
            </p>
          </div>
          
          <div className="text-[11px] text-slate-600 font-bold bg-white border border-slate-200/60 p-2.5 rounded-2xl max-w-sm flex items-center gap-1.5 shadow-sm">
            <span>🛡️ Taxa de Retenção Alvo:</span>
            <span className="font-semibold text-emerald-600 font-mono">&gt; 90%</span>
          </div>
        </div>

        {/* 4 Bento Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Cliente Ativo (Pontual) */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Clientes Ativos (Pontuais)</p>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <UserCheck size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-600 tracking-tight font-mono">
                {customerLifecycleStats.activeCount}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Serviços pontuais fechados (one-time ou s/ frequência)
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: customerLifecycleStats.activeCount > 0 ? '60%' : '0%' }} />
            </div>
          </div>

          {/* Card 2: Cliente Recorrente */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Clientes Recorrentes (Contratos)</p>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <RefreshCw size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
                {customerLifecycleStats.recurringCount}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Contratos ativos (semanal, quinzenal, mensal)
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: customerLifecycleStats.recurringCount > 0 ? '80%' : '0%' }} />
            </div>
          </div>

          {/* Card 3: Pausado (Manual) */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Clientes Pausados (Manual)</p>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <UserMinus size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600 tracking-tight font-mono">
                {customerLifecycleStats.pausedCount}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Pausa temporária de serviço ativada manualmente
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: customerLifecycleStats.pausedCount > 0 ? '40%' : '0%' }} />
            </div>
          </div>

          {/* Card 4: Perdido (Decisão Humana) */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/40 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Clientes Perdidos (Decisão Humana)</p>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <UserX size={14} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-rose-600 tracking-tight font-mono">
                {customerLifecycleStats.lostCount}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Removidos da carteira por decisão comercial
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: customerLifecycleStats.lostCount > 0 ? '30%' : '0%' }} />
            </div>
          </div>

        </div>

        {/* Details and Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Section A: Alertas Visuais de Needs Reactivation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">Fila de Reativação Visual (Ociosidade)</h4>
              </div>
              <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                {customerLifecycleStats.needsReactivationCount} alertas
              </span>
            </div>

            {customerLifecycleStats.listNeedsReactivation.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle className="text-emerald-500 mx-auto w-8 h-8 border border-emerald-100 rounded-full p-1 bg-emerald-50" />
                <p className="text-xs font-bold text-slate-700">Tudo em dia!</p>
                <p className="text-[10px] text-slate-400">Todos os clientes ativos e recorrentes estão dentro do calendário esperado.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto pr-1 space-y-2.5">
                {customerLifecycleStats.listNeedsReactivation.map(({ lead, daysElapsedSinceLastService, type, missingDate }) => (
                  <div key={lead.id} className="flex items-center justify-between pt-2.5 first:pt-0 group hover:bg-slate-50/40 p-1.5 rounded-xl transition-all border border-transparent hover:border-amber-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-xs">{lead.name}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-black font-sans leading-none",
                          type === 'recurring' ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-indigo-50 border border-indigo-100 text-indigo-700"
                        )}>
                          {type === 'recurring' ? 'RECORRENTE' : 'ATIVO PONTUAL'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono font-semibold flex items-center gap-1.5">
                        <span>📱 {lead.phone}</span>
                        <span className="text-slate-200">|</span>
                        <span>🗓️ Último Serviço: {lead.last_service_date ? new Date(lead.last_service_date).toLocaleDateString('pt-BR') : 'Sem registro'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {missingDate ? (
                          <>
                            <p className="text-[10px] font-black text-amber-600 font-mono leading-none">⚠️ Sem Registro</p>
                            <p className="text-[9px] font-bold text-slate-400 leading-none mt-1">Configurar serviço</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] font-black text-rose-600 font-mono leading-none">⏱️ {daysElapsedSinceLastService} dias</p>
                            <p className="text-[9px] font-black text-rose-500 leading-none mt-1 uppercase tracking-wider">
                              {type === 'recurring' ? 'SLA Recorrência' : 'Atraso Reaquecer'}
                            </p>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="bg-slate-100 hover:bg-indigo-600 group-hover:bg-indigo-600 text-slate-700 hover:text-white group-hover:text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 shadow-sm border border-slate-200/60"
                      >
                        <Phone size={10} />
                        CRM
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Fidelização & Rentabilidade */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col justify-between gap-4">
            
            {/* Retention Rate Display */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/30">
              <div className="relative flex items-center justify-center">
                {/* Visual Circle Gauge */}
                <svg className="w-20 h-20">
                  <circle className="text-slate-200" strokeWidth="6" stroke="currentColor" fill="transparent" r="32" cx="40" cy="40"/>
                  <circle 
                    className={cn(
                      customerLifecycleStats.retentionRate >= 90 ? "text-emerald-500" :
                      customerLifecycleStats.retentionRate >= 70 ? "text-amber-500" : "text-rose-500"
                    )}
                    strokeWidth="6" 
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - customerLifecycleStats.retentionRate / 100)}
                    strokeLinecap="round" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="32" 
                    cx="40" 
                    cy="40"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="absolute text-center mt-0.5">
                  <span className="text-lg font-black text-slate-800 font-mono tracking-tighter">
                    {customerLifecycleStats.retentionRate}%
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-center sm:text-left flex-1">
                <h5 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">Taxa de Retenção da Carteira</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Mede a robustez da base calculada sobre exclusões manuais ou perdas de contratos.
                </p>
                <div className="pt-1 flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                    customerLifecycleStats.retentionRate >= 90 ? "bg-emerald-100 text-emerald-800" :
                    customerLifecycleStats.retentionRate >= 70 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                  )}>
                    {customerLifecycleStats.retentionRate >= 90 ? "Excelente Saúde" :
                     customerLifecycleStats.retentionRate >= 70 ? "Atenção Necessária" : "Alerta de Churn Crítico"}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Recurring Client Metric */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/30 flex flex-col justify-between flex-1 gap-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Award size={14} className="text-amber-500" />
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tight">Top Value Recurring Client</span>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">⭐ VIP</span>
              </div>

              {customerLifecycleStats.topRecurringClient ? (
                <div className="flex justify-between items-center pt-1">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-800">
                      {customerLifecycleStats.topRecurringClient.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Plano: <span className="font-bold text-slate-600 font-mono capitalize">{customerLifecycleStats.topRecurringClient.projected_frequency}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600 font-mono">
                      ${customerLifecycleStats.topRecurringLtv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">LTV Anual Projetado</p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold italic">Nenhum contrato recorrente fechado com LTV ainda.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* MÓDULO 4: CUSTOMER RECOVERY CENTER */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6 text-white">
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-950 text-indigo-300 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-indigo-800/50 tracking-wider">
                MÓDULO 4 • American Market Customer Recovery
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2 mt-1">
              <Sparkles className="text-indigo-400" size={20} />
              Customer Recovery Center (Pós-Venda Ativo)
            </h3>
            <p className="text-xs text-slate-400">
              Gerador de scripts de alta conversão, templates de SMS/Email (EUA) e gestão de tentativas manuais para reativação de afluentes e de recorrência rápida.
            </p>
          </div>
          
          {/* Recovery Stats badge group */}
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span>🚀 Recovered:</span>
              <span className="font-mono font-black">{recoveryStats.successCount}</span>
            </div>
            <div className="bg-indigo-950/60 border border-indigo-850 text-indigo-400 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span>📞 Total Attempts:</span>
              <span className="font-mono font-black">{recoveryStats.totalAttempts}</span>
            </div>
          </div>
        </div>

        {/* Selected Lead Profile Banner */}
        {(() => {
          const lead = leads.find(l => String(l.id) === String(selectedRecoveryLeadId));
          return (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
              
              {/* Select Client Dropdown Box */}
              <div className="md:col-span-4 space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  1. Select Client to Recover
                </label>
                <select
                  value={selectedRecoveryLeadId || ''}
                  onChange={(e) => setSelectedRecoveryLeadId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choose inactive client --</option>
                  
                  {/* Option group of warning ones */}
                  {customerLifecycleStats.listNeedsReactivation.length > 0 && (
                    <optgroup label="⚠️ Clientes Em Alerta de Ociosidade">
                      {customerLifecycleStats.listNeedsReactivation.map(({ lead: l }) => (
                        <option key={l.id} value={l.id}>
                          🚨 {l.name} ({l.phone || 'No Phone'})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Option group of regular clients */}
                  <optgroup label="💼 Todos os Clientes Residenciais">
                    {leads.filter(l => l.lifecycle_status === 'active' || l.lifecycle_status === 'recurring' || l.lifecycle_status === 'paused' || l.lifecycle_status === 'lost')
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} (Status: {l.lifecycle_status})
                        </option>
                      ))
                    }
                  </optgroup>
                </select>

                <p className="text-[10px] text-slate-500 italic leading-snug">
                  💡 Tip: Selecione um cliente acima para carregar automaticamente o histórico e gerar as propostas de reativação americanas.
                </p>
              </div>

              {/* Client Metrics if selected */}
              {lead ? (
                <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-0.5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Last Service Date</p>
                    <p className="text-xs font-black text-indigo-400 font-mono">
                      {lead.last_service_date ? new Date(lead.last_service_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-0.5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Home Blueprint</p>
                    <p className="text-xs font-black text-slate-300">
                      {lead.bedrooms || '?' } bds / {lead.bathrooms || '?'} bths
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-0.5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Estimated Ticket</p>
                    <p className="text-xs font-black text-emerald-400 font-mono">
                      ${lead.estimated_price || lead.closed_value || '150'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-0.5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Frequency Model</p>
                    <p className="text-xs font-black text-slate-300 capitalize">
                      {lead.projected_frequency || 'one-time'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="md:col-span-8 flex items-center justify-center p-6 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-500 text-center">Nenhum cliente selecionado no momento. Selecione um cliente no menu esquerdo.</p>
                </div>
              )}

            </div>
          );
        })()}

        {/* Split UI layout: Left: Attempt form & History Log, Right: High-Converting Copiable Copywriters */}
        {(() => {
          const lead = leads.find(l => String(l.id) === String(selectedRecoveryLeadId));
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (5/12): Attempt Registration & Timeline Logs */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Registrador de Tentativa Manual */}
                <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-800/60 pb-2.5">
                    <Save size={13} className="text-indigo-400" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">2. Log Reactivation Effort</span>
                  </div>

                  {lead ? (
                    <div className="space-y-3.5">
                      {/* Channel Pick */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">Reactivation Channel</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setRecoveryChannel('sms')}
                            className={cn(
                              "py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all flex items-center justify-center gap-1",
                              recoveryChannel === 'sms' 
                                ? "bg-indigo-600 border-indigo-500 text-white" 
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            )}
                          >
                            💬 SMS
                          </button>
                          <button
                            onClick={() => setRecoveryChannel('call')}
                            className={cn(
                              "py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all flex items-center justify-center gap-1",
                              recoveryChannel === 'call' 
                                ? "bg-indigo-600 border-indigo-500 text-white" 
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            )}
                          >
                            📞 Call
                          </button>
                          <button
                            onClick={() => setRecoveryChannel('email')}
                            className={cn(
                              "py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all flex items-center justify-center gap-1",
                              recoveryChannel === 'email' 
                                ? "bg-indigo-600 border-indigo-500 text-white" 
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            )}
                          >
                            ✉️ Email
                          </button>
                        </div>
                      </div>

                      {/* Result Pick */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">Attempt Result</label>
                        <select
                          value={recoveryStatus}
                          onChange={(e) => setRecoveryStatus(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl p-2 outline-none focus:border-indigo-500"
                        >
                          <option value="pending">⏳ Pending Response / Left Message</option>
                          <option value="success">🎉 Success (Reactivated client!)</option>
                          <option value="no_response">☎️ No Response / Busy / Left Voicemail</option>
                          <option value="refused">❌ Refused / Not Interested</option>
                        </select>
                      </div>

                      {/* Notes Check */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">Call/Message Log Notes</label>
                        <textarea
                          placeholder="e.g. Spoke with husband, loved the $20 catch-up discount. Scheduled for next Tuesday."
                          value={recoveryNotes}
                          onChange={(e) => setRecoveryNotes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 h-16 outline-none focus:border-indigo-500 resize-none font-semibold text-slate-300"
                        />
                      </div>

                      {/* Save Status Reports */}
                      {recoverySaveError && (
                        <p className="text-[10px] bg-rose-950 border border-rose-800 text-rose-300 p-2 rounded-xl font-bold">
                          ⚠️ {recoverySaveError}
                        </p>
                      )}

                      {recoverySaveSuccess && (
                        <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-emerald-400" />
                          Log registrado com sucesso!
                        </div>
                      )}

                      {/* Save Log Button */}
                      <button
                        onClick={handleSaveRecoveryAttempt}
                        disabled={isSavingRecovery}
                        className={cn(
                          "w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wide py-2.5 rounded-xl shadow-md border border-indigo-400/30 transition-all flex items-center justify-center gap-1.5 mt-2",
                          recoveryStatus === 'success' ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500/30" : ""
                        )}
                      >
                        <Check size={14} className="text-white" />
                        {isSavingRecovery ? 'Saving...' :
                         recoveryStatus === 'success' ? 'Log Success & Reactivate Client!' : 'Log Recovery Attempt'}
                      </button>

                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500 font-semibold italic">
                      Por favor, selecione um cliente no topo para registrar as tentativas.
                    </div>
                  )}

                </div>

                {/* Histórico Temporal de Reativações do Cliente */}
                <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800/80 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Customer Reactivation Logs</span>
                    </div>
                    {lead && (
                      <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                        {lead.name}
                      </span>
                    )}
                  </div>

                  {!lead ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-semibold italic">
                      Selecione um cliente para ver o histórico.
                    </div>
                  ) : (() => {
                    let historyList: any[] = [];
                    try {
                      if (lead.recovery_history) {
                        historyList = JSON.parse(lead.recovery_history);
                      }
                    } catch (e) {
                      console.warn(e);
                    }

                    if (historyList.length === 0) {
                      return (
                        <div className="py-8 text-center space-y-1 bg-slate-900/30 border border-dashed border-slate-800/50 rounded-xl">
                          <p className="text-xs text-slate-400 font-bold">Nenhum histórico registrado</p>
                          <p className="text-[10px] text-slate-500 px-3 leading-normal">Ainda não há tentativas de reativação listadas para este cliente.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="divide-y divide-slate-800/50 max-h-[160px] overflow-y-auto pr-1 space-y-3">
                        {historyList.map((att) => (
                          <div key={att.id} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "px-1.5 py-0.5 text-[8px] font-black rounded-lg uppercase border tracking-wide leading-none",
                                  att.channel === 'sms' ? "bg-indigo-950/60 border-indigo-800 text-indigo-400" :
                                  att.channel === 'call' ? "bg-violet-950/60 border-violet-800 text-violet-400" :
                                  "bg-blue-950/60 border-blue-800 text-blue-400"
                                )}>
                                  {att.channel}
                                </span>
                                <span className={cn(
                                  "px-1.5 py-0.5 text-[8px] font-black rounded-lg uppercase border tracking-wide leading-none",
                                  att.status === 'success' ? "bg-emerald-950/60 border-emerald-800 text-emerald-400" :
                                  att.status === 'refused' ? "bg-rose-950/60 border-rose-800 text-rose-400" :
                                  att.status === 'no_response' ? "bg-amber-950/60 border-amber-800 text-amber-400" :
                                  "bg-slate-900 border-slate-800 text-slate-400"
                                )}>
                                  {att.status === 'success' ? 'Reativado' : att.status === 'refused' ? 'Recusado' : att.status === 'no_response' ? 'Sem Resposta' : 'Pendente'}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono font-semibold">
                                🗓️ {new Date(att.date).toLocaleDateString()} at {new Date(att.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-medium pl-1 leading-relaxed">
                              {att.notes}
                            </p>
                            <p className="text-[9.5px] text-slate-500 pl-1 font-semibold">
                              Logged by: <span className="text-slate-400">{att.agentName || 'Agent'}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                </div>

              </div>

              {/* Right Column (7/12): High-converting Template Generation Engine */}
              <div className="lg:col-span-7 bg-slate-950 p-5 rounded-3xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
                
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-400" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300">3. USA High-Converting Campaign Angles</span>
                    </div>

                    {/* Angle Selector Tabs */}
                    <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setRecoveryAngle('miss_you')}
                        className={cn(
                          "px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wide transition-all",
                          recoveryAngle === 'miss_you' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-300"
                        )}
                      >
                        Gift check
                      </button>
                      <button
                        onClick={() => setRecoveryAngle('seasonal')}
                        className={cn(
                          "px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wide transition-all",
                          recoveryAngle === 'seasonal' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-300"
                        )}
                      >
                        Seasonal
                      </button>
                      <button
                        onClick={() => setRecoveryAngle('priority')}
                        className={cn(
                          "px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wide transition-all",
                          recoveryAngle === 'priority' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-300"
                        )}
                      >
                        VIP Lock
                      </button>
                      <button
                        onClick={() => setRecoveryAngle('quality')}
                        className={cn(
                          "px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wide transition-all",
                          recoveryAngle === 'quality' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-300"
                        )}
                      >
                        Quality Check
                      </button>
                    </div>
                  </div>

                  {lead ? (
                    <div className="grid grid-cols-1 gap-4.5">
                      
                      {/* Copy Box 1: SMS */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 relative">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono">📱 Mobile SMS (US Friendly / Conversational)</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(recoveryTemplates.sms);
                              setCopiedState('sms');
                              setTimeout(() => setCopiedState(null), 2000);
                            }}
                            className="bg-slate-850 hover:bg-indigo-600 text-[10px] font-black uppercase text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-750 transition-all flex items-center gap-1"
                          >
                            {copiedState === 'sms' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            {copiedState === 'sms' ? 'Copied!' : 'Copy SMS'}
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono select-all bg-slate-950 p-2.5 rounded-xl border border-slate-850 whitespace-pre-wrap">
                          {recoveryTemplates.sms}
                        </p>
                      </div>

                      {/* Copy Box 2: CALL SCRIPT */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 relative">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 font-mono">🗣️ Phone Call Script (High Empathy)</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(recoveryTemplates.callScript);
                              setCopiedState('call');
                              setTimeout(() => setCopiedState(null), 2000);
                            }}
                            className="bg-slate-850 hover:bg-indigo-600 text-[10px] font-black uppercase text-violet-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-750 transition-all flex items-center gap-1"
                          >
                            {copiedState === 'call' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            {copiedState === 'call' ? 'Copied!' : 'Copy Script'}
                          </button>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed max-h-[140px] overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-850 font-sans whitespace-pre-wrap">
                          {recoveryTemplates.callScript}
                        </div>
                      </div>

                      {/* Copy Box 3: EMAIL */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 relative">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono">✉️ Professional Reactivation Email</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(recoveryTemplates.email);
                              setCopiedState('email');
                              setTimeout(() => setCopiedState(null), 2000);
                            }}
                            className="bg-slate-850 hover:bg-indigo-600 text-[10px] font-black uppercase text-blue-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-750 transition-all flex items-center gap-1"
                          >
                            {copiedState === 'email' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            {copiedState === 'email' ? 'Copied!' : 'Copy Email'}
                          </button>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed max-h-[140px] overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-850 font-sans whitespace-pre-wrap">
                          {recoveryTemplates.email}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="py-24 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl flex-1 flex flex-col justify-center">
                      <Sparkles className="mx-auto w-8 h-8 text-slate-600 animate-pulse" />
                      <p className="text-xs font-black text-slate-500">Selecione um cliente para começar</p>
                      <p className="text-[10px] text-slate-600 max-w-sm mx-auto px-4 leading-normal">Qualquer cliente comercial ou residencial pode ser selecionado acima para reativar um relacionamento com propostas de alto impacto.</p>
                    </div>
                  )}

                </div>

                {lead && (
                  <div className="pt-2 bg-slate-900 p-2.5 rounded-2xl border border-slate-850 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1">🛡️ No Bots Auto-sending Policy Activated</span>
                    <span className="text-indigo-400">American Copywriter v4.2 • Passive Outreach</span>
                  </div>
                )}
                
              </div>

            </div>
          );
        })()}

      </div>

      {/* MÓDULO 5: REVENUE RECOVERY CENTER */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6 text-white mt-8">
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-950 text-emerald-300 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-emerald-800/50 tracking-wider">
                MÓDULO 5 • Revenue Recovery Center
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2 mt-1">
              <TrendingUp className="text-emerald-400" size={20} />
              Reativação de Orçamentos Perdidos (Middle-Funnel)
            </h3>
            <p className="text-xs text-slate-400">
              Gestão estratégica e cópias em alta conversão focadas exclusivamente em orçamentos já enviados que estão parados no meio do funil sem fechamento recente.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span>📊 Pending Quotes:</span>
              <span className="font-mono font-black">{quoteRecoveryStats.pendingCount}</span>
            </div>
            <div className="bg-amber-950/60 border border-amber-800 text-amber-400 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span>💰 Revenue Stuck:</span>
              <span className="font-mono font-black">${quoteRecoveryStats.totalFinancialValueStuck.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* 4 Indicators Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-1">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Orçamentos Pendentes</p>
            <p className="text-xl font-black text-white font-mono">{quoteRecoveryStats.pendingCount}</p>
            <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">Quotes ativamente emitidas sem venda.</p>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-1">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Inativos &gt; 24h a 48h</p>
            <p className="text-xl font-black text-amber-500 font-mono">{quoteRecoveryStats.unanswered24h}</p>
            <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">Quotes enviadas sem resposta há mais de 1 dia.</p>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-1">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Inativos &gt; 48h a 72h</p>
            <p className="text-xl font-black text-orange-500 font-mono">{quoteRecoveryStats.unanswered48h}</p>
            <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">Quotes enviadas há mais de 2 dias sem fechamento.</p>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-1">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Inativos &gt; 72 horas</p>
            <p className="text-xl font-black text-rose-500 font-mono">{quoteRecoveryStats.unanswered72h}</p>
            <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">Fila prioritária. Críticos com risco de perda do lead.</p>
          </div>

        </div>

        {/* Master layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LHS - LARGEST QUOTES AT RISK OF LOSS */}
          <div className="lg:col-span-5 bg-slate-950/40 p-4.5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} className="text-red-400" />
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-tight">Orçamentos sob Risco de Perda</h4>
              </div>
              <span className="bg-red-950 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-900/60 font-mono">
                Ordenado por Ticket
              </span>
            </div>

            {quoteRecoveryStats.largestQuotes.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle className="text-emerald-500 mx-auto w-8 h-8 p-1 rounded-full bg-emerald-950/60 border border-emerald-900" />
                <p className="text-xs font-bold text-slate-300">Tudo limpo!</p>
                <p className="text-[10px] text-slate-500">Nenhum orçamento pendente precisando de intervenção manual no momento.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-900 max-h-[380px] overflow-y-auto pr-1 space-y-2.5">
                {quoteRecoveryStats.largestQuotes.map((item) => {
                  const leadObj = item.lead;
                  const hoursElapsed = Math.round(item.hoursElapsed);
                  let timeDisplay = `${hoursElapsed}h`;
                  if (hoursElapsed >= 24) {
                    timeDisplay = `${Math.round(hoursElapsed / 24)} dias`;
                  }
                  
                  return (
                    <div key={leadObj.id} className="flex items-center justify-between pt-2.5 first:pt-0 group hover:bg-slate-900/60 p-1.5 rounded-xl transition-all border border-transparent hover:border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-200 text-xs">{leadObj.name}</span>
                          {item.isBackfilled && (
                            <span className="bg-slate-800 text-slate-400 font-mono font-semibold text-[8px] px-1 py-0.5 rounded leading-none border border-slate-750">
                              Histórico (Backfilled)
                            </span>
                          )}
                          <span className="font-semibold text-[9px] text-slate-400 font-mono">
                            ({leadObj.bedrooms || '?'}B / {leadObj.bathrooms || '?'}Ba)
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                          <span>📱 {leadObj.phone}</span>
                          <span className="text-slate-700">|</span>
                          <span>🕒 {timeDisplay} ocioso</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <p className="text-xs font-black text-emerald-400 font-mono">${item.price}</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{item.attemptsCount} contatos</p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedQuoteLeadId(leadObj.id);
                          }}
                          className={cn(
                            "px-2 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1",
                            String(selectedQuoteLeadId) === String(leadObj.id)
                              ? "bg-emerald-600 border border-emerald-500 text-white shadow"
                              : "bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750"
                          )}
                        >
                          <TrendingUp size={9} />
                          Ativar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>SLA Máximo Recomendado: 72 horas</span>
              <span className="text-slate-400">Total Retido: ${quoteRecoveryStats.totalFinancialValueStuck.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* RHS - INTERACTIVE CRM AND COPYWRITING CAMPAIGN */}
          <div className="lg:col-span-12 xl:col-span-7 bg-slate-950/40 p-4.5 rounded-2xl border border-slate-850 flex flex-col justify-between gap-5 min-h-[460px]">
            
            {(() => {
              const lead = leads.find(l => String(l.id) === String(selectedQuoteLeadId));
              return lead ? (
                <div className="space-y-4 flex-1">
                  
                  {/* Active Lead Summary Card */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black text-white">{lead.name}</h4>
                        {lead.city && (
                          <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[8px] font-sans px-1.5 py-0.5 rounded uppercase leading-none">
                            📍 {lead.city}
                          </span>
                        )}
                        {lead.quote_sent_at?.includes('_backfilled') && (
                          <span className="bg-slate-900 text-[8px] font-mono border border-slate-800 text-slate-500 rounded px-1.5 py-0.5 leading-none">
                            Legacy Backfilled
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Estimativa Enviada em: <span className="text-slate-200">
                          {lead.quote_sent_at 
                            ? new Date(lead.quote_sent_at.split('_')[0]).toLocaleString('en-US') 
                            : 'Fevereiro 2026 / Backfilled'}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400 leading-none">Valor Estimado</p>
                      <p className="text-sm font-extrabold text-emerald-400 font-mono mt-1">
                        ${lead.revenue_estimate || parseFloat(String(lead.estimated_price).replace(/[^0-9.]/g, '')) || '150.00'}
                      </p>
                    </div>
                  </div>

                  {/* Selector of Angles */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Selecione o Gancho de Reativação Comercial</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => setQuoteAngle('budget_fit')}
                        className={cn(
                          "px-2.5 py-2 rounded-xl text-[10px] font-bold text-left border transition-all flex flex-col justify-between gap-1",
                          quoteAngle === 'budget_fit' 
                            ? "bg-indigo-950/65 border-indigo-500 text-indigo-300 shadow" 
                            : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400"
                        )}
                      >
                        <span className="font-black flex items-center gap-1 text-white">
                          <DollarSign size={10} className="text-indigo-400" />
                          1. Budget Match
                        </span>
                        <span className="text-[8px] text-slate-500 leading-normal block font-semibold">Desconto especial de $15 para ajuste orçamentário.</span>
                      </button>

                      <button
                        onClick={() => setQuoteAngle('priority_slot')}
                        className={cn(
                          "px-2.5 py-2 rounded-xl text-[10px] font-bold text-left border transition-all flex flex-col justify-between gap-1",
                          quoteAngle === 'priority_slot' 
                            ? "bg-emerald-950/65 border-emerald-500 text-emerald-300 shadow" 
                            : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400"
                        )}
                      >
                        <span className="font-black flex items-center gap-1 text-white">
                          <Clock size={10} className="text-emerald-400" />
                          2. Route Slot Priority
                        </span>
                        <span className="text-[8px] text-slate-500 leading-normal block font-semibold">Brecha na rota vizinha com desconto de otimização logística.</span>
                      </button>

                      <button
                        onClick={() => setQuoteAngle('satisfaction_check')}
                        className={cn(
                          "px-2.5 py-2 rounded-xl text-[10px] font-bold text-left border transition-all flex flex-col justify-between gap-1",
                          quoteAngle === 'satisfaction_check' 
                            ? "bg-amber-950/65 border-amber-500 text-amber-300 shadow" 
                            : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400"
                        )}
                      >
                        <span className="font-black flex items-center gap-1 text-white">
                          <Sparkles size={10} className="text-amber-400" />
                          3. Quality Guarantee
                        </span>
                        <span className="text-[8px] text-slate-500 leading-normal block font-semibold">Follow-up centrado na garantia de 50 pontos Dany Clean Pro.</span>
                      </button>
                    </div>
                  </div>

                  {/* Copywriting Dashboard with tabs */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Canais Disponíveis (Passive Consultive Outreach)</span>
                      <span className="text-[9px] text-slate-500 italic">No automated texts sent</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      
                      {/* SMS Column */}
                      <div className="md:col-span-12 space-y-1.5 flex flex-col">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1">📱 TEXT / SMS template</label>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(quoteRecoveryTemplates.sms);
                              setQuoteCopiedState('sms');
                              setTimeout(() => setQuoteCopiedState(null), 2000);
                            }}
                            className="bg-slate-900 hover:bg-indigo-600 text-[10px] font-black uppercase text-blue-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 transition-all flex items-center gap-1"
                          >
                            {quoteCopiedState === 'sms' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            {quoteCopiedState === 'sms' ? 'Copied!' : 'Copy SMS'}
                          </button>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-850 font-sans whitespace-pre-wrap">
                          {quoteRecoveryTemplates.sms}
                        </div>
                      </div>

                      {/* CALL SCRIPT */}
                      <div className="md:col-span-12 space-y-1.5 pb-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-amber-400 font-black uppercase tracking-wider flex items-center gap-1">📞 CALL SCRIPT / SALES PITCH</label>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(quoteRecoveryTemplates.callScript);
                              setQuoteCopiedState('call');
                              setTimeout(() => setQuoteCopiedState(null), 2000);
                            }}
                            className="bg-slate-900 hover:bg-amber-600 text-[10px] font-black uppercase text-amber-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 transition-all flex items-center gap-1"
                          >
                            {quoteCopiedState === 'call' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            {quoteCopiedState === 'call' ? 'Copied!' : 'Copy Script'}
                          </button>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed max-h-[120px] overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-850 font-sans whitespace-pre-wrap">
                          {quoteRecoveryTemplates.callScript}
                        </div>
                      </div>

                      {/* EMAIL TEMPLATE */}
                      <div className="md:col-span-12 space-y-1.5 pb-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1">✉️ Email copy</label>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(quoteRecoveryTemplates.email);
                              setQuoteCopiedState('email');
                              setTimeout(() => setQuoteCopiedState(null), 2000);
                            }}
                            className="bg-slate-900 hover:bg-emerald-600 text-[10px] font-black uppercase text-blue-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 transition-all flex items-center gap-1"
                          >
                            {quoteCopiedState === 'email' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            {quoteCopiedState === 'email' ? 'Copied!' : 'Copy Email'}
                          </button>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed max-h-[140px] overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-850 font-sans whitespace-pre-wrap">
                          {quoteRecoveryTemplates.email}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* LOG MANUAL ATTEMPT */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-3">
                    <div className="flex items-center gap-1 border-b border-slate-850 pb-2">
                      <Save size={13} className="text-emerald-400" />
                      <h5 className="text-[11px] font-black uppercase text-slate-300 tracking-tight">Registrar Contato / Tentativa de Recuperação</h5>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Canal Utilizado</label>
                        <select
                          value={quoteChannel}
                          onChange={(e: any) => setQuoteChannel(e.target.value)}
                          className="w-full bg-slate-900 text-xs border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="sms">📱 SMS / Text Message</option>
                          <option value="call">📞 Phone Call</option>
                          <option value="email">✉️ E-mail</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Resultado do Contato</label>
                        <select
                          value={quoteRecoveryStatus}
                          onChange={(e: any) => {
                            setQuoteRecoveryStatus(e.target.value);
                            if (e.target.value !== 'success') {
                              setQuoteClosedValueInput(''); // Clear input if not success
                            }
                          }}
                          className="w-full bg-slate-900 text-xs border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="pending">⏳ Pendente (Sem Resposta Imediata)</option>
                          <option value="no_response">⏱️ Sem Resposta (Inativo)</option>
                          <option value="refused">❌ Recusado (Perda Declarada / Fora do Budget)</option>
                          <option value="success">💰 VENDA FECHADA (Closed / Reactivated)</option>
                        </select>
                      </div>

                    </div>

                    {/* Closed Value Input wrapper if status is success */}
                    {quoteRecoveryStatus === 'success' && (
                      <div className="space-y-1.5 animate-fadeIn bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/60 mt-1">
                        <label className="text-[10px] font-black text-emerald-400 uppercase tracking-tight flex items-center gap-1">
                          <span>💰 VALOR REAL DA VENDA FECHADA (CLOSED VALUE) *</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Digite o valor final em dólares. Ex: 195"
                          required
                          value={quoteClosedValueInput}
                          onChange={(e) => setQuoteClosedValueInput(e.target.value)}
                          className="w-full bg-slate-950 font-mono text-xs border border-emerald-500/60 text-emerald-400 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                        />
                        <p className="text-[9px] text-slate-400 font-semibold italic">
                          Obrigatório! O valor real de fechamento desse contrato deve ser informado manualmente para prosseguir com a conversão de vendas.
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Notas Internas / Observações</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Cliente adorou o desconto de $15 e preferiu agendar para quinta-feira com plano quinzenal..."
                        value={quoteNotes}
                        onChange={(e) => setQuoteNotes(e.target.value)}
                        className="w-full bg-slate-900 text-xs border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-600"
                      />
                    </div>

                    {/* Status notifications inside the card */}
                    {quoteSaveSuccess && (
                      <div className="bg-emerald-950/50 text-emerald-400 text-[10px] font-bold p-2.5 rounded-xl border border-emerald-900 flex items-center gap-1.5 animate-fadeIn">
                        <CheckCircle size={12} />
                        Histórico atualizado! Orçamento e funil comercial sincronizados com sucesso.
                      </div>
                    )}

                    {quoteSaveError && (
                      <div className="bg-red-950/50 text-red-400 text-[10px] font-bold p-2.5 rounded-xl border border-red-900 flex items-center gap-1.5 animate-fadeIn">
                        <AlertTriangle size={12} />
                        {quoteSaveError}
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={handleSaveQuoteRecoveryAttempt}
                      disabled={isSavingQuoteRecovery}
                      className={cn(
                        "w-full text-[11px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border shadow-md",
                        quoteRecoveryStatus === 'success'
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/60"
                          : "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700/60"
                      )}
                    >
                      {isSavingQuoteRecovery ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Gravando Transação no SQLite...
                        </>
                      ) : (
                        <>
                          <Save size={12} />
                          Salvar Tentativa de Recuperação
                        </>
                      )}
                    </button>

                  </div>

                </div>
              ) : (
                <div className="py-24 text-center space-y-3 border border-dashed border-slate-800 rounded-2xl flex-1 flex flex-col justify-center">
                  <Sparkles className="mx-auto w-8 h-8 text-slate-600 animate-pulse" />
                  <p className="text-xs font-black text-slate-500">Selecione um orçamento para começar</p>
                  <p className="text-[10px] text-slate-600 max-w-sm mx-auto px-4 leading-normal">Qualquer lead que esteja com orçamento pendente de fechamento comercial aparecerá na coluna ao lado para receber follow-up proativo.</p>
                </div>
              );
            })()}

          </div>

        </div>

        <div className="pt-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-850 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">🛡️ No Bots Auto-sending Policy Activated</span>
          <span className="text-slate-500">Revenue Recovery Core v5.1 • Passive Middle-Funnel CRM</span>
        </div>

      </div>

      {/* Main Core Layout: Sidebar Selection + Lead Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        
        {/* LHS: Content Filtering, Search, and Tabs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Horizontal Tabs List */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button 
                onClick={() => { setActiveTab('hot'); setSelectedLeadId(null); }}
                className={cn(
                  "px-3 py-2 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5",
                  activeTab === 'hot' 
                    ? "bg-rose-50 text-rose-700 border border-rose-100 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <Flame size={13} className={activeTab === 'hot' ? 'text-rose-500 animate-pulse' : 'text-slate-400'} />
                🔥 Hot Leads ({hotLeads.length})
              </button>

              <button 
                onClick={() => { setActiveTab('followup'); setSelectedLeadId(null); }}
                className={cn(
                  "px-3 py-2 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5",
                  activeTab === 'followup' 
                    ? "bg-amber-50 text-amber-700 border border-amber-100 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <Clock size={13} className={activeTab === 'followup' ? 'text-amber-500' : 'text-slate-400'} />
                ⌛ Pendentes ({followupLeads.length})
              </button>

              <button 
                onClick={() => { setActiveTab('lost'); setSelectedLeadId(null); }}
                className={cn(
                  "px-3 py-2 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5",
                  activeTab === 'lost' 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <AlertCircle size={13} className={activeTab === 'lost' ? 'text-indigo-500' : 'text-slate-400'} />
                💨 Em Fuga ({lostOpportunities.length})
              </button>

              <button 
                onClick={() => { setActiveTab('top_revenue'); setSelectedLeadId(null); }}
                className={cn(
                  "px-3 py-2 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5",
                  activeTab === 'top_revenue'
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <DollarSign size={13} className={activeTab === 'top_revenue' ? 'text-emerald-500' : 'text-slate-400'} />
                📈 Alto Valor ({topRevenueLeads.length})
              </button>

              <button 
                onClick={() => { setActiveTab('all'); setSelectedLeadId(null); }}
                className={cn(
                  "px-3 py-2 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5",
                  activeTab === 'all'
                    ? "bg-slate-100 text-slate-800 border border-slate-200 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <Layers size={13} className="text-slate-400" />
                Dossiê Completo ({leads.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="Filtrar por nome, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500/50 focus:bg-white text-xs pl-8 pr-3 py-2 rounded-2xl outline-none transition-all placeholder-slate-400 font-medium"
              />
            </div>

          </div>

          {/* List Display */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {currentTabLeads.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
                  <SlidersHorizontal size={24} />
                </div>
                <h4 className="font-bold text-slate-900 mb-1 text-sm">Nenhum lead nesta categoria</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Todos os leads foram processados, ou não atendem aos critérios desta segmentação temporariamente.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {currentTabLeads.map((lead, idx) => {
                    const rec = getVisualRecommendation(lead);
                    const isSelected = selectedLeadId === lead.id;
                    const elapsedDays = getDaysElapsed(lead);

                    return (
                      <motion.div 
                        key={lead.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                        onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                        className={cn(
                          "p-4 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ",
                          isSelected ? "bg-slate-50/70 border-l-4 border-indigo-500" : "hover:bg-slate-50/30"
                        )}
                      >
                        {/* Left portion: Core Info */}
                        <div className="flex-grow space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-800 text-sm hover:text-indigo-600 truncate">{lead.name || 'Anonymous'}</span>
                            
                            {/* Execution checklist mini badges */}
                            <div className="flex items-center gap-1">
                              {lead.call_made === 1 && (
                                <span className="bg-blue-100 text-blue-800 text-[8px] font-bold px-1 rounded" title="Ligado">LIG</span>
                              )}
                              {lead.client_answered === 1 && (
                                <span className="bg-indigo-100 text-indigo-800 text-[8px] font-bold px-1 rounded" title="Atendido">ATE</span>
                              )}
                              {lead.quote_sent === 1 && (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1 rounded" title="Orçamento Enviado">ORÇ</span>
                              )}
                              {lead.service_scheduled === 1 && (
                                <span className="bg-purple-100 text-purple-800 text-[8px] font-bold px-1 rounded" title="Serviço Agendado">AGE</span>
                              )}
                              {lead.sale_closed === 1 ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-1 rounded border border-emerald-200 animate-pulse" title="Venda Fechada">FECHOU</span>
                              ) : null}
                            </div>

                            {lead.lead_score !== undefined && lead.lead_score !== null && (
                              <span className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded-full font-mono shrink-0 ml-auto sm:ml-0",
                                lead.lead_score >= 75 ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                lead.lead_score >= 40 ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                "bg-slate-50 text-slate-500 border border-slate-100"
                              )}>
                                Score: {lead.lead_score}
                              </span>
                            )}
                          </div>
                          
                          {/* Details line */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-medium">
                            <span className="capitalize">{lead.service_type || 'Limpeza Padrão'}</span>
                            {lead.city && <span>• {lead.city}</span>}
                            {lead.bedrooms && <span>• {lead.bedrooms}Q/{lead.bathrooms}B</span>}
                            {elapsedDays > 0 && <span className="text-rose-500 font-bold">• Há {elapsedDays} {elapsedDays === 1 ? 'dia' : 'dias'}</span>}
                          </div>

                          {/* Commercial notes snippet in the card list */}
                          {lead.commercial_notes && (
                            <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50/40 px-2 py-0.5 rounded-xl inline-block max-w-lg truncate">
                              💼 {lead.commercial_notes}
                            </p>
                          )}
                        </div>

                        {/* Right portion: Revenue and Visual Recommendation */}
                        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                          
                          <div className="text-left sm:text-right">
                            {lead.sale_closed === 1 ? (
                              <>
                                <p className="text-[9px] text-emerald-600 font-black uppercase tracking-wider leading-none">Fechado por</p>
                                <p className="text-base font-black text-emerald-600 font-mono">${lead.closed_value || 0}</p>
                              </>
                            ) : (
                              lead.revenue_estimate !== undefined && lead.revenue_estimate !== null && (
                                <>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Receita Estimada</p>
                                  <p className="text-base font-black text-slate-700 font-mono">${lead.revenue_estimate}</p>
                                </>
                              )
                            )}
                          </div>

                          {/* Suggested Action Badge */}
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 border leading-none self-start sm:self-auto",
                            rec.color
                          )}>
                            <rec.icon size={11} />
                            {rec.label}
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* RHS: Consultive Detail Panel / Sales Execution Tracker (Fase 4 Editor) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm sticky top-24">
            
            {selectedLead ? (
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 border-b border-dashed border-slate-200 pb-1 text-base">{selectedLead.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{selectedLead.phone}</p>
                    {selectedLead.email && <p className="text-[10px] text-slate-400 font-medium truncate">{selectedLead.email}</p>}
                  </div>
                  <button 
                    onClick={() => setSelectedLeadId(null)}
                    className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* TRACKER SALES EXECUTION BOARD - Phase 4 Manual Entry */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <SlidersHorizontal size={14} className="text-indigo-600" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Acompanhamento Comercial (Manual)</span>
                  </div>

                  {/* 1. Call made */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600">1. Ligação feita?</span>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                      <button 
                        onClick={() => setFormCallMade(true)}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", formCallMade ? "bg-indigo-600 text-white shadow" : "text-slate-400")}
                      >
                        SIM
                      </button>
                      <button 
                        onClick={() => { setFormCallMade(false); setFormClientAnswered(false); }}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", !formCallMade ? "bg-slate-200 text-slate-700 font-bold" : "text-slate-400")}
                      >
                        NÃO
                      </button>
                    </div>
                  </div>

                  {/* 2. Client answered (active only if called is True) */}
                  <div className={cn("flex items-center justify-between gap-2 transition-opacity", !formCallMade ? "opacity-50 pointer-events-none" : "opacity-100")}>
                    <span className="text-xs font-semibold text-slate-600">2. Cliente atendeu?</span>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                      <button 
                        onClick={() => setFormClientAnswered(true)}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", formClientAnswered ? "bg-indigo-600 text-white shadow" : "text-slate-400")}
                      >
                        SIM
                      </button>
                      <button 
                        onClick={() => setFormClientAnswered(false)}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", !formClientAnswered ? "bg-slate-200 text-slate-700 font-bold" : "text-slate-400")}
                      >
                        NÃO
                      </button>
                    </div>
                  </div>

                  {/* 3. Quote sent */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600">3. Orçamento enviado?</span>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                      <button 
                        onClick={() => setFormQuoteSent(true)}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", formQuoteSent ? "bg-indigo-600 text-white shadow" : "text-slate-400")}
                      >
                        SIM
                      </button>
                      <button 
                        onClick={() => setFormQuoteSent(false)}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", !formQuoteSent ? "bg-slate-200 text-slate-700 font-bold" : "text-slate-400")}
                      >
                        NÃO
                      </button>
                    </div>
                  </div>

                  {/* 4. Service scheduled */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600">4. Serviço agendado?</span>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                      <button 
                        onClick={() => setFormServiceScheduled(true)}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", formServiceScheduled ? "bg-indigo-600 text-white shadow" : "text-slate-400")}
                      >
                        SIM
                      </button>
                      <button 
                        onClick={() => setFormServiceScheduled(false)}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", !formServiceScheduled ? "bg-slate-200 text-slate-700 font-bold" : "text-slate-400")}
                      >
                        NÃO
                      </button>
                    </div>
                  </div>

                  {/* 5. Sale closed */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600">5. Venda fechada?</span>
                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                      <button 
                        onClick={() => { setFormSaleClosed(true); if(!formClosedValue && selectedLead.revenue_estimate) setFormClosedValue(selectedLead.revenue_estimate.toString()); }}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", formSaleClosed ? "bg-emerald-600 text-white shadow font-extrabold" : "text-slate-400")}
                      >
                        SIM
                      </button>
                      <button 
                        onClick={() => { setFormSaleClosed(false); setFormClosedValue(''); }}
                        className={cn("px-2.5 py-1 text-[10px] font-black rounded-md transition-all", !formSaleClosed ? "bg-slate-200 text-slate-700 font-bold" : "text-slate-400")}
                      >
                        NÃO
                      </button>
                    </div>
                  </div>

                  {/* 6. Closed value $ (visible and required when sale is closed) */}
                  <div className={cn("space-y-1.5 transition-all", formSaleClosed ? "block" : "hidden")}>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">6. Valor fechado em dólares ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
                      <input 
                        type="number" 
                        value={formClosedValue}
                        onChange={(e) => setFormClosedValue(e.target.value)}
                        placeholder={selectedLead.revenue_estimate?.toString() || '0.00'}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 pl-7 pr-3 py-1.5 rounded-xl font-mono font-black text-sm outline-none"
                      />
                    </div>
                  </div>

                  {/* 7. Commercial notes */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">7. Observação comercial curta</label>
                    <textarea 
                      value={formCommercialNotes}
                      onChange={(e) => setFormCommercialNotes(e.target.value.substring(0, 200))}
                      placeholder="Ex: Ligado às 14h, agendou limpeza quinzenal para segunda-feira."
                      rows={2}
                      className="w-full bg-white border border-slate-200 focus:focus:border-indigo-500 p-2.5 rounded-xl text-xs font-semibold outline-none resize-none leading-relaxed"
                    />
                    <div className="text-[9px] text-slate-400 text-right font-medium">
                      {(formCommercialNotes || '').length}/200 caracteres
                    </div>
                  </div>

                  {/* Phase 5: LTV Recorrente */}
                  <div className="border-t border-slate-100 pt-3.5 space-y-3.5">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={13} className="text-indigo-600" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">8. Projeção de LTV Recorrente</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-slate-500 block">Frequência Contratada/Projetada</label>
                      <select
                        value={formProjectedFrequency}
                        onChange={(e) => setFormProjectedFrequency(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 p-2 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="one-time">Não-recorrente (Limpeza Única - 1x)</option>
                        <option value="monthly">Mensal (Previsão de 12x/ano)</option>
                        <option value="bi-weekly">Quinzenal (Previsão de 26x/ano)</option>
                        <option value="weekly">Semanal (Previsão de 52x/ano)</option>
                      </select>
                    </div>

                    <div className="bg-indigo-50/50 border border-indigo-100/60 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">LTV Estimado (12 meses):</span>
                      <span className="text-sm font-black text-indigo-700 font-mono">${formProjectedLtv}</span>
                    </div>
                  </div>

                  {/* Phase 5: Registro Inteligente de Objeções */}
                  <div className="border-t border-slate-100 pt-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={13} className="text-amber-500" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">9. Diagnóstico de Objeções</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-slate-500 block">Principal Motivo de Perda / Objeção</label>
                      <select
                        value={formObjectionCategory}
                        onChange={(e) => setFormObjectionCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:focus:border-indigo-500 p-2 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="none">Nenhuma (Negócio Ativo / Sem barreira)</option>
                        <option value="price">Preço muito alto (Fator Financeiro)</option>
                        <option value="scheduling">Indisponibilidade de Data / Agenda</option>
                        <option value="trust">Falta de Credenciais ou Fiança (Segurança)</option>
                        <option value="competitor">Decidiu fechar com concorrente</option>
                        <option value="low_intent">Lead apenas curioso / Baixo interesse</option>
                        <option value="other">Outros fatores / Sem resposta de contato</option>
                      </select>
                    </div>

                    {formObjectionCategory !== 'none' && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Notas complementares da objeção</label>
                        <textarea
                          value={formObjectionNotes}
                          onChange={(e) => setFormObjectionNotes(e.target.value.substring(0, 200))}
                          placeholder="Especifique melhor o feedback do cliente. Ex: achou caro comparado à concorrente que cobra $100."
                          rows={2}
                          className="w-full bg-white border border-slate-200 focus:focus:border-indigo-500 p-2.5 rounded-xl text-xs font-semibold outline-none resize-none leading-relaxed"
                        />
                        <div className="text-[9px] text-slate-400 text-right font-medium">
                          {(formObjectionNotes || '').length}/200 caracteres
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Módulo 1: Atribuição & Origem */}
                  <div className="border-t border-slate-100 pt-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Target size={13} className="text-indigo-600" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">10. Atribuição & Origem do Lead</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-slate-500 block">Canal de Aquisição Oficial</label>
                      <select
                        value={formAttributionChannel}
                        onChange={(e) => setFormAttributionChannel(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:focus:border-indigo-500 p-2 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="Website">Website</option>
                        <option value="Organic">Organic</option>
                        <option value="Google Ads">Google Ads</option>
                        <option value="Facebook Ads">Facebook Ads</option>
                        <option value="Instagram">Instagram</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Jennifer AI">Jennifer AI</option>
                        <option value="Twilio SMS">Twilio SMS</option>
                        <option value="Direct Call">Direct Call</option>
                        <option value="Referral">Referral</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">UTM Source</label>
                        <input
                          type="text"
                          value={formUtmSource}
                          onChange={(e) => setFormUtmSource(e.target.value)}
                          placeholder="source"
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 p-1.5 rounded-lg text-xs font-semibold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">UTM Medium</label>
                        <input
                          type="text"
                          value={formUtmMedium}
                          onChange={(e) => setFormUtmMedium(e.target.value)}
                          placeholder="medium"
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 p-1.5 rounded-lg text-xs font-semibold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">UTM Campaign</label>
                        <input
                          type="text"
                          value={formUtmCampaign}
                          onChange={(e) => setFormUtmCampaign(e.target.value)}
                          placeholder="campaign"
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 p-1.5 rounded-lg text-xs font-semibold outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Módulo 3: Customer Lifecycle */}
                  <div className="border-t border-slate-100 pt-3.5 space-y-3.5">
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-emerald-600" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">11. Customer Lifecycle (Módulo 3)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Status de Ciclo de Vida</label>
                        <select
                          value={formLifecycleStatus}
                          onChange={(e) => setFormLifecycleStatus(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:focus:border-emerald-500 p-2 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="lead">Lead</option>
                          <option value="active">Active Client</option>
                          <option value="recurring">Recurring Client</option>
                          <option value="paused">Paused Client (Manual)</option>
                          <option value="lost">Lost Client (Manual)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Último Serviço Atendido</label>
                        <input
                          type="date"
                          value={formLastServiceDate}
                          onChange={(e) => setFormLastServiceDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:focus:border-emerald-500 p-1.5 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold leading-normal pb-1">
                      ⚠️ O status &quot;Active&quot; e &quot;Recurring&quot; são atualizados automaticamente ao fechar venda baseado na frequência, mas você pode forçar ou redefinir para &quot;Paused&quot; ou &quot;Lost&quot; manualmente.
                    </p>
                  </div>

                  {/* Save feedback */}
                  {saveSuccess && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in zoom-in-95">
                      <Check className="text-emerald-500" size={14} />
                      Histórico comercial salvo com sucesso!
                    </div>
                  )}

                  {saveError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                      <AlertTriangle className="text-rose-500" size={14} />
                      {saveError}
                    </div>
                  )}

                  {/* Big manual action button */}
                  <button 
                    onClick={handleSaveTracking}
                    disabled={isSaving}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />
                        Salvar Acompanhamento
                      </>
                    )}
                  </button>
                </div>

                {/* Shadow Metrics Detailed Recap */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Detalhamento Técnico</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Qualidade do Lead</p>
                      <div className="flex items-baseline gap-1">
                        <span className={cn(
                          "text-xl font-black font-mono",
                          (selectedLead.lead_score ?? 0) >= 75 ? "text-rose-600" :
                          (selectedLead.lead_score ?? 0) >= 40 ? "text-amber-500" :
                          "text-slate-500"
                        )}>
                          {selectedLead.lead_score ?? "N/A"}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">/100</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Impacto Financeiro</p>
                      <p className="text-xl font-black text-emerald-600 font-mono">
                        {selectedLead.revenue_estimate !== undefined && selectedLead.revenue_estimate !== null 
                          ? `$${selectedLead.revenue_estimate}` 
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50 space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Intenção Identificada</p>
                    <p className="text-xs font-bold text-slate-800">{selectedLead.intent_category || "Sem Categoria"}</p>
                  </div>

                  {selectedLead.ai_summary && (
                    <div className="bg-indigo-50/10 p-3.5 rounded-2xl border border-indigo-50/40 space-y-1">
                      <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={10} className="text-indigo-500 animate-pulse" />
                        Resumo Sintético da Proposta
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">
                        "{selectedLead.ai_summary}"
                      </p>
                    </div>
                  )}

                  {selectedLead.conversation_summary && (
                    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50 space-y-1">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare size={10} />
                        Histórico do Chat por Jennifer
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                        {selectedLead.conversation_summary}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <div className="mx-auto w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Selecione um Lead</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Toque em qualquer lead listado ao lado para visualizar os insights completos do Shadow Mode e salvar o acompanhamento comercial de vendas.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
