import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Calendar,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Lead, AuthState } from '../types';
import { cn } from '../lib/utils';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseReady } from '../lib/firebase';

import { useState } from 'react';
import AdminSidebar from './admin/layout/AdminSidebar';
import AdminTopbar from './admin/layout/AdminTopbar';
import Overview from './admin/Overview';
import LeadsManager from './admin/LeadsManager';
import GalleryManager from './admin/GalleryManager';
import ReviewManager from './admin/ReviewManager';
import SettingsManager from './admin/SettingsManager';
import CustomersManager from './admin/CustomersManager';
import CommercialCenter from './admin/CommercialCenter';

export default function AdminDashboard({ auth, fbUser, onLogout }: { auth: AuthState, fbUser?: FirebaseUser | null, onLogout: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect production environment
  const isProd = window.location.hostname === 'danycleanpro.com' || 
                 window.location.hostname === 'www.danycleanpro.com' ||
                 window.location.hostname.includes('netlify.app');

  const { data: leads, isLoading, isError, error: leadsError } = useQuery<Lead[]>({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      let firestoreLeads: Lead[] = [];
      let apiLeads: Lead[] = [];
      let firestoreSuccess = false;

      // 1. Always prioritize direct Firestore for Lead Management if ready
      try {
        if (isFirebaseReady()) {
          console.log('AdminDashboard: Attempting Firestore fetch...');
          const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          firestoreLeads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as any)) as Lead[];
          firestoreSuccess = true;
          console.log(`AdminDashboard: Firestore fetch successful (${firestoreLeads.length} leads)`);
        }
      } catch (err) {
        console.warn('AdminDashboard: Direct Firestore fetch failed:', err);
      }

      // 2. Fallback or Supplementary API fetch
      if (!firestoreSuccess || firestoreLeads.length === 0) {
        try {
          console.log('AdminDashboard: Attempting API fallback fetch...');
          const response = await fetch('/api/admin/leads', {
            headers: {
              'Authorization': `Bearer ${auth.token}`
            }
          });
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              apiLeads = await response.json();
              console.log(`AdminDashboard: API fetch successful (${apiLeads.length} leads)`);
            }
          }
        } catch (err) {
          console.warn('AdminDashboard: API fallback fetch failed:', err);
        }
      }

      // 3. Merging (Bias towards Firestore)
      return firestoreSuccess && firestoreLeads.length > 0 ? firestoreLeads : apiLeads;
    },
    retry: false
  });

  const stats = [
    { label: 'New Leads', value: leads?.filter(l => l.status === 'new')?.length || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Scheduled', value: leads?.filter(l => l.status === 'scheduled')?.length || 0, icon: Calendar, color: 'text-green-600 bg-green-50' },
    { label: 'Completed', value: leads?.filter(l => l.status === 'completed')?.length || 0, icon: CheckCircle2, color: 'text-purple-600 bg-purple-50' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <AdminSidebar 
        onLogout={onLogout} 
      />
      
      {isMobileMenuOpen && (
        <AdminSidebar 
          isMobile 
          onClose={() => setIsMobileMenuOpen(false)} 
          onLogout={onLogout} 
        />
      )}

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-w-0">
        <AdminTopbar 
          auth={auth} 
          fbUser={fbUser} 
          onMenuClick={() => setIsMobileMenuOpen(true)}
          hasError={!!leadsError}
        />

        <div className="p-4 sm:p-8 overflow-y-auto">
          {/* Diagnostic Banner */}
          {(process.env.NODE_ENV !== 'production' || fbUser) && (
            <div className="mb-4 p-4 bg-slate-100 rounded-xl text-[10px] font-mono whitespace-pre-wrap break-all border border-slate-200">
              CRM OPERATIONAL NODE v1.0 | 
              FB User: {fbUser ? `${fbUser.email}` : 'NULL'} | 
              API Status: {leadsError ? 'ERROR' : 'OK'}
            </div>
          )}

          {!fbUser && (
            <div className="mb-8 bg-blue-50 border border-blue-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4 text-blue-900">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 shrink-0">
                  <Globe size={24} />
                </div>
                <div>
                  <h4 className="font-bold whitespace-nowrap">Connect Your Google Account</h4>
                  <p className="text-sm text-blue-700">To save settings and manage real-time data, you need to be authenticated via Firebase.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/login')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all shrink-0 w-full md:w-auto"
              >
                Connect Now
              </button>
            </div>
          )}

          <Routes>
            <Route index element={<Overview leads={leads || []} isLoading={isLoading} />} />
            <Route path="leads" element={<LeadsManager auth={auth} />} />
            <Route path="commercial" element={<CommercialCenter leads={leads || []} isLoading={isLoading} auth={auth} />} />
            <Route path="customers" element={<CustomersManager />} />
            <Route path="gallery" element={<GalleryManager auth={auth} />} />
            <Route path="reviews" element={<ReviewManager auth={auth} />} />
            <Route path="settings" element={<SettingsManager />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
