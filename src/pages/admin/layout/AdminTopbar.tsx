import { 
  Menu, 
  ExternalLink, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AuthState } from '../../../types';
import { User as FirebaseUser } from 'firebase/auth';
import { isFirebaseReady } from '../../../lib/firebase';

interface AdminTopbarProps {
  auth: AuthState;
  fbUser?: FirebaseUser | null;
  onMenuClick: () => void;
  hasError?: boolean;
}

export default function AdminTopbar({ auth, fbUser, onMenuClick, hasError }: AdminTopbarProps) {
  const userName = fbUser?.displayName?.split(' ')[0] || auth.user?.username || 'Admin';
  const connectionReady = isFirebaseReady();

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex justify-between items-center shrink-0 sticky top-0 z-30 shadow-sm shadow-slate-100/50">
      <div className="flex items-center gap-3">
        <button 
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 truncate">
            Hello, {userName}!
          </h2>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <Database size={8} /> Operational Node
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-6">
         {/* Status Indicators */}
         <div className="hidden sm:flex items-center gap-4 border-r border-slate-100 pr-6 mr-2">
            <div className="flex items-center gap-1.5" title={hasError ? "API Error Detected" : "API Connected"}>
               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", hasError ? "bg-red-500" : "bg-green-500")} />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Core API</span>
            </div>
            <div className="flex items-center gap-1.5" title={connectionReady ? "Firestore Connected" : "Firestore Initializing"}>
               <div className={cn("w-1.5 h-1.5 rounded-full", connectionReady ? "bg-green-500" : "bg-amber-500")} />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Database</span>
            </div>
         </div>

         <div className="flex items-center gap-3">
           <a 
             href="/" 
             target="_blank" 
             className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
           >
             Go to Site <ExternalLink size={12} />
           </a>
           
           <div className="flex items-center gap-3 pl-2">
             <div className="text-right hidden md:block">
               <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 leading-tight">
                 {fbUser ? 'Firebase Cloud' : 'Legacy Auth'}
               </p>
               <p className="text-[10px] text-slate-400 font-medium">{fbUser?.email || auth.user?.username}</p>
             </div>
             
             <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner group">
               {fbUser?.photoURL ? (
                 <img src={fbUser.photoURL} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 font-bold">
                   <UserIcon size={20} />
                 </div>
               )}
             </div>
           </div>
         </div>
      </div>
    </header>
  );
}
