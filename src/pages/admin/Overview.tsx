import { Users, Calendar, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';
import { Lead } from '../../types';

interface OverviewProps {
  leads: Lead[];
  isLoading: boolean;
}

export default function Overview({ leads, isLoading }: OverviewProps) {
  const count = (status: string) => leads?.filter(l => l.status === status)?.length || 0;

  const stats = [
    { index: '01', label: 'New Leads', hint: 'Awaiting first contact', value: count('new'), icon: Users },
    { index: '02', label: 'Scheduled', hint: 'Visit booked', value: count('scheduled'), icon: Calendar },
    { index: '03', label: 'Completed', hint: 'Service delivered', value: count('completed'), icon: CheckCircle2 },
    { index: '04', label: 'Total Leads', hint: 'All time, every source', value: leads?.length || 0, icon: Clock },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-10">
        <span className="block text-label-sm uppercase text-accent mb-2">Operational Control</span>
        <h1 className="font-display text-headline-md text-ink">Dashboard Overview</h1>
        <p className="text-body-md text-ink-muted mt-2">
          Every lead captured by the site, the SMS receptionist and the AI call line lands here.
        </p>
      </div>

      {/* Ledger of counts — no cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-rule border border-rule mb-10">
        {stats.map((stat) => (
          <div key={stat.index} className="bg-surface p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-label-sm text-accent tabular-nums">{stat.index}</span>
              <stat.icon size={16} className="text-ink-faint" />
            </div>
            <p className="font-display text-headline-lg text-ink leading-none mb-2 tabular-nums">
              {isLoading ? '—' : stat.value}
            </p>
            <p className="text-label-md uppercase text-ink">{stat.label}</p>
            <p className="text-body-sm text-ink-muted mt-1">{stat.hint}</p>
          </div>
        ))}
      </div>

      {/* Status note */}
      <div className="bg-ink text-white p-8 lg:p-10">
        <span className="block text-label-sm uppercase text-white/50 mb-3">Platform Status</span>
        <h2 className="font-display text-headline-sm text-white mb-4 max-w-2xl">
          CRM modular evolution
        </h2>
        <p className="text-body-md text-white/70 max-w-2xl mb-8">
          The admin panel is being built out into a full operational CRM. The structure below is live;
          customer management and automated scheduling arrive in the next phase.
        </p>
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/10 border-y border-white/10">
          {[
            { state: 'done', label: 'Modular architecture' },
            { state: 'done', label: 'Editorial layout' },
            { state: 'next', label: 'Customer module (phase 2)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-4 sm:px-6 sm:first:pl-0">
              {item.state === 'done'
                ? <CheckCircle2 size={14} className="text-white shrink-0" />
                : <ArrowUpRight size={14} className="text-white/40 shrink-0" />}
              <span className={item.state === 'done' ? "text-label-md uppercase text-white" : "text-label-md uppercase text-white/50"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
