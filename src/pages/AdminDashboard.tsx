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
import TeamManager from './admin/TeamManager';
import CustomersManager from './admin/CustomersManager';
import CommercialCenter from './admin/CommercialCenter';
import ScheduleManager from './admin/ScheduleManager';

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
    { label: 'New Leads', value: leads?.filter(l => l.status === 'new')?.length || 0, icon: Users, color: 'text-accent bg-accent-soft' },
    { label: 'Scheduled', value: leads?.filter(l => l.status === 'scheduled')?.length || 0, icon: Calendar, color: 'text-green-600 bg-green-50' },
    { label: 'Completed', value: leads?.filter(l => l.status === 'completed')?.length || 0, icon: CheckCircle2, color: 'text-purple-600 bg-purple-50' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-[2px]"
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
          onLogout={onLogout}
          hasError={!!leadsError}
        />

        <div className="flex-grow overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Routes>
            <Route index element={<Overview leads={leads || []} isLoading={isLoading} />} />
            <Route path="leads" element={<LeadsManager auth={auth} />} />
            <Route path="schedule" element={<ScheduleManager />} />
            <Route path="commercial" element={<CommercialCenter leads={leads || []} isLoading={isLoading} auth={auth} />} />
            <Route path="customers" element={<CustomersManager />} />
            <Route path="gallery" element={<GalleryManager auth={auth} />} />
            <Route path="reviews" element={<ReviewManager auth={auth} />} />
            <Route path="settings" element={<SettingsManager />} />
            <Route path="team" element={<TeamManager />} />
          </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}
