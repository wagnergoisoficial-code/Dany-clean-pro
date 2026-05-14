import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AdminLogin({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // App.tsx handles the state change and navigation
    } catch (err: any) {
      setError('Google Sign-In failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) throw new Error('Invalid credentials');

      const data = await res.json();
      onLogin(data.token, data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Incorrect username or password. Try admin / admin123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-blue-600 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/30 shadow-xl">
                <Lock size={36} />
              </div>
              <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
              <p className="text-blue-100/80 text-sm mt-3 font-medium uppercase tracking-widest text-[10px]">Secure Access</p>
            </div>
          </div>

          <div className="p-10 space-y-8">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 py-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-blue-100 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 text-blue-600" />
              Sign in with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-white px-4 text-slate-300">Or use system account</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 flex items-center gap-3 animate-shake">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Username</label>
                <div className="relative group">
                  <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50/50 border border-slate-100 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50/50 border border-slate-100 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Dashboard</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-2">
                <ShieldCheck size={14} className="text-green-500" /> Authorized Personnel Only
              </div>
            </form>
          </div>
        </div>
        
        <p className="text-center mt-12 text-slate-400 text-xs font-medium">
          Dany Clean Pro &bull; Operational Integrity System v2.0
        </p>
      </motion.div>
    </div>
  );
}
