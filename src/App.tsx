import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import { AuthState } from './types';
import { auth as firebaseAuth } from './lib/firebase';

const queryClient = new QueryClient();

export default function App() {
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
    });
  }, []);

  const isAdmin = fbUser?.email?.toLowerCase() === 'wagnergoisoficial@gmail.com';
  const hasAccess = isAdmin || !!auth.token;

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
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
  );
}
