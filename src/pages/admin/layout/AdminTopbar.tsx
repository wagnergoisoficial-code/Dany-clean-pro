import { useEffect, useRef, useState } from 'react';
import { Menu, ExternalLink, User as UserIcon, LogOut } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AuthState } from '../../../types';
import { User as FirebaseUser } from 'firebase/auth';
import { isFirebaseReady } from '../../../lib/firebase';

interface AdminTopbarProps {
  auth: AuthState;
  fbUser?: FirebaseUser | null;
  onMenuClick: () => void;
  onLogout: () => void;
  hasError?: boolean;
}

export default function AdminTopbar({ auth, fbUser, onMenuClick, onLogout, hasError }: AdminTopbarProps) {
  const userName = fbUser?.displayName?.split(' ')[0] || auth.user?.username || 'Admin';
  const connectionReady = isFirebaseReady();

  // The avatar was a decorative div. Signing out lived at the very bottom of
  // the sidebar, which is not where anyone looks for it.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') setMenuOpen(false);
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, [menuOpen]);

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-slate-900/[0.07] px-4 sm:px-6 lg:px-8 h-[72px] flex justify-between items-center shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button 
          className="lg:hidden w-10 h-10 -ml-2 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="font-sans text-[17px] font-bold text-slate-900 truncate leading-tight">
            Hello, {userName}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-8 shrink-0">
        {hasError && (
          <span className="hidden sm:inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-red-50 text-red-700 text-[13px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Connection problem
          </span>
        )}

        <a 
          href="/" 
          target="_blank" 
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          View site <ExternalLink size={13} />
        </a>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-[13px] text-slate-500 truncate max-w-[200px]">
            {fbUser?.email || auth.user?.username}
          </span>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(open => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account"
              className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden grid place-items-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              {fbUser?.photoURL ? (
                <img src={fbUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} className="text-ink-faint" />
              )}
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 top-11 w-60 bg-white rounded-xl ring-1 ring-slate-900/[0.08] shadow-[var(--shadow-pop)] overflow-hidden z-40">
                <div className="px-4 py-3 border-b border-slate-900/[0.06]">
                  <span className="block text-[11px] font-semibold text-slate-400">Signed in as</span>
                  <span className="block text-[13px] text-slate-800 truncate mt-0.5">
                    {fbUser?.email || auth.user?.username}
                  </span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
