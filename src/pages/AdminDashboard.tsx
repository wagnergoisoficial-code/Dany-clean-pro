import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Star,
  User as UserIcon,
  Globe,
  Camera
} from 'lucide-react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Lead, AuthState, Review, GalleryItem } from '../types';
import { cn } from '../lib/utils';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import LogoUpload from '../components/ui/LogoUpload';
import HeroCoverUploader from '../components/hero/HeroCoverUploader';

import { useState } from 'react';

export default function AdminDashboard({ auth, fbUser, onLogout }: { auth: AuthState, fbUser?: FirebaseUser | null, onLogout: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: leads, isLoading, isError, error: leadsError } = useQuery<Lead[]>({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      // Priority 1: API
      try {
        const response = await fetch('/api/admin/leads', {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        });
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
          }
        }
      } catch (err) {
        console.warn('Admin Leads API unavailable, trying direct Firestore');
      }

      // Priority 2: Direct Firestore
      try {
        if (db && typeof db.type === 'string') {
          const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as any)) as Lead[];
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'leads');
      }

      return [];
    },
    retry: false
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
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
        console.warn('Update Lead API failed, trying direct Firestore');
      }

      // Firestore fallback
      try {
        if (db && typeof db.type === 'string') {
          const docRef = doc(db, 'leads', id);
          await updateDoc(docRef, { status });
          return;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `leads/${id}`);
      }
      
      throw new Error('Failed to update lead status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
    }
  });

  const stats = [
    { label: 'New Leads', value: leads?.filter(l => l.status === 'new')?.length || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Scheduled', value: leads?.filter(l => l.status === 'scheduled')?.length || 0, icon: Calendar, color: 'text-green-600 bg-green-50' },
    { label: 'Completed', value: leads?.filter(l => l.status === 'completed')?.length || 0, icon: CheckCircle2, color: 'text-purple-600 bg-purple-50' }
  ];

  const sidebarLinks = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
    { icon: Users, label: 'Manage Leads', path: '/admin/dashboard/leads' },
    { icon: Image, label: 'Gallery', path: '/admin/dashboard/gallery' },
    { icon: MessageSquare, label: 'Reviews', path: '/admin/dashboard/reviews' },
    { icon: Settings, label: 'Settings', path: '/admin/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">D</div>
            <span className="text-slate-900 font-bold">Dany <span className="text-blue-600">Admin</span></span>
           </div>
        </div>
        <nav className="flex-grow p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                location.pathname === link.path ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium"
           >
             <LogOut size={18} /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-900">
            Welcome back, {fbUser?.displayName || auth.user?.username || 'Admin'}!
          </h2>
          <div className="flex items-center gap-4">
             {/* Connection Diagnostics */}
             <div className="flex items-center gap-2 mr-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 hidden md:flex">
               <div className="flex items-center gap-1.5" title="Site Backend (API Status)">
                  <div className={cn("w-1.5 h-1.5 rounded-full", isError ? "bg-red-500" : "bg-green-500")} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Local DB</span>
               </div>
               <div className="w-px h-3 bg-slate-200 mx-1" />
               <div className="flex items-center gap-1.5" title="Cloud Database (Firestore Status)">
                  <div className={cn("w-1.5 h-1.5 rounded-full", (db && db.type !== 'mock') ? "bg-green-500" : "bg-amber-500")} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cloud DB</span>
               </div>
             </div>

             <div className="text-right hidden sm:block">
               <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                 {fbUser ? 'Authenticated via Firebase' : 'Legacy Session'}
               </p>
               <p className="text-[10px] text-slate-400 font-medium">{fbUser?.email || auth.user?.username}</p>
             </div>
             <a href="/" target="_blank" className="text-sm font-medium text-blue-600 flex items-center gap-1 hover:underline">
               View Site <ExternalLink size={14} />
             </a>
             <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 overflow-hidden flex items-center justify-center">
               {fbUser?.photoURL ? (
                 <img src={fbUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon size={20} className="text-slate-400" />
               )}
             </div>
          </div>
        </header>

        <div className="p-8 overflow-y-auto">
          {/* Debug Info */}
          {(process.env.NODE_ENV !== 'production' || fbUser) && (
            <div className="mb-4 p-4 bg-slate-100 rounded-xl text-[10px] font-mono whitespace-pre-wrap break-all">
              DEBUG: FB User: {fbUser ? `${fbUser.email} (Verified: ${fbUser.emailVerified})` : 'NULL'} | 
              Legacy Token: {auth.token ? 'YES' : 'NO'} |
              Error: {leadsError instanceof Error ? leadsError.message : 'None'}
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
            <Route index element={
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                       <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-2xl ${stat.color}`}>
                            <stat.icon size={24} />
                          </div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth +12%</span>
                       </div>
                       <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                       <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Leads Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Recent Lead Submissions</h3>
                    <Link to="/admin/dashboard/leads" className="text-sm font-bold text-blue-600 hover:underline">View All</Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Client</th>
                          <th className="px-6 py-4">Service</th>
                          <th className="px-6 py-4">Location</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                          <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading leads...</td></tr>
                        ) : leads?.slice(0, 5).map((lead) => (
                          <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-[10px] text-slate-400 font-mono">
                              {(() => {
                                const date = (lead as any).createdAt && (lead as any).createdAt.toDate ? (lead as any).createdAt.toDate() : 
                                             (lead as any).createdAt ? new Date((lead as any).createdAt) : null;
                                return date ? date.toLocaleDateString() : 'N/A';
                              })()}
                            </td>
                            <td className="px-6 py-4">
                               <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                               <p className="text-xs text-slate-500">{lead.phone}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm text-slate-600">{lead.service_type}</p>
                               <p className="text-[10px] text-slate-400 uppercase font-bold">{lead.bedrooms}B / {lead.bathrooms}Ba</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm text-slate-600">{lead.city}</p>
                               <p className="text-[10px] text-slate-400 uppercase font-bold">ZIP: {lead.zip_code}</p>
                            </td>
                            <td className="px-6 py-4">
                               <span className={cn(
                                 "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                 lead.status === 'new' ? "bg-blue-100 text-blue-700" :
                                 lead.status === 'scheduled' ? "bg-green-100 text-green-700" :
                                 "bg-slate-100 text-slate-600"
                               )}>
                                 {lead.status}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex gap-2">
                                 <select 
                                   className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none"
                                   value={lead.status}
                                   onChange={(e) => updateLeadStatus.mutate({ id: String(lead.id), status: e.target.value })}
                                 >
                                   <option value="new">New</option>
                                   <option value="contacted">Contacted</option>
                                   <option value="scheduled">Scheduled</option>
                                   <option value="completed">Completed</option>
                                   <option value="cancelled">Cancelled</option>
                                 </select>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            } />
            <Route path="leads" element={<LeadsList auth={auth} leads={leads || []} updateLeadStatus={updateLeadStatus} />} />
            <Route path="gallery" element={<GalleryManager auth={auth} />} />
            <Route path="reviews" element={<ReviewManager auth={auth} />} />
            <Route path="settings" element={
              <div className="space-y-8">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-900">Brand Identity</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        Manage how your business appears to customers. 
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          <CheckCircle2 size={10} /> Auto-saves
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-10 max-w-3xl">
                    <div className="space-y-6">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Website Logo</label>
                        <p className="text-xs text-slate-400 ml-1">Recommended: PNG or SVG with transparent background.</p>
                      </div>
                      <LogoUpload />
                    </div>
                    
                    <div className="pt-10 border-t border-slate-100 space-y-6">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Hero Cover Image</label>
                        <p className="text-xs text-slate-400 ml-1">This image will appear as the background in the main section of the site.</p>
                      </div>
                      <HeroCoverUploader />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Business Configuration</h3>
                      <p className="text-xs text-slate-500">Coming soon: Automated scheduling and email notifications.</p>
                    </div>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function LeadsList({ auth, leads, updateLeadStatus }: { auth: AuthState, leads: Lead[], updateLeadStatus: any }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
      <h3 className="font-bold text-2xl text-slate-900 mb-6">Manage All Leads</h3>
      <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-12 py-4">Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads?.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {(() => {
                      const date = (lead as any).createdAt && (lead as any).createdAt.toDate ? (lead as any).createdAt.toDate() : 
                                   (lead as any).createdAt ? new Date((lead as any).createdAt) : null;
                      return date ? date.toLocaleString() : 'N/A';
                    })()}
                  </td>
                  <td className="px-6 py-4">
                     <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                     <p className="text-xs text-slate-500">{lead.email}</p>
                  </td>
                  <td className="px-12 py-4">
                     <p className="text-xs text-slate-900 font-medium">{lead.service_type}</p>
                     <p className="text-[10px] text-slate-400 italic">"{lead.message}"</p>
                  </td>
                  <td className="px-6 py-4">
                     <select 
                       className="text-xs border border-slate-200 rounded-lg px-2 py-1"
                       value={lead.status}
                       onChange={(e) => updateLeadStatus.mutate({ id: String(lead.id), status: e.target.value })}
                     >
                       <option value="new">New</option>
                       <option value="contacted">Contacted</option>
                       <option value="scheduled">Scheduled</option>
                       <option value="completed">Completed</option>
                       <option value="cancelled">Cancelled</option>
                     </select>
                  </td>
                  <td className="px-6 py-4">
                     <a 
                       href={`tel:${lead.phone}`}
                       className="text-blue-600 font-bold text-xs hover:underline"
                     >
                       Call Now
                     </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
}

function ReviewManager({ auth }: { auth: AuthState }) {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/reviews', {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        });
        if (!response.ok) return [];
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return await response.json();
        }
        return [];
      } catch (err) {
        return [];
      }
    }
  });

  const toggleReview = useMutation({
    mutationFn: async (review: any) => {
      const response = await fetch(`/api/admin/reviews/${review.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to toggle review');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete review');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
  });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
      <h3 className="font-bold text-2xl text-slate-900 mb-6">Review Moderation</h3>
      {isLoading ? (
        <div className="text-slate-400 italic">Loading reviews...</div>
      ) : (
        <div className="space-y-4">
          {reviews?.length === 0 && <p className="text-slate-400 italic">No reviews yet.</p>}
          {reviews?.map((review: any) => {
            const isPublished = review.isPublished !== undefined ? review.isPublished : review.is_published;
            return (
              <div key={review.id} className={cn(
                "p-6 rounded-2xl border transition-all",
                isPublished ? "bg-white border-slate-100" : "bg-slate-50 border-slate-200 opacity-60"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-slate-900">{review.author}</span>
                      <div className="flex text-amber-500">
                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{review.comment}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleReview.mutate(review)}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        isPublished ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      )}
                    >
                      {isPublished ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button 
                      onClick={() => { if(confirm('Delete review?')) deleteReview.mutate(String(review.id)) }}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GalleryManager({ auth }: { auth: AuthState }) {
  const queryClient = useQueryClient();
  const [newImage, setNewImage] = useState({ url: '', title: '', category: 'Residential' });

  const { data: gallery, isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['admin-gallery'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/gallery');
        if (!response.ok) return [];
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return await response.json();
        }
        return [];
      } catch (err) {
        return [];
      }
    }
  });

  const addImage = useMutation({
    mutationFn: async (item: typeof newImage) => {
      const response = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify(item)
      });
      if (!response.ok) throw new Error('Failed to add image');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
      setNewImage({ url: '', title: '', category: 'Residential' });
    }
  });

  const deleteImage = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete image');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-gallery'] })
  });

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <h3 className="font-bold text-2xl text-slate-900 mb-6">Add New Gallery Image</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <input 
            className="md:col-span-2 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm"
            placeholder="Image URL (Unsplash or direct link)"
            value={newImage.url}
            onChange={(e) => setNewImage({...newImage, url: e.target.value})}
          />
          <input 
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm"
            placeholder="Title"
            value={newImage.title}
            onChange={(e) => setNewImage({...newImage, title: e.target.value})}
          />
          <select 
            className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm"
            value={newImage.category}
            onChange={(e) => setNewImage({...newImage, category: e.target.value})}
          >
            <option>Residential</option>
            <option>Commercial</option>
            <option>Deep Clean</option>
            <option>Event Prep</option>
          </select>
        </div>
        <button 
          onClick={() => addImage.mutate(newImage)}
          disabled={!newImage.url}
          className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          <Plus size={18} /> Add to Gallery
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading gallery...</div>
        ) : gallery?.map((item) => (
          <div key={item.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 aspect-square">
            <img src={item.url} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
              <p className="text-white font-bold text-sm mb-1">{item.title}</p>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">{item.category}</p>
              <button 
                onClick={() => { if(confirm('Delete image?')) deleteImage.mutate(String(item.id)) }}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all shadow-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
