import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { isAdminEmail, hasAdminRecord } from './admins';
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';

/**
 * The signed-in account, for the parts of the site outside the dashboard.
 *
 * There is no `login` here any more. Signing in happens on /admin/login with
 * an e-mail and a password; the Google button it sat behind is gone, and
 * nothing called this.
 *
 * `isAdmin` asks the same question the dashboard's own gate asks, and gets it
 * from the same place. Deciding it here from the shape of an e-mail would be a
 * second opinion that drifts from the first — which is how a real
 * administrator ends up being told they are not one.
 */
export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    if (isAdminEmail(user.email)) { setIsAdmin(true); return; }
    let live = true;
    hasAdminRecord(user.uid).then(ok => { if (live) setIsAdmin(ok); });
    return () => { live = false; };
  }, [user]);

  const logout = async () => {
    await signOut(auth);
  };

  return { user, logout, loading, isAdmin };
}
