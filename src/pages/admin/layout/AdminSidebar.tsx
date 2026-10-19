import {
  LayoutDashboard, Users, UserCheck, CalendarDays, Image as ImageIcon,
  MessageSquare, Settings, LogOut, X, Target, ShieldCheck,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { DEFAULT_LOGO } from '../../../lib/brand';

interface AdminSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  onLogout: () => void;
}

/**
 * Nine destinations in one flat list is a list you read every time instead of
 * a shape you learn. Grouping them means the eye goes to a third of the
 * sidebar rather than scanning all of it — and it leaves somewhere obvious to
 * put the next six things, which is the point if this is going to grow.
 *
 * Gone with the old version: the 01-09 numbering and the all-caps labels. Both
 * are editorial affectations that belong on the marketing site. A panel is
 * read quickly and often, and sentence case is simply faster to read.
 */
const SECTIONS: Array<{ title: string; links: Array<{ icon: any; label: string; path: string }> }> = [
  {
    title: 'Work',
    links: [
      { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
      { icon: Users, label: 'Leads', path: '/admin/dashboard/leads' },
      { icon: CalendarDays, label: 'Schedule', path: '/admin/dashboard/schedule' },
      { icon: UserCheck, label: 'Customers', path: '/admin/dashboard/customers' },
      { icon: Target, label: 'Outreach', path: '/admin/dashboard/commercial' },
    ],
  },
  {
    title: 'Your site',
    links: [
      { icon: ImageIcon, label: 'Gallery', path: '/admin/dashboard/gallery' },
      { icon: MessageSquare, label: 'Reviews', path: '/admin/dashboard/reviews' },
    ],
  },
  {
    title: 'Account',
    links: [
      { icon: Settings, label: 'Settings', path: '/admin/dashboard/settings' },
      { icon: ShieldCheck, label: 'Team access', path: '/admin/dashboard/team' },
    ],
  },
];

export default function AdminSidebar({ isMobile, onClose, onLogout }: AdminSidebarProps) {
  const { pathname } = useLocation();

  const content = (
    <>
      <div className="h-[72px] px-5 flex items-center justify-between shrink-0">
        <Link to="/admin/dashboard" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
          <img src={DEFAULT_LOGO} alt="" className="w-9 h-9 object-contain shrink-0" />
          <span className="min-w-0">
            <span className="block font-sans text-[15px] font-bold text-slate-900 leading-tight truncate">
              Dany Clean Pro
            </span>
            <span className="block text-[11px] text-slate-400 leading-tight">Operations</span>
          </span>
        </Link>
        {isMobile && (
          <button onClick={onClose} aria-label="Close menu"
            className="w-9 h-9 grid place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-grow overflow-y-auto px-3 pb-3 space-y-5">
        {SECTIONS.map(section => (
          <div key={section.title}>
            <h2 className="px-3 mb-1.5 text-[11px] font-semibold tracking-wide text-slate-400">
              {section.title}
            </h2>
            <ul className="space-y-0.5">
              {section.links.map(link => {
                // Overview owns the index path, so it alone matches exactly;
                // everything else keeps its highlight on child routes too.
                const active = link.path === '/admin/dashboard'
                  ? pathname === link.path || pathname === `${link.path}/`
                  : pathname.startsWith(link.path);
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 h-10 px-3 rounded-xl text-sm transition-colors',
                        active
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900',
                      )}
                    >
                      <link.icon
                        size={17}
                        className={cn('shrink-0 transition-colors',
                          active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')}
                      />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 shrink-0">
        <button
          onClick={() => { onClose?.(); onLogout(); }}
          className="w-full flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <LogOut size={17} className="text-slate-400 group-hover:text-red-500 transition-colors" />
          Sign out
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <aside className="fixed inset-y-0 left-0 w-[264px] bg-white z-50 flex flex-col shadow-xl">
        {content}
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex w-[252px] bg-white border-r border-slate-200 flex-col shrink-0">
      {content}
    </aside>
  );
}
