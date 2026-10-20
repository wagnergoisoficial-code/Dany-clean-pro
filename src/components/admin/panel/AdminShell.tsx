import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon, IconSprite } from './Icons';
import { DEFAULT_LOGO } from '../../../lib/brand';

/**
 * Moldura do painel — estrutura e classes do ficheiro aprovado.
 *
 * A ordem dos elementos é a do ficheiro: marca, selector de workspace,
 * navegação com rótulos de grupo e um ramo expansível, separador, bloco
 * inferior e rodapé. Os destinos é que são os da Dany, porque o ficheiro
 * navegava para campanhas e eventos que este negócio não tem.
 */
interface ShellProps {
  email: string;
  displayName: string;
  businessName: string;
  photo?: string | null;
  onLogout: () => void;
  onHelp: () => void;
  search: string;
  onSearch: (value: string) => void;
  onSubmitSearch: () => void;
  notifications: Array<{ id: string; text: string; at: string; read: boolean; type: string }>;
  onMarkRead: () => void;
  children: React.ReactNode;
}

const initials = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => [...w][0]).join('').toUpperCase() || 'AD';

export default function AdminShell({
  email, displayName, businessName, photo, onLogout, onHelp,
  search, onSearch, onSubmitSearch, notifications, onMarkRead, children,
}: ShellProps) {
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [jobsOpen, setJobsOpen] = useState(true);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => { setNavOpen(false); }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !document.querySelector('dialog[open]')) {
        event.preventDefault(); setNavOpen(false); searchRef.current?.focus();
      }
      if (event.key === 'Escape') { setNavOpen(false); setBellOpen(false); }
    };
    const onClick = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) setBellOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, []);

  const is = (path: string, exact = false) =>
    exact ? pathname === path || pathname === `${path}/` : pathname.startsWith(path);

  const when = (iso: string) => {
    try { return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)); }
    catch { return ''; }
  };

  return (
    <div className={`adm${navOpen ? ' nav-open' : ''}`}>
      <IconSprite />
      <a className="skip" href="#main">Skip to content</a>

      <div className="app">
        <aside className="sidebar" aria-label="Main navigation">
          <Link className="brand" to="/admin/dashboard" aria-label="Dashboard home">
            <span className="brand-symbol"><img src={DEFAULT_LOGO} alt="" /></span>
            <span>
              <span className="brand-name">Dany<span style={{ color: '#74a1ff' }}>.</span></span>
              <span className="brand-sub">CLEAN PRO ADMIN</span>
            </span>
          </Link>

          <Link className="workspace-switch" to="/admin/dashboard/settings" aria-label="Edit business details">
            <span className="workspace-symbol">{initials(businessName).slice(0, 1)}</span>
            <span className="workspace-copy"><strong>{businessName}</strong><small>Owner</small></span>
            <Icon name="chevron" />
          </Link>

          <nav className="nav-scroll">
            <p className="nav-label">MAIN</p>
            <Link className={`nav-link${is('/admin/dashboard', true) ? ' active' : ''}`} to="/admin/dashboard"
                  aria-current={is('/admin/dashboard', true) ? 'page' : undefined}>
              <Icon name="grid" />Overview
            </Link>

            <button className="nav-parent" aria-expanded={jobsOpen} aria-controls="adm-jobs-nav"
                    onClick={() => setJobsOpen(open => !open)}>
              <Icon name="activity" />Jobs and schedule<Icon name="chevron" />
            </button>
            <div className="nav-sub" id="adm-jobs-nav" hidden={!jobsOpen}>
              <Link to="/admin/dashboard/schedule" className={is('/admin/dashboard/schedule') ? 'is-current' : ''}>All jobs</Link>
              <Link to="/admin/dashboard/schedule?view=today">Today</Link>
              <Link to="/admin/dashboard/schedule?view=pending">Waiting for approval</Link>
            </div>

            <Link className={`nav-link${is('/admin/dashboard/commercial') ? ' active' : ''}`} to="/admin/dashboard/commercial">
              <Icon name="megaphone" />Outreach
            </Link>

            <div className="nav-separator" />
            <p className="nav-label">BUSINESS</p>
            <Link className={`nav-link${is('/admin/dashboard/leads') ? ' active' : ''}`} to="/admin/dashboard/leads">
              <Icon name="box" />Leads
            </Link>
            <Link className={`nav-link${is('/admin/dashboard/customers') ? ' active' : ''}`} to="/admin/dashboard/customers">
              <Icon name="users" />Customers
            </Link>
            <Link className={`nav-link${is('/admin/dashboard/gallery') ? ' active' : ''}`} to="/admin/dashboard/gallery">
              <Icon name="card" />Gallery
            </Link>
            <Link className={`nav-link${is('/admin/dashboard/reviews') ? ' active' : ''}`} to="/admin/dashboard/reviews">
              <Icon name="tag" />Reviews
            </Link>
          </nav>

          <div className="sidebar-bottom">
            <Link className={`nav-link${is('/admin/dashboard/settings') ? ' active' : ''}`} to="/admin/dashboard/settings">
              <Icon name="settings" />Settings
            </Link>
            <button className="nav-link" onClick={onHelp}>
              <Icon name="help" />Help<Icon name="right" className="icon" style={{ marginLeft: 'auto', width: 12 }} />
            </button>
            <button className="nav-link" onClick={onLogout}>
              <Icon name="user" />Sign out
            </button>
            <div className="sidebar-foot">
              <span className="status-dot" aria-hidden="true" />Your workspace<span style={{ marginLeft: 'auto' }}>v1.0</span>
            </div>
          </div>
        </aside>

        {navOpen && <button className="sidebar-overlay" aria-label="Close menu" onClick={() => setNavOpen(false)} />}

        <div className="shell">
          <header className="topbar">
            <button className="icon-button menu-button" aria-label="Open menu" aria-expanded={navOpen}
                    onClick={() => setNavOpen(true)}><Icon name="menu" /></button>

            <form className="search-global" role="search"
                  onSubmit={event => { event.preventDefault(); onSubmitSearch(); }}>
              <Icon name="search" />
              <label htmlFor="adm-search" className="sr-only">Search the panel</label>
              <input ref={searchRef} id="adm-search" type="search" placeholder="Search the panel..."
                     autoComplete="off" value={search} onChange={event => onSearch(event.target.value)} />
              <kbd aria-hidden="true">⌘ K</kbd>
            </form>

            <div className="topbar-right">
              <button className="icon-button" aria-label="Panel shortcuts" title="Panel shortcuts" onClick={onHelp}>
                <Icon name="help" />
              </button>

              <div ref={bellRef} style={{ position: 'relative', display: 'flex' }}>
                <button className="icon-button notification-button"
                        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications, all read'}
                        aria-haspopup="true" aria-expanded={bellOpen}
                        onClick={() => setBellOpen(open => !open)}>
                  <Icon name="bell" />
                  {unread > 0 && <span className="unread-dot" aria-hidden="true" />}
                </button>

                {bellOpen && (
                  <section className="popover" aria-label="Notifications">
                    <div className="popover-heading">
                      <h2>Notifications</h2>
                      <button className="text-button" disabled={unread === 0} onClick={onMarkRead}>Mark as read</button>
                    </div>
                    <div>
                      {notifications.length === 0 && <p className="popover-empty">Nothing new here.</p>}
                      {notifications.slice(0, 6).map(item => (
                        <div className="notification-item" key={item.id}>
                          <Icon name={item.type === 'team' ? 'users' : item.type === 'workspace' ? 'settings' : 'check-circle'} />
                          <div>{item.text}<small>{when(item.at)}{item.read ? ' · Read' : ' · Unread'}</small></div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <span className="topbar-divider" aria-hidden="true" />

              <Link className="profile-button" to="/admin/dashboard/settings" aria-label="Your account">
                <span className="avatar avatar-small">
                  {photo ? <img src={photo} alt="" /> : initials(displayName)}
                </span>
                <span><strong>{displayName}</strong><small>{email}</small></span>
                <Icon name="chevron" />
              </Link>
            </div>
          </header>

          <main className="content" id="main">{children}</main>
        </div>
      </div>
    </div>
  );
}
