import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import Layout from './components/Layout';
import { AlertCircle } from 'lucide-react';

// Fetched when opened, not with the home page. The dashboard and sign-in were
// about half of everything a phone downloaded before it could show the site;
// the policy pages, the reviews page and the call and text windows are only
// wanted by some visitors, and only after they ask for them.
const AdminArea = lazy(() => import('./pages/AdminArea'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const Reviews = lazy(() => import('./pages/Reviews'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const AIVoiceCall = lazy(() => import('./components/AIVoiceCall'));
const SMSFallbackModal = lazy(() => import('./components/SMSFallbackModal'));

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
        <div className="min-h-screen bg-surface-low flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
              <p className="text-ink-muted">The application encountered an unexpected error. Please try refreshing the page.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-accent text-white py-4 font-bold hover:bg-accent-strong transition-colors"
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
  const [isSMSFallbackOpen, setIsSMSFallbackOpen] = useState(false);

  useEffect(() => {
    const handleTriggerCall = () => setIsVoiceCallOpen(true);
    const handleTriggerSMS = () => setIsSMSFallbackOpen(true);
    
    window.addEventListener('trigger-ai-call', handleTriggerCall);
    window.addEventListener('trigger-sms-fallback', handleTriggerSMS);
    
    return () => {
      window.removeEventListener('trigger-ai-call', handleTriggerCall);
      window.removeEventListener('trigger-sms-fallback', handleTriggerSMS);
    };
  }, []);
  const adminLoading = (
    <div className="min-h-screen bg-surface-low flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={null}>
            {isVoiceCallOpen && <AIVoiceCall onClose={() => setIsVoiceCallOpen(false)} />}
            {isSMSFallbackOpen && <SMSFallbackModal onClose={() => setIsSMSFallbackOpen(false)} />}
          </Suspense>
          <Routes>
            {/* Public Routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/termos" element={<TermsAndConditions />} />
              <Route path="/termos-e-condicoes" element={<TermsAndConditions />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/testimonials" element={<Navigate to="/reviews" replace />} />
              {/* Where the quote form lands; ad conversions are counted by this address. */}
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/obrigado" element={<ThankYou />} />
            </Route>
            
            {/* The dashboard, sign-in and first-admin setup, in their own chunk. */}
            <Route path="/admin/*" element={<Suspense fallback={adminLoading}><AdminArea /></Suspense>} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
