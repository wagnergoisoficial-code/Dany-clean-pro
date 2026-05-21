import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const allowedEmails = ['wagnergoisoficial@gmail.com', 'danycleanenpro@gmail.com'];
  const isAdmin = user?.email && allowedEmails.includes(user.email.toLowerCase());

  return { user, login, logout, loading, isAdmin };
}
