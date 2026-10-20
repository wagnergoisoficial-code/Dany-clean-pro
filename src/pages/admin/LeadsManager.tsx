import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, UserCheck, CheckCircle2, Search, ArrowUpDown, Filter, Users, CalendarClock, X, Trash2, AlertCircle } from 'lucide-react';
import { remove as removeDoc } from '../../lib/data';
import { Lead, AuthState, Customer } from '../../types';
import { cn } from '../../lib/utils';
import { collection, query, orderBy, getDocs, doc, updateDoc, where, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseReady } from '../../lib/firebase';

interface LeadsManagerProps {
  auth: AuthState;
}

export default function LeadsManager({ auth }: LeadsManagerProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [expandedLeadId, setExpandedLeadId] = useState<string | number | null>(null);
  // A delete that fails must say so on the page, not only in the console.
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Detect production environment
  const isProd = window.location.hostname === 'danycleanpro.com' || 
                 window.location.hostname === 'www.danycleanpro.com' ||
                 window.location.hostname.includes('netlify.app');

  const { data: leads, isLoading, error: leadsError } = useQuery<Lead[]>({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      let firestoreLeads: Lead[] = [];
      let apiLeads: Lead[] = [];
      let firestoreSuccess = false;

      // 1. Always prioritize direct Firestore for Lead Management if ready
      try {
        if (isFirebaseReady()) {
          console.log('LeadsManager: Attempting Firestore fetch...');
          const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          firestoreLeads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as any)) as Lead[];
          firestoreSuccess = true;
          console.log(`LeadsManager: Firestore fetch successful (${firestoreLeads.length} leads)`);
        }
      } catch (err) {
        console.warn('LeadsManager: Direct Firestore fetch failed:', err);
      }

      // 2. Fallback or Supplementary API fetch
      // If Firestore failed OR if we want to ensure we don't miss SQLite leads during transition
      if (!firestoreSuccess || firestoreLeads.length === 0) {
        try {
          console.log('LeadsManager: Attempting API fallback fetch...');
          const response = await fetch('/api/admin/leads', {
            headers: {
              'Authorization': `Bearer ${auth.token}`
            }
          });
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              apiLeads = await response.json();
              console.log(`LeadsManager: API fetch successful (${apiLeads.length} leads)`);
            }
          }
        } catch (err) {
          console.warn('LeadsManager: API fallback fetch failed:', err);
          if (!firestoreSuccess) {
            handleFirestoreError(err, OperationType.LIST, 'leads');
          }
        }
      }

      // 3. Merging (Bias towards Firestore)
      // If we have Firestore data, use it. If not, use API.
      return firestoreSuccess && firestoreLeads.length > 0 ? firestoreLeads : apiLeads;
    },
    retry: false
  });

  // The assistant can hold a slot but never commit one; this is where a person decides.
  const decideBooking = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'confirm' | 'release' }) => {
      const response = await fetch('/api/confirm-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id, action }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error || 'Could not update the calendar');
      }
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-leads'] }),
    onError: (err: any) => alert(`Booking not updated: ${err.message}`),
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      // 1. Try Firestore Update first if it exists there
      try {
        if (isFirebaseReady()) {
          const docRef = doc(db, 'leads', id);
          await updateDoc(docRef, { status });
          return;
        }
      } catch (err) {
        console.warn('Firestore update failed, attempting API fallback');
      }

      // 2. Try API/SQLite update
      try {
        const response = await fetch(`/api/admin/leads/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({ status })
        });
        if (response.ok) return;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `leads/${id}`);
      }
      
      throw new Error('Failed to update lead status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
    }
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      // Through the server, like every other write: deleting from the browser
      // depends on the Firestore rules agreeing, and those live in a console
      // this code cannot see.
      await removeDoc('leads', String(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      setDeleteError(null);
    },
    onError: (err: any) => setDeleteError(err?.message || 'Nao foi possivel apagar o lead.'),
  });

  const convertToCustomer = useMutation({
    mutationFn: async (lead: Lead) => {
      if (!isFirebaseReady()) throw new Error('Firebase not initialized');

      const customersRef = collection(db, 'customers');

      try {
        // 1. Check by Phone
        const qPhone = query(customersRef, where('phone', '==', lead.phone), limit(1));
        const snapPhone = await getDocs(qPhone);
        
        if (!snapPhone.empty) {
          throw new Error(`A customer with phone ${lead.phone} already exists.`);
        }

        // 2. Check by Email
        if (lead.email) {
          const qEmail = query(customersRef, where('email', '==', lead.email), limit(1));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            throw new Error(`A customer with email ${lead.email} already exists.`);
          }
        }

        // 3. Create Customer
        const customerData: Omit<Customer, 'id'> = {
          leadId: String(lead.id),
          name: lead.name,
          phone: lead.phone,
          email: lead.email || '',
          city: lead.city || '',
          zip_code: lead.zip_code || '',
          address: (lead as any).address || '', // Support address if exists in lead
          status: 'active',
          notes: '',
          totalBookings: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const newCustomer = await addDoc(customersRef, customerData);
        
        // Step 7B: Register Timeline Event
        try {
          const timelineRef = collection(db, 'customers', newCustomer.id, 'timeline');
          await addDoc(timelineRef, {
            type: 'converted_from_lead',
            title: 'Customer created from Lead',
            description: `This customer was automatically generated from lead ID ${lead.id}.`,
            customerId: newCustomer.id,
            relatedLeadId: String(lead.id),
            createdAt: serverTimestamp(),
            createdBy: 'Admin System'
          });
        } catch (timelineErr) {
          console.warn('Failed to register timeline event:', timelineErr);
        }

        return;
      } catch (err: any) {
        if (err.message.includes('already exists')) {
           alert(err.message);
           return;
        }
        handleFirestoreError(err, OperationType.WRITE, 'customers');
      }
    },
    onSuccess: () => {
      alert('Lead successfully converted to customer!');
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    }
  });

  const filteredLeads = (leads || [])
    .filter(l => {
      // 1. Status Filter
      if (filter !== 'all' && l.status !== filter) return false;

      // 2. Search Term Filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          l.name.toLowerCase().includes(term) ||
          (l.email && l.email.toLowerCase().includes(term)) ||
          l.phone.includes(term) ||
          (l.city && l.city.toLowerCase().includes(term));
        
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 3. Sorting
      const dateA = (a as any).createdAt && (a as any).createdAt.toDate ? (a as any).createdAt.toDate().getTime() : 
                    (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const dateB = (b as any).createdAt && (b as any).createdAt.toDate ? (b as any).createdAt.toDate().getTime() : 
                    (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-slate-900/[0.06] shadow-[var(--shadow-panel)] p-6 text-center text-slate-400 italic">
        Loading leads data...
      </div>
    );
  }

  if (leadsError) {
    return (
      <div className="bg-red-50 border border-red-100 p-8 text-center text-red-600">
        Error loading leads: {leadsError instanceof Error ? leadsError.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-900/[0.06] shadow-[var(--shadow-panel)] p-5 sm:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h3 className="font-sans text-[20px] font-bold tracking-[-0.02em] text-slate-900">Manage All Leads</h3>
          <p className="text-sm text-slate-500">
            Showing {filteredLeads.length} of {leads?.length || 0} leads
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative flex-grow sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search name, phone, city..." 
              className="pl-10 pr-4 py-2 rounded-lg bg-slate-50 ring-1 ring-slate-900/[0.05] text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort Toggle */}
          <button 
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center justify-center gap-2 px-3 h-9 bg-white rounded-lg ring-1 ring-slate-900/[0.07] text-[13px] font-semibold text-slate-500 hover:bg-slate-50 transition-all"
          >
            <ArrowUpDown size={14} />
            {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>

          {/* Status Filter (Dropdown on mobile, pills on desktop if space allows, but let's use a clean pill row) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-900/[0.07] overflow-x-auto no-scrollbar">
            {['all', 'new', 'contacted', 'scheduled', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-semibold transition-all whitespace-nowrap",
                  filter === f ? "bg-white text-blue-600 border border-slate-900/[0.07]": "text-slate-400 hover:text-slate-500"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto -mx-4 sm:mx-0">
          {deleteError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 mb-4 rounded-lg">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p className="text-sm">{deleteError}</p>
            </div>
          )}

          <table className="w-full text-left min-w-[800px] sm:min-w-full">
            <thead className="text-[11px] font-semibold text-slate-400">
              <tr>
                <th className="px-3 py-3 rounded-lg">Date</th>
                <th className="px-3 py-3 rounded-lg">Client</th>
                <th className="px-3 py-3 rounded-lg">Contact</th>
                <th className="px-3 py-3 rounded-lg">Location</th>
                <th className="px-3 py-3 rounded-lg">Details</th>
                <th className="px-3 py-3 rounded-lg">Status</th>
                <th className="px-3 py-3 rounded-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/[0.05]">
              {filteredLeads?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 italic">No leads found for this filter.</td></tr>
              ) : filteredLeads?.map((lead) => {
                const isExpanded = expandedLeadId === lead.id;
                
                return (
                  <React.Fragment key={lead.id}>
                    <tr 
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors cursor-pointer",
                        isExpanded ? "bg-slate-50/80": ""
                      )}
                      onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                    >
                      <td className="px-3 py-3 text-[12px] text-slate-400 tabular-nums rounded-lg">
                        {(() => {
                          const date = (lead as any).createdAt && (lead as any).createdAt.toDate ? (lead as any).createdAt.toDate() : 
                                       (lead as any).createdAt ? new Date((lead as any).createdAt) : null;
                          return date ? date.toLocaleDateString() : 'N/A';
                        })()}
                      </td>
                      <td className="px-3 py-3 rounded-lg">
                         <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                         <div className="flex flex-wrap items-center gap-1.5 mt-1">
                           <span className="text-label-sm text-slate-400 uppercase">{lead.service_type}</span>
                           {(lead as any).lead_score !== undefined && (lead as any).lead_score !== null && (
                             <span className={cn(
                               "text-[9px] font-bold px-1.5 py-0.5 font-mono",
                               (lead as any).lead_score >= 75 ? "bg-emerald-50 text-emerald-700 border border-emerald-100":
                               (lead as any).lead_score >= 40 ? "bg-amber-50 text-amber-700 border border-amber-100":
                               "bg-slate-50 text-slate-500 border border-slate-900/[0.07]"
                             )}>
                               Score: {(lead as any).lead_score}
                             </span>
                           )}
                           {(lead as any).intent_category && (
                             <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg">
                               {(lead as any).intent_category}
                             </span>
                           )}
                         </div>
                      </td>
                      <td className="px-3 py-3 rounded-lg">
                         <p className="text-xs font-medium text-slate-500">{lead.phone}</p>
                         <p className="text-[10px] text-slate-400">{lead.email || 'No email'}</p>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-slate-500 rounded-lg">
                        {lead.city || 'N/A'}, {lead.zip_code || ''}
                      </td>
                      <td className="px-3 py-3 rounded-lg">
                         <p className="text-[10px] text-slate-900 font-medium">
                           {lead.bedrooms}B / {lead.bathrooms}Ba
                         </p>
                         <div className="flex items-center gap-1.5 mt-0.5">
                           <p className="text-[10px] text-slate-400 italic line-clamp-1">"{lead.message || 'No initial message'}"</p>
                           {(lead as any).revenue_estimate !== undefined && (lead as any).revenue_estimate !== null && (
                             <span className="text-[9px] font-mono font-bold text-emerald-600 shrink-0 ml-1">
                               Est: ${(lead as any).revenue_estimate}
                             </span>
                           )}
                         </div>
                      </td>
                      <td className="px-3 py-3 rounded-lg" onClick={(e) => e.stopPropagation()}>
                         {(lead as any).booking?.status === 'pending' && (
                           <div className="mb-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                             <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                               <CalendarClock size={12} /> Held, needs your OK
                             </span>
                             <p className="text-body-sm text-slate-900 mt-1">
                               {new Date((lead as any).booking.start).toLocaleString('en-US', {
                                 weekday: 'short', month: 'short', day: 'numeric',
                                 hour: 'numeric', minute: '2-digit',
                               })}
                             </p>
                             <div className="flex items-center gap-2 mt-2">
                               <button
                                 type="button"
                                 disabled={decideBooking.isPending}
                                 onClick={() => decideBooking.mutate({ id: String(lead.id), action: 'confirm' })}
                                 className="inline-flex items-center gap-1 bg-ink text-white text-[11px] font-semibold px-3 py-1.5 hover:bg-blue-600 transition-colors disabled:opacity-50 rounded-lg"
                               >
                                 <CheckCircle2 size={11} /> Confirm
                               </button>
                               <button
                                 type="button"
                                 disabled={decideBooking.isPending}
                                 onClick={() => {
                                   if (confirm('Release this time? The slot is freed and the customer is not booked.')) {
                                     decideBooking.mutate({ id: String(lead.id), action: 'release' });
                                   }
                                 }}
                                 className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
                               >
                                 <X size={11} /> Release
                               </button>
                             </div>
                           </div>
                         )}
                         {(lead as any).booking?.status === 'confirmed' && (
                           <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-green-700">
                             <CheckCircle2 size={12} /> Booked{' '}
                             {new Date((lead as any).booking.start).toLocaleString('en-US', {
                               month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                             })}
                           </p>
                         )}
                         <select 
                           className={cn(
                             "text-[11px] font-semibold border border-slate-900/[0.07] px-2 py-1 outline-none",
                             lead.status === 'new' ? "bg-blue-50 text-blue-800 border-accent/20":
                             lead.status === 'scheduled' || lead.status === 'estimate_scheduled' ? "bg-green-50 text-green-700 border-green-100":
                             lead.status === 'awaiting_photos' ? "bg-amber-50 text-amber-700 border-amber-100":
                             "bg-white text-slate-500"
                           )}
                           value={lead.status}
                           onChange={(e) => updateLeadStatus.mutate({ id: String(lead.id), status: e.target.value })}
                         >
                           <option value="new">New Lead</option>
                           <option value="inquiring">Inquiring</option>
                           <option value="awaiting_photos">Awaiting Photos</option>
                           <option value="estimate_requested">Estimate Requested</option>
                           <option value="estimate_scheduled">Estimate Scheduled</option>
                           <option value="followup_needed">Follow-Up Needed</option>
                           <option value="quote_sent">Quote Sent</option>
                           <option value="booked">Booked</option>
                           <option value="closed">Closed</option>
                           <option value="cancelled">Cancelled</option>
                         </select>
                      </td>
                      <td className="px-3 py-3 rounded-lg" onClick={(e) => e.stopPropagation()}>
                         <div className="flex items-center gap-2">
                           <a 
                             href={`tel:${lead.phone}`}
                             className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center"
                             title="Call Client"
                           >
                             <ExternalLink size={14} />
                           </a>
                           <button 
                             onClick={() => { if(confirm(`Convert ${lead.name} to a regular customer?`)) convertToCustomer.mutate(lead) }}
                             className="p-2 bg-green-50 text-green-600 hover:bg-green-100 transition-all flex items-center justify-center"
                             title="Convert to Customer"
                             disabled={convertToCustomer.isPending}
                           >
                             {convertToCustomer.isPending ? <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : <UserCheck size={14} />}
                           </button>
                           <button
                             onClick={() => {
                               // Naming the lead in the question, because the
                               // rows look alike and this cannot be undone.
                               if (confirm(`Apagar o lead de ${lead.name || 'sem nome'} (${lead.phone || 'sem telefone'})? Nao da para desfazer.`)) {
                                 deleteLead.mutate(String(lead.id));
                               }
                             }}
                             className="p-2 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center disabled:opacity-50"
                             title="Apagar lead"
                             disabled={deleteLead.isPending}
                           >
                             {deleteLead.isPending && deleteLead.variables === String(lead.id)
                               ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                               : <Trash2 size={14} />}
                           </button>
                         </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-900/[0.07]">
                        <td colSpan={7} className="px-6 py-6 rounded-lg" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-slate-600">
                            {/* Column 1: Detailed Metadata Info */}
                            <div className="bg-white p-5 border border-slate-900/[0.07] space-y-4">
                              <h4 className="text-[12px] font-semibold text-slate-400">Lead Metadata & CRM Specs</h4>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p className="text-slate-400 font-medium">Property Type</p>
                                  <p className="font-bold text-slate-600">{lead.property_type || "House / Apartment"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-medium">Detailed Address</p>
                                  <p className="font-bold text-slate-600">{lead.address || "Not specified"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-medium">Estimate Style Preference</p>
                                  <p className="font-bold text-slate-600 text-blue-600 font-mono">{lead.estimate_option || "Pending option"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-medium">Estimated Price Range</p>
                                  <p className="font-bold text-green-600 text-sm font-mono">{lead.estimated_price || "TBD (No Price Given)"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-medium">Preferred Time Range</p>
                                  <p className="font-bold text-slate-600">{lead.preferred_time || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-medium">Initial Contact Message</p>
                                  <p className="font-medium text-slate-500 italic">"{lead.message || "Hi, I would like a cleaning quote."}"</p>
                                </div>
                              </div>

                              {/* SHADOW MODE INSIGHTS SECTION */}
                              {((lead as any).lead_score !== undefined && (lead as any).lead_score !== null || (lead as any).ai_summary) && (
                                <div className="pt-4 border-t border-slate-900/[0.07] space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-[12px] font-semibold text-indigo-600 flex items-center gap-1.5">
                                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                      Shadow Mode Insights
                                    </h4>
                                    <span className="text-label-sm bg-indigo-50 text-indigo-700 px-2.5 py-0.5 uppercase font-mono border border-indigo-100 rounded-lg">
                                      PASSIVO (READ-ONLY)
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 p-2.5 border border-slate-900/[0.07]">
                                      <p className="text-label-sm text-slate-400 uppercase leading-none mb-1">Lead Score</p>
                                      <div className="flex items-baseline gap-1">
                                        <span className={cn(
                                          "text-lg font-bold font-mono",
                                          (lead as any).lead_score >= 75 ? "text-emerald-600":
                                          (lead as any).lead_score >= 40 ? "text-amber-500":
                                          "text-rose-500"
                                        )}>
                                          {(lead as any).lead_score ?? "N/A"}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">/100</span>
                                      </div>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 border border-slate-900/[0.07]">
                                      <p className="text-label-sm text-slate-400 uppercase leading-none mb-1">Intent Category</p>
                                      <p className="font-bold text-slate-600 truncate mt-1 text-xs">{(lead as any).intent_category || "N/A"}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 border border-slate-900/[0.07]">
                                      <p className="text-label-sm text-slate-400 uppercase leading-none mb-1">Revenue Est.</p>
                                      <p className="font-mono font-bold text-emerald-600 mt-1 text-sm">
                                        {(lead as any).revenue_estimate !== undefined && (lead as any).revenue_estimate !== null 
                                          ? `$${(lead as any).revenue_estimate}` 
                                          : "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                  {(lead as any).ai_summary && (
                                    <div className="bg-indigo-50/20 p-3 border border-indigo-50/50">
                                      <p className="text-label-sm text-indigo-500 uppercase mb-1">AI Direct Summary</p>
                                      <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">
                                        {(lead as any).ai_summary}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {lead.conversation_summary && (
                                <div className="pt-4 border-t border-slate-900/[0.07]">
                                  <p className="text-[11px] font-semibold text-slate-400 mb-1.5">AI Automated Relationship Summary</p>
                                  <div className="p-3 bg-slate-50/60 text-xs text-slate-500 leading-relaxed italic">
                                    {lead.conversation_summary}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Column 2: Conversational Chat logs and Assistant Transcripts */}
                            <div className="bg-ink text-white/80 p-5 flex flex-col h-[320px] overflow-hidden">
                              <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3 shrink-0">
                                <h4 className="font-mono text-label-sm text-slate-400 uppercase">SMS AI Receptionist Transcript</h4>
                                <span className="bg-green-500/10 text-green-400 text-[9px] font-mono px-2 py-0.5 border border-green-500/20 rounded-lg">AGENT BOT</span>
                              </div>

                              <div className="flex-grow overflow-y-auto space-y-3 pr-1 text-xs scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                {lead.sms_history ? (
                                  lead.sms_history.split("\n").map((line: string, idx: number) => {
                                    if (!line.trim()) return null;
                                    const isClient = line.toLowerCase().startsWith("client:") || line.toLowerCase().startsWith("customer:");
                                    const cleanText = line.replace(/^(client|customer|assistant):\s*/i, "");
                                    
                                    return (
                                      <div key={idx} className={cn("flex flex-col max-w-[85%]", isClient ? "mr-auto items-start": "ml-auto items-end")}>
                                        <span className="text-[9px] text-slate-500 font-mono mb-0.5">{isClient ? "Client": "Dany Clean Pro AI"}</span>
                                        <div className={cn("p-2.5 text-xs leading-relaxed", isClient ? "bg-ink text-rule": "bg-blue-600 text-white")}>
                                          {cleanText}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-center text-slate-500 font-mono py-12 text-xs">
                                    No logged message events.
                                    <div className="mt-2 text-[10px] text-slate-500 bg-ink/40 p-2.5 max-w-sm mx-auto">
                                      As the client exchanges SMS messages with your n8n workflow, the database is auto-filled and conversations will log here.
                                    </div>
                                  </div>
                                )}

                                {lead.ai_reply && (
                                  <div className="flex flex-col ml-auto items-end max-w-[85%] border-t border-white/10 pt-3 mt-3 w-full">
                                    <span className="text-[9px] text-blue-600 font-mono mb-0.5">Most Recent Reply</span>
                                    <div className="p-2.5 bg-blue-600 text-white text-xs leading-relaxed">
                                      {lead.ai_reply}
                                    </div>
                                  </div>
                                ) || null}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
      </div>
    </div>
  );
}
