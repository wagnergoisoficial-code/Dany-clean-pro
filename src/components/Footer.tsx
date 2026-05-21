import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, LogOut, Lock, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from './ui/Container';
import { useAdminAuth } from '../lib/auth';
import { useConfig } from '../hooks/useConfig';
import { useSetting } from '../lib/settings';

export default function Footer() {
  const { user, login, logout, isAdmin } = useAdminAuth();
  const { businessPhone } = useConfig();
  const { value: appLogo } = useSetting('app_logo');

  const triggerAICall = (e: React.MouseEvent) => {
    // allow native action while triggering internal event
    window.dispatchEvent(new CustomEvent('trigger-ai-call'));
  };

  const handleLogin = async () => {
    await login();
  };

  return (
    <footer className="bg-slate-950 text-slate-400 py-20 pb-10">
      <Container>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              {appLogo ? (
                <img src={appLogo} alt="Dany Clean Pro Logo" className="h-12 md:h-14 w-auto object-contain transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex items-center gap-2 transition-transform group-hover:scale-105">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">D</div>
                  <span className="text-white font-bold text-xl">Dany Clean <span className="text-blue-500">Pro</span></span>
                </div>
              )}
            </Link>
            <p className="text-sm leading-relaxed">
              Serving homes and businesses in Connecticut with professional, family-focused cleaning since 2014. Quality you can trust, prices you can afford.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-blue-500 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-blue-500 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-blue-500 transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6">Quick Links</h4>
             <ul className="space-y-4 text-sm">
               <li><a href="#services" className="hover:text-white transition-colors">Cleaning Services</a></li>
               <li><a href="#gallery" className="hover:text-white transition-colors">Our Gallery</a></li>
               <li><a href="#reviews" className="hover:text-white transition-colors">Reviews</a></li>
               <li><a href="#areas" className="hover:text-white transition-colors">Service Areas</a></li>
               <li><a href="#quote" className="hover:text-white transition-colors">Request Quote</a></li>
             </ul>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6">Contact Us</h4>
             <ul className="space-y-4 text-sm">
               <li className="flex items-center gap-3">
                 <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                   <Phone size={10} className="text-blue-500" /> 
                 </div>
                 <a href={`tel:${businessPhone.replace(/\D/g, '')}`} onClick={triggerAICall} className="hover:text-white transition-colors">{businessPhone}</a>
               </li>
               <li className="flex items-center gap-3">
                 <Mail size={16} className="text-blue-500" /> 
                 <a href="mailto:danycleanenpro@gmail.com" className="hover:text-white transition-colors">danycleanenpro@gmail.com</a>
               </li>
               <li className="flex items-center gap-3"><MapPin size={16} className="text-blue-500" /> Stamford, CT and Surrounding Areas</li>
             </ul>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6">Working Hours</h4>
             <ul className="space-y-4 text-sm">
               <li className="flex justify-between"><span>Mon - Fri</span> <span className="text-slate-200">8am - 6pm</span></li>
               <li className="flex justify-between"><span>Saturday</span> <span className="text-slate-200">9am - 4pm</span></li>
               <li className="flex justify-between"><span>Sunday</span> <span className="text-slate-200 font-bold text-blue-500 uppercase text-[10px] tracking-widest flex items-center">Open for bookings</span></li>
             </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 text-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2024 Dany Clean Pro. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <a href="#" className="hover:text-white">Terms of Service</a>
            
            {/* Admin Authentication */}
            <div className="border-l border-slate-800 pl-6 flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link 
                    to="/admin/dashboard"
                    target="_blank"
                    className="flex flex-col items-end group hover:opacity-80 transition-all border border-blue-500/30 rounded-xl px-3 py-1 bg-blue-500/10"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-300">
                      Admin Dashboard
                    </span>
                    <span className="text-slate-300 font-bold group-hover:text-white transition-colors">{user.email}</span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="p-2 bg-slate-900 hover:bg-red-900/20 hover:text-red-500 rounded-lg transition-all"
                    title="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/admin/login"
                  target="_blank"
                  className="flex items-center gap-2 text-slate-500 hover:text-white font-bold transition-all bg-slate-900 px-4 py-2 rounded-xl border border-slate-800"
                >
                  <Lock size={12} /> Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>

      </Container>
    </footer>
  );
}
