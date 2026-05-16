import { Customer, Lead } from '../../../types';
import { User, Phone, Mail, MapPin, Calendar, Hash, ShieldCheck, ArrowLeft, Clock, Tags, FileText, Info, Save, Edit2, X, History as HistoryIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc, serverTimestamp, query, collection, where, getDocs, limit, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseReady } from '../../../lib/firebase';
import { useState } from 'react';
import CustomerTimeline from './CustomerTimeline';

interface CustomerIdentityProps {
  customer: Customer;
  onBack: () => void;
}

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const isValidEmail = (email: string) => {
  if (!email) return true; // Optional but must be valid if provided
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function CustomerIdentity({ customer, onBack }: CustomerIdentityProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Administrative state
  const [notes, setNotes] = useState(customer.notes || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(customer.status);

  // Contact state (Step 6B)
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email || '');
  const [address, setAddress] = useState(customer.address || '');
  const [city, setCity] = useState(customer.city || '');
  const [zipCode, setZipCode] = useState(customer.zip_code || '');

  const { data: originalLead, isLoading: isLoadingLead } = useQuery<Lead | null>({
    queryKey: ['original-lead', customer.leadId],
    queryFn: async () => {
      if (!customer.leadId || !isFirebaseReady()) return null;
      try {
        const leadDoc = await getDoc(doc(db, 'leads', String(customer.leadId)));
        if (leadDoc.exists()) {
          return { id: leadDoc.id, ...leadDoc.data() } as Lead;
        }
      } catch (err) {
        console.error('Error fetching original lead:', err);
      }
      return null;
    },
    enabled: !!customer.leadId,
    retry: false
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isFirebaseReady()) throw new Error('Firebase not initialized');

      // 1. Validations
      if (!name.trim()) throw new Error('Name is required.');
      if (!phone.trim()) throw new Error('Phone is required.');
      
      const normalized = normalizePhone(phone);
      if (normalized.length < 10) throw new Error('Phone must have at least 10 digits.');

      if (email && !isValidEmail(email)) throw new Error('Invalid email format.');

      // 2. Duplicate Check
      const customersRef = collection(db, 'customers');

      // Check by Phone
      const qPhone = query(customersRef, where('phone', '==', phone), limit(1));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty && snapPhone.docs[0].id !== customer.id) {
        throw new Error(`Another customer already exists with this phone number: ${phone}`);
      }

      // Check by Email
      if (email.trim()) {
        const lowerEmail = email.trim().toLowerCase();
        const qEmail = query(customersRef, where('email', '==', lowerEmail), limit(1));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty && snapEmail.docs[0].id !== customer.id) {
          throw new Error(`Another customer already exists with this email: ${lowerEmail}`);
        }
      }

      // 3. Update Firestore
      const isNotesChanged = notes !== (customer.notes || '');
      const isStatusChanged = status !== customer.status;
      const isContactChanged = 
        name.trim() !== customer.name || 
        phone.trim() !== customer.phone || 
        email.trim().toLowerCase() !== (customer.email || '') ||
        address.trim() !== (customer.address || '') ||
        city.trim() !== (customer.city || '') ||
        zipCode.trim() !== (customer.zip_code || '');

      const docRef = doc(db, 'customers', customer.id);
      await updateDoc(docRef, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        city: city.trim(),
        zip_code: zipCode.trim(),
        notes,
        status,
        updatedAt: serverTimestamp()
      });

      // Step 7B: Timeline Events
      const registerEvent = async (type: string, title: string, description: string) => {
        try {
          const timelineRef = collection(db, 'customers', customer.id, 'timeline');
          await addDoc(timelineRef, {
            type,
            title,
            description,
            customerId: customer.id,
            createdAt: serverTimestamp(),
            createdBy: 'Admin System'
          });
        } catch (e) {
          console.warn('Timeline event failed:', e);
        }
      };

      if (isContactChanged) await registerEvent('customer_updated', 'Contact info updated', 'Customer profile details were modified.');
      if (isStatusChanged) await registerEvent('status_changed', 'Status changed', `Customer status set to ${status}.`);
      if (isNotesChanged) await registerEvent('notes_updated', 'Admin notes updated', 'Administrative notes were modified.');
    },
    onSuccess: () => {
      alert('Changes saved successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (err: any) => {
      if (err.message && (err.message.includes('required') || err.message.includes('digits') || err.message.includes('format') || err.message.includes('exists'))) {
        alert(err.message);
        return;
      }
      handleFirestoreError(err, OperationType.UPDATE, `customers/${customer.id}`);
    }
  });

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const sections = [
    {
      title: 'Contact Information',
      icon: Phone,
      items: [
        { 
          label: 'Name', 
          value: name, 
          icon: User,
          isEditable: true,
          onChange: (val: string) => setName(val)
        },
        { 
          label: 'Phone', 
          value: phone, 
          icon: Phone,
          isEditable: true,
          onChange: (val: string) => setPhone(val)
        },
        { 
          label: 'Email', 
          value: email || 'Not provided', 
          icon: Mail,
          isEditable: true,
          onChange: (val: string) => setEmail(val)
        },
      ]
    },
    {
      title: 'Location Details',
      icon: MapPin,
      items: [
        { 
          label: 'Address', 
          value: address || 'Not provided', 
          icon: MapPin,
          isEditable: true,
          onChange: (val: string) => setAddress(val)
        },
        { 
          label: 'City', 
          value: city || 'Not provided', 
          icon: MapPin,
          isEditable: true,
          onChange: (val: string) => setCity(val)
        },
        { 
          label: 'Zip Code', 
          value: zipCode || 'Not provided', 
          icon: Hash,
          isEditable: true,
          onChange: (val: string) => setZipCode(val)
        },
      ]
    },
    {
      title: 'System Metadata',
      icon: ShieldCheck,
      items: [
        { label: 'Original Lead ID', value: customer.leadId || 'Direct Entry', icon: Tags },
        { label: 'Status', value: customer.status, icon: ShieldCheck, isStatus: true },
        { label: 'Created At', value: formatDate(customer.createdAt), icon: Calendar },
        { label: 'Last Updated', value: formatDate(customer.updatedAt), icon: Clock },
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="font-bold text-2xl text-slate-900">{customer.name}</h3>
          <p className="text-sm text-slate-500">Identity Profile • {isEditing ? 'Editing Mode' : 'Read Only'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
          >
            <Edit2 size={16} /> Edit Admin Info
          </button>
        ) : (
          <>
            <button 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setNotes(customer.notes || '');
                setStatus(customer.status);
                setName(customer.name);
                setPhone(customer.phone);
                setEmail(customer.email || '');
                setAddress(customer.address || '');
                setCity(customer.city || '');
                setZipCode(customer.zip_code || '');
              }}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              <X size={16} /> Cancel
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <section.icon size={16} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">{section.title}</h4>
            </div>

            <div className="space-y-6">
              {section.items.map((item: any, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <item.icon size={10} /> {item.label}
                  </div>
                  {item.isStatus && isEditing ? (
                    <select 
                      className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  ) : item.isEditable && isEditing ? (
                    <input 
                      type="text"
                      className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      value={item.value === 'Not provided' ? '' : item.value}
                      onChange={(e) => item.onChange(e.target.value)}
                    />
                  ) : (
                    <div className={cn(
                      "text-sm font-medium text-slate-700 truncate",
                      item.isStatus && (
                        item.value === 'active' ? "text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit border border-green-100" : "text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full w-fit"
                      )
                    )}>
                      {item.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Notes Card */}
      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 uppercase tracking-widest text-[10px]">
          <Tags size={12} className="text-slate-400" /> Administrative Notes
        </h4>
        {isEditing ? (
          <textarea 
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
            placeholder="Add administrative notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        ) : (
          <p className="text-slate-500 text-sm whitespace-pre-wrap italic">
            {customer.notes || 'No administrative notes have been added yet for this customer.'}
          </p>
        )}
      </div>

      {/* Original Lead Data Section (Step 5) */}
      {customer.leadId ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900">Original Transition Lead</h4>
                <p className="text-xs text-slate-500">Historical data from the initial service request.</p>
              </div>
            </div>
          </div>

          {isLoadingLead ? (
            <div className="py-8 text-center text-slate-400 italic text-sm">Loading historical lead data...</div>
          ) : !originalLead ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
              <Info size={24} className="mx-auto mb-2 opacity-20" />
              Linked lead (ID: {customer.leadId}) could not be found. It may have been archived or deleted.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Requested</p>
                <p className="text-sm font-bold text-slate-700">{originalLead.service_type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Home Size</p>
                <p className="text-sm font-bold text-slate-700">{originalLead.bedrooms} Bed / {originalLead.bathrooms} Bath</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Status</p>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {originalLead.status}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion Date</p>
                <p className="text-sm font-bold text-slate-700">{formatDate(customer.createdAt)}</p>
              </div>
              {originalLead.message && (
                <div className="col-span-full pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Initial Message/Notes</p>
                  <p className="text-xs text-slate-500 italic">"{originalLead.message}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center justify-center gap-3 text-slate-400">
          <Info size={16} />
          <p className="text-xs font-medium italic">This customer was created directly without a transition lead.</p>
        </div>
      )}

      {/* Customer Timeline Section (Step 7A) */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <HistoryIcon size={20} />
          </div>
          <div>
            <h4 className="font-bold text-lg text-slate-900">Customer Timeline</h4>
            <p className="text-xs text-slate-500">Operational history and major events.</p>
          </div>
        </div>
        <CustomerTimeline customerId={customer.id} />
      </div>

      <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-bold text-lg">Operational History</p>
          <p className="text-blue-100 text-sm">Total cleanings completed: <span className="font-black underline">{customer.totalBookings || 0}</span></p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
          <ShieldCheck size={14} /> Security: Profile Verified
        </div>
      </div>
    </div>
  );
}
