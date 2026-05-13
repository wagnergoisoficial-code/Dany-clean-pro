import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, LogOut, Lock, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from './ui/Container';
import { useAdminAuth } from '../lib/auth';

export default function Footer() {
  const { user, login, logout, isAdmin } = useAdminAuth();

  const handleLogin = async () => {
    await login();
  };

  return (
    <footer className="bg-slate-950 text-slate-400 py-20 pb-10">
      <Container>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">D</div>
              <span className="text-white font-bold text-xl">Dany Clean <span className="text-blue-500">Pro</span></span>
            </div>
            <p className="text-sm leading-relaxed">
              Atendendo residências e empresas em Connecticut com limpeza profissional e foco na família desde 2014. Qualidade em que você pode confiar, preços que você pode pagar.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-blue-500 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-blue-500 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-blue-500 transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6">Links Rápidos</h4>
             <ul className="space-y-4 text-sm">
               <li><a href="#services" className="hover:text-white transition-colors">Serviços de Limpeza</a></li>
               <li><a href="#gallery" className="hover:text-white transition-colors">Nossa Galeria</a></li>
               <li><a href="#reviews" className="hover:text-white transition-colors">Avaliações</a></li>
               <li><a href="#areas" className="hover:text-white transition-colors">Áreas de Atendimento</a></li>
               <li><a href="#quote" className="hover:text-white transition-colors">Pedir Orçamento</a></li>
             </ul>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6">Contatos</h4>
             <ul className="space-y-4 text-sm">
               <li className="flex items-center gap-3">
                 <Phone size={16} className="text-blue-500" /> 
                 <a href="tel:+14753413699" className="hover:text-white transition-colors">(475) 341-3699</a>
               </li>
               <li className="flex items-center gap-3">
                 <Mail size={16} className="text-blue-500" /> 
                 <a href="mailto:danycleanenpro@gmail.com" className="hover:text-white transition-colors">danycleanenpro@gmail.com</a>
               </li>
               <li className="flex items-center gap-3"><MapPin size={16} className="text-blue-500" /> Stamford, CT e Região</li>
             </ul>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6">Horário de Funcionamento</h4>
             <ul className="space-y-4 text-sm">
               <li className="flex justify-between"><span>Seg - Sex</span> <span className="text-slate-200">8am - 6pm</span></li>
               <li className="flex justify-between"><span>Sábado</span> <span className="text-slate-200">9am - 4pm</span></li>
               <li className="flex justify-between"><span>Domingo</span> <span className="text-slate-200 font-bold text-blue-500 uppercase text-[10px] tracking-widest flex items-center">Aberto para reservas</span></li>
             </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 text-xs flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2024 Dany Clean Pro. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white">Política de Privacidade</a>
            <a href="#" className="hover:text-white">Termos de Serviço</a>
            
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
                      Painel Administrativo
                    </span>
                    <span className="text-slate-300 font-bold group-hover:text-white transition-colors">{user.email}</span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="p-2 bg-slate-900 hover:bg-red-900/20 hover:text-red-500 rounded-lg transition-all"
                    title="Sair"
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
                  <Lock size={12} /> Login Admin
                </Link>
              )}
            </div>
          </div>
        </div>

      </Container>
    </footer>
  );
}
