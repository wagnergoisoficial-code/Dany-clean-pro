import { 
  LayoutDashboard, 
  Users, 
  UserCheck,
  Image as ImageIcon, 
  MessageSquare, 
  Settings, 
  LogOut, 
  X, 
  ChevronRight,
  Target
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../../lib/utils';

interface AdminSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  onLogout: () => void;
}

export default function AdminSidebar({ isMobile, onClose, onLogout }: AdminSidebarProps) {
  const location = useLocation();

  const sidebarLinks = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
    { icon: Users, label: 'Manage Leads', path: '/admin/dashboard/leads' },
    { icon: Target, label: 'Command Center', path: '/admin/dashboard/commercial' },
    { icon: UserCheck, label: 'Customers', path: '/admin/dashboard/customers' },
    { icon: ImageIcon, label: 'Gallery', path: '/admin/dashboard/gallery' },
    { icon: MessageSquare, label: 'Reviews', path: '/admin/dashboard/reviews' },
    { icon: Settings, label: 'Settings', path: '/admin/dashboard/settings' },
  ];

  const content = (
    <>
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">D</div>
          <span className="text-slate-900 font-bold tracking-tight">Dany <span className="text-blue-600">Admin</span></span>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>
      
      <nav className="flex-grow p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {sidebarLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <link.icon size={18} className={cn("transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
                {link.label}
              </div>
              {isActive && <ChevronRight size={14} className="opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={() => {
            onClose?.();
            onLogout();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium group"
        >
          <LogOut size={18} className="text-slate-400 group-hover:text-red-500 transition-colors" /> Logout
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <aside className="fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col shadow-2xl border-r border-slate-100">
        {content}
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
      {content}
    </aside>
  );
}
