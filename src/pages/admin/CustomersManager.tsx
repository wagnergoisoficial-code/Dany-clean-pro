import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Filter, ShieldCheck, Mail, Phone, MapPin, ChevronRight, ArrowUpDown } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseReady } from '../../lib/firebase';
import { Customer } from '../../types';
import { cn } from '../../lib/utils';
import CustomerIdentity from './components/CustomerIdentity';

export default function CustomersManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading, error } = useQuery<Customer[]>({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      try {
        if (isFirebaseReady()) {
          const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as any)) as Customer[];
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'customers');
      }
      return [];
    },
    retry: false
  });

  const filteredCustomers = (customers || [])
    .filter(c => {
      // 1. Status Filter
      if (filter !== 'all' && c.status !== filter) return false;

      // 2. Search Term Filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          (c.city && c.city.toLowerCase().includes(term));
        
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 3. Sorting
      const dateA = a.createdAt && (a.createdAt as any).toDate ? (a.createdAt as any).toDate().getTime() : 
                    a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt && (b.createdAt as any).toDate ? (b.createdAt as any).toDate().getTime() : 
                    b.createdAt ? new Date(b.createdAt).getTime() : 0;
      
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  if (selectedCustomer) {
    return (
      <div className="p-4 sm:p-8">
        <CustomerIdentity 
          customer={selectedCustomer} 
          onBack={() => setSelectedCustomer(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
      <div className="bg-surface border border-rule p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h3 className="font-bold text-xl sm:text-2xl text-ink flex items-center gap-2">
              Customer Base 
              <span className="flex items-center gap-1 text-label-sm text-green-600 bg-green-50 px-2 py-1 uppercase border border-green-100">
                <ShieldCheck size={10} /> Read Only Mode
              </span>
            </h3>
            <p className="text-sm text-ink-muted">
              Showing {filteredCustomers.length} of {customers?.length || 0} customers
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
              <input 
                type="text" 
                placeholder="Search name, phone, city..." 
                className="pl-10 pr-4 py-2 bg-surface-low border border-rule text-sm focus:ring-2 focus:ring-accent outline-none w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort Toggle */}
            <button 
              onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-rule text-xs font-bold text-ink-muted hover:bg-surface-low transition-all"
            >
              <ArrowUpDown size={14} />
              {sortBy === 'newest' ? 'Newest' : 'Oldest'}
            </button>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-surface-low p-1 border border-rule overflow-x-auto no-scrollbar">
              {['all', 'active', 'inactive'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-label-sm uppercase transition-all whitespace-nowrap",
                    filter === f ? "bg-surface text-accent border border-rule": "text-ink-faint hover:text-ink-muted"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-ink-faint italic">
            Loading customer records...
          </div>
        ) : error ? (
          <div className="py-20 text-center bg-red-50 border border-red-100 text-red-600 p-6">
            <p className="font-bold mb-1">Access Restricted or Collection Missing</p>
            <p className="text-sm">The customer database is currently initializing. (Status: 403 or Collection Empty)</p>
          </div>
        ) : !filteredCustomers || filteredCustomers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-surface-low flex items-center justify-center text-ink-faint mb-6 border border-rule">
              <Users size={40} />
            </div>
            <h4 className="text-xl font-bold text-ink mb-2">No Customers Found</h4>
            <p className="text-ink-muted max-w-md mx-auto italic">
              When you convert leads into customers, they will appear here. The system is ready to receive your first records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left min-w-[800px] sm:min-w-full">
              <thead className="bg-surface-low text-label-sm text-ink-faint uppercase">
                <tr>
                  <th className="px-4 sm:px-6 py-4">Customer</th>
                  <th className="px-4 sm:px-6 py-4">Contact Info</th>
                  <th className="px-4 sm:px-6 py-4">Location</th>
                  <th className="px-4 sm:px-6 py-4">Status</th>
                  <th className="px-4 sm:px-6 py-4">Created At</th>
                  <th className="px-4 sm:px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-surface-low/50 transition-colors group">
                    <td className="px-4 sm:px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-accent-soft text-accent flex items-center justify-center font-bold text-xs">
                           {customer.name.charAt(0)}
                         </div>
                         <p className="font-bold text-ink text-sm group-hover:text-accent transition-colors">{customer.name}</p>
                       </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 space-y-1">
                       <p className="text-xs text-ink-muted flex items-center gap-1.5 font-medium">
                         <Phone size={12} className="text-ink-faint" /> {customer.phone}
                       </p>
                       <p className="text-[10px] text-ink-faint flex items-center gap-1.5">
                         <Mail size={12} className="text-ink-faint" /> {customer.email}
                       </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                       <p className="text-xs text-ink-muted font-medium">{customer.city}</p>
                       <p className="text-[10px] text-ink-faint flex items-center gap-1">
                         <MapPin size={10} /> {customer.zip_code}
                       </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                       <span className={cn(
                         "px-3 py-1 text-label-sm uppercase",
                         customer.status === 'active' ? "bg-green-100 text-green-700 border border-green-200": "bg-surface-mid text-ink-muted"
                       )}>
                         {customer.status}
                       </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-[10px] text-ink-faint font-mono">
                      {(() => {
                        const date = customer.createdAt && (customer.createdAt as any).toDate ? (customer.createdAt as any).toDate() : 
                                     customer.createdAt ? new Date(customer.createdAt) : null;
                        return date ? date.toLocaleDateString() : 'N/A';
                      })()}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 bg-surface-low text-ink-faint hover:text-accent hover:bg-accent-soft transition-all flex items-center justify-center gap-1 text-[10px] font-bold"
                      >
                        Details <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
