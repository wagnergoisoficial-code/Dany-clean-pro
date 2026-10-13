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
    <header className="bg-surface border-b border-rule px-4 sm:px-8 h-20 flex justify-between items-center shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button 
          className="lg:hidden w-10 h-10 -ml-2 flex items-center justify-center text-ink-muted hover:bg-surface-low transition-colors"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <span className="block text-label-sm uppercase text-accent">Operational Node</span>
          <h2 className="font-display text-headline-sm text-ink truncate leading-tight">
            Hello, {userName}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-8 shrink-0">
        {/* Status rail */}
        <div className="hidden sm:flex items-center gap-6 border-r border-rule pr-6">
          <div className="flex items-center gap-2" title={hasError ? "API error detected" : "API connected"}>
            <span className={cn("w-1.5 h-1.5 rounded-full", hasError ? "bg-red-500 animate-pulse" : "bg-green-500")} />
            <span className="text-label-sm uppercase text-ink-muted">Core API</span>
          </div>
          <div className="flex items-center gap-2" title={connectionReady ? "Firestore connected" : "Firestore initializing"}>
            <span className={cn("w-1.5 h-1.5 rounded-full", connectionReady ? "bg-green-500" : "bg-amber-500")} />
            <span className="text-label-sm uppercase text-ink-muted">Database</span>
          </div>
        </div>

        <a 
          href="/" 
          target="_blank" 
          className="hidden sm:inline-flex items-center gap-2 text-label-md uppercase text-ink hover:text-accent transition-colors"
        >
          Go to Site <ExternalLink size={12} />
        </a>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <span className="block text-label-sm uppercase text-accent">
              {fbUser ? 'Firebase Cloud' : 'Legacy Auth'}
            </span>
            <span className="block text-body-sm text-ink-muted truncate max-w-[180px]">
              {fbUser?.email || auth.user?.username}
            </span>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(open => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account"
              className="w-10 h-10 bg-surface-low border border-rule overflow-hidden flex items-center justify-center hover:border-ink transition-colors"
            >
              {fbUser?.photoURL ? (
                <img src={fbUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} className="text-ink-faint" />
              )}
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 top-12 w-60 bg-surface border border-rule z-40">
                <div className="px-4 py-3 border-b border-rule">
                  <span className="block text-label-sm uppercase text-ink-faint">Signed in as</span>
                  <span className="block text-body-sm text-ink truncate mt-0.5">
                    {fbUser?.email || auth.user?.username}
                  </span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-label-md uppercase text-ink hover:bg-surface-low hover:text-red-600 transition-colors"
                >
                  <LogOut size={15} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
