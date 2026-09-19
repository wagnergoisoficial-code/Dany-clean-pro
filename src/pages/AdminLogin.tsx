import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AdminLogin({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'up' | 'down'>('checking');
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setServerStatus('up');
        } else {
          setServerStatus('down');
        }
      } catch (err) {
        setServerStatus('down');
      }
    };
    checkHealth();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError('Google Sign-In failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (serverStatus === 'up') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (res.ok) {
          const data = await res.json();
          onLogin(data.token, data.user);
          navigate('/admin/dashboard');
          return;
        }
      }

      // Fallback: Firebase Auth (Directly for Netlify)
      // If user provided just "admin", we try to treat it as admin@danycleanpro.com or whatever email is registered
      const email = username.includes('@') ? username : `${username}@admin.com`;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLogin('fb-token', { id: userCredential.user.uid, username: userCredential.user.email });
        navigate('/admin/dashboard');
      } catch (fbErr: any) {
        if (serverStatus === 'down') {
          setError('Credenciais inválidas ou conta não encontrada no Firebase.');
        } else {
          setError('Usuário ou senha incorretos.');
        }
      }
    } catch (err: any) {
      setError('Falha na autenticação. Tente novamente ou use Google Login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-low flex flex-col">
      {/* Masthead */}
      <header className="border-b border-rule bg-surface">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div>
            <span className="block font-display text-headline-sm text-ink tracking-tight leading-none">
              Dany Clean Pro
            </span>
            <span className="block text-label-sm uppercase text-accent mt-1">Operations Desk</span>
          </div>
          <a href="/" className="text-label-md uppercase text-ink-muted hover:text-ink transition-colors">
            Back to site
          </a>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-1.5 h-1.5 rounded-full ${serverStatus === 'up' ? 'bg-green-500' : serverStatus === 'down' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-label-sm uppercase text-ink-muted">
                System {serverStatus === 'up' ? 'online' : serverStatus === 'down' ? 'offline' : 'checking…'}
              </span>
            </div>
            <h1 className="font-display text-headline-lg text-ink tracking-tight mb-3">Admin access</h1>
            <p className="text-body-md text-ink-muted">
              Sign in to manage leads, gallery photos, reviews and site settings.
            </p>
          </div>

          <div className="bg-surface border border-rule p-8 lg:p-10">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-rule py-4 text-label-md uppercase text-ink hover:bg-surface-low hover:border-ink transition-colors disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-4 h-4" />
              Sign in with Google
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-rule" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-4 text-label-sm uppercase text-ink-faint">
                  Or use a system account
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-4 flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-2" />
                  <p className="text-body-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-label-md uppercase text-ink mb-2" htmlFor="admin-user">Username</label>
                <div className="relative group">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint group-focus-within:text-accent transition-colors" />
                  <input
                    id="admin-user"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-11 pr-4 py-3.5 bg-surface-low border border-transparent text-body-md text-ink placeholder:text-ink-faint focus:bg-surface focus:border-accent outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-label-md uppercase text-ink mb-2" htmlFor="admin-pass">Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint group-focus-within:text-accent transition-colors" />
                  <input
                    id="admin-pass"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-surface-low border border-transparent text-body-md text-ink placeholder:text-ink-faint focus:bg-surface focus:border-accent outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink text-white py-4 text-label-md uppercase flex items-center justify-center gap-3 hover:bg-accent transition-colors disabled:opacity-70 group"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Enter Dashboard
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-rule pt-6">
            <span className="flex items-center gap-2 text-label-sm uppercase text-ink-muted">
              <ShieldCheck size={13} className="text-accent" /> Authorized personnel only
            </span>
            <span className="text-label-sm uppercase text-ink-faint">Integrity system v2.0</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
