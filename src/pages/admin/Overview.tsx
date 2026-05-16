import { Users, Calendar, CheckCircle2, LayoutDashboard, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Lead } from '../../types';

interface OverviewProps {
  leads: Lead[];
  isLoading: boolean;
}

export default function Overview({ leads, isLoading }: OverviewProps) {
  const stats = [
    { 
      label: 'New Leads', 
      value: leads?.filter(l => l.status === 'new')?.length || 0, 
      icon: Users, 
      color: 'text-blue-600 bg-blue-50',
      trend: '+12%'
    },
    { 
      label: 'Scheduled', 
      value: leads?.filter(l => l.status === 'scheduled')?.length || 0, 
      icon: Calendar, 
      color: 'text-green-600 bg-green-50',
      trend: '+5%'
    },
    { 
      label: 'Completed', 
      value: leads?.filter(l => l.status === 'completed')?.length || 0, 
      icon: CheckCircle2, 
      color: 'text-purple-600 bg-purple-50',
      trend: '+18%'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm">Welcome back to your operational control center.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
             <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-widest">
                  {stat.trend} <ArrowUpRight size={10} />
                </span>
             </div>
             <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
             <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Welcome Card for CRM Transition */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-blue-600/20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">CRM Modular Evolution</h2>
          <p className="text-blue-100 mb-6 leading-relaxed">
            We are currently transitioning your admin panel into a full operational CRM. 
            This structural update improves reliability and prepares the ground for advanced features like 
            customer management, automated scheduling, and route optimization.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium border border-white/10">
              ✓ Modular Architecture
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium border border-white/10">
              ✓ Improved Layout
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium border border-white/10">
              ⌛ Customer Module (Phase 2)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
