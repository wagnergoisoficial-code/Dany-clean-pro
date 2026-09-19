import { 
  LayoutDashboard, 
  Users, 
  UserCheck,
  Image as ImageIcon, 
  MessageSquare, 
  Settings, 
  LogOut, 
  X,
  Target
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../../lib/utils';

interface AdminSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  onLogout: () => void;
}

const sidebarLinks = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard', index: '01' },
  { icon: Users, label: 'Manage Leads', path: '/admin/dashboard/leads', index: '02' },
  { icon: Target, label: 'Command Center', path: '/admin/dashboard/commercial', index: '03' },
  { icon: UserCheck, label: 'Customers', path: '/admin/dashboard/customers', index: '04' },
  { icon: ImageIcon, label: 'Gallery', path: '/admin/dashboard/gallery', index: '05' },
  { icon: MessageSquare, label: 'Reviews', path: '/admin/dashboard/reviews', index: '06' },
  { icon: Settings, label: 'Settings', path: '/admin/dashboard/settings', index: '07' },
];

export default function AdminSidebar({ isMobile, onClose, onLogout }: AdminSidebarProps) {
  const location = useLocation();

  const content = (
    <>
      <div className="h-20 px-6 border-b border-rule flex justify-between items-center shrink-0">
        <div>
          <span className="block font-display text-headline-sm text-ink tracking-tight leading-none">
            Dany Clean Pro
          </span>
          <span className="block text-label-sm uppercase text-accent mt-1">Operations Desk</span>
        </div>
        {isMobile && (
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-ink-faint hover:text-ink transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-grow overflow-y-auto py-2">
        <div className="flex flex-col divide-y divide-rule-soft">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-4 px-6 py-4 transition-colors",
                  isActive ? "bg-ink text-white" : "text-ink-muted hover:bg-surface-low hover:text-ink"
                )}
              >
                <span className={cn(
                  "text-label-sm tabular-nums transition-colors",
                  isActive ? "text-white/50" : "text-ink-faint group-hover:text-accent"
                )}>
                  {link.index}
                </span>
                <link.icon size={16} className={cn("shrink-0", isActive ? "text-white" : "text-ink-faint group-hover:text-accent")} />
                <span className="text-label-md uppercase whitespace-nowrap">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-rule shrink-0">
        <button 
          onClick={() => {
            onClose?.();
            onLogout();
          }}
          className="w-full flex items-center gap-3 px-6 py-5 text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <LogOut size={16} className="text-ink-faint group-hover:text-red-500 transition-colors" />
          <span className="text-label-md uppercase">Logout</span>
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <aside className="fixed inset-y-0 left-0 w-72 bg-surface z-50 flex flex-col shadow-2xl border-r border-rule">
        {content}
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-surface border-r border-rule hidden lg:flex flex-col sticky top-0 h-screen">
      {content}
    </aside>
  );
}
