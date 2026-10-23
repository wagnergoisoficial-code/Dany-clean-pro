import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminSetup from './AdminSetup';
import AdminDashboard from './AdminDashboard';
import { AuthState } from '../types';
import { auth as firebaseAuth } from '../lib/firebase';
import { isAdminEmail, hasAdminRecord } from '../lib/admins';

/**
 * Everything under /admin: who is signed in, whether they may enter, and the
 * dashboard itself.
 *
 * It is its own chunk, loaded only when someone opens /admin. Sign-in and the
 * dashboard are about a third of the site's code, and a customer opening the
 * home page on a phone used to download all of it before seeing anything.
 */
export default function AdminArea() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('dany_clean_auth');
    return saved ? JSON.parse(saved) : { token: null, user: null };
  });

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem('dany_clean_auth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('dany_clean_auth');
    }
  }, [auth]);

  const login = (token: string, user: { id: number; username: string }) => {
    setAuth({ token, user });
  };

  const logout = () => {
    setAuth({ token: null, user: null });
  };

  const [fbUser, setFbUser] = useState<any>(null);
  const [fbLoading, setFbLoading] = useState(true);

  useEffect(() => {
    return firebaseAuth.onAuthStateChanged((user: any) => {
      setFbUser(user);
      setFbLoading(false);
      if (user) {
        setAuth(prev => {
          if (!prev.token) {
            return { token: 'fb-token', user: { id: 9999, username: user.email || 'firebase-admin' } };
          }
          return prev;
        });
      }
    });
  }, []);

  // Access is a question only Firebase Auth and the admins collection can
  // answer. `|| !!auth.token` used to be here, and that token came out of
  // localStorage unverified: writing the key by hand in a browser console was
  // a complete way past the login.
  const [adminState, setAdminState] = useState<'checking' | 'yes' | 'no'>('checking');

  useEffect(() => {
    if (!fbUser) { setAdminState('no'); return; }
    if (isAdminEmail(fbUser.email)) { setAdminState('yes'); return; }
    let live = true;
    hasAdminRecord(fbUser.uid).then(ok => { if (live) setAdminState(ok ? 'yes' : 'no'); });
    return () => { live = false; };
  }, [fbUser]);

  const hasAccess = adminState === 'yes';

  // Still waiting to hear who, if anyone, is signed in.
  const decidingAccess = fbLoading || (fbUser && adminState === 'checking');

  const booting = (
    <div className="min-h-screen bg-surface-low flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-ink-muted font-medium animate-pulse">Checking your access…</p>
      </div>
    </div>
  );

  return (
    <Routes>
      {/* Creating the first administrator. The server closes this off once
          one exists, so the page needs no gate of its own. */}
      <Route path="setup" element={<AdminSetup />} />
      <Route
        path="login"
        element={decidingAccess ? booting : (!hasAccess ? <AdminLogin onLogin={login} /> : <Navigate to="/admin/dashboard" />)}
      />
      <Route
        path="dashboard/*"
        element={decidingAccess ? booting : hasAccess ? (
          <AdminDashboard
            auth={auth}
            fbUser={fbUser}
            onLogout={async () => {
              await firebaseAuth.signOut();
              logout(); // Clear old auth state too
            }}
          />
        ) : <Navigate to="/admin/login" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
