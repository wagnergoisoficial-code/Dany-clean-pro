import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { AuthState } from './types';
import { auth as firebaseAuth } from './lib/firebase';
import AIVoiceCall from './components/AIVoiceCall';
import { AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
              <p className="text-slate-600">The application encountered an unexpected error. Please try refreshing the page.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient();

export default function App() {
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);

  useEffect(() => {
    const handleTriggerCall = () => setIsVoiceCallOpen(true);
    window.addEventListener('trigger-ai-call', handleTriggerCall);
    return () => window.removeEventListener('trigger-ai-call', handleTriggerCall);
  }, []);
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
    return firebaseAuth.onAuthStateChanged((user) => {
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

  const allowedEmails = ['wagnergoisoficial@gmail.com', 'danycleanenpro@gmail.com'];
  const isAdminByEmail = fbUser?.email && allowedEmails.includes(fbUser.email.toLowerCase());
  const hasAccess = isAdminByEmail || !!auth.token;

  if (fbLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing Dany Clean Pro Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AnimatePresence>
            {isVoiceCallOpen && <AIVoiceCall onClose={() => setIsVoiceCallOpen(false)} />}
          </AnimatePresence>
          <Routes>
            {/* Public Routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            </Route>
            
            {/* Private Admin Routes */}
            <Route 
              path="/admin/login" 
              element={!hasAccess ? <AdminLogin onLogin={login} /> : <Navigate to="/admin/dashboard" />} 
            />
            <Route 
              path="/admin/dashboard/*" 
              element={hasAccess ? (
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
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
