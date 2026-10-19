import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Phone, CalendarDays, Plus } from 'lucide-react';
import { Lead } from '../../types';
import { list } from '../../lib/data';
import { PageHeader, Panel, PanelHeader, Empty, Skeleton } from '../../components/admin/ui/Panel';
import { Badge } from '../../components/admin/ui/Table';
import Button from '../../components/admin/ui/Button';

interface OverviewProps {
  leads: Lead[];
  isLoading: boolean;
}

interface Appointment {
  id: string; start: string; end: string;
  status: 'pending' | 'confirmed' | 'released';
  name?: string | null; city?: string | null;
}

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const whenWords = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const mins = Math.round((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  const days = Math.round(mins / 1440);
  return days === 1 ? 'yesterday' : `${days}d ago`;
};

function leadTime(lead: any): string | null {
  const raw = lead?.createdAt;
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  if (raw?.toDate) return raw.toDate().toISOString();
  if (raw?.seconds) return new Date(raw.seconds * 1000).toISOString();
  return null;
}

export default function Overview({ leads, isLoading }: OverviewProps) {
  const count = (status: string) => leads?.filter(l => l.status === status)?.length || 0;

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ['appointments-overview'],
    queryFn: () => list<Appointment>('appointments', { orderBy: 'start', limit: 200 }),
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const todays = (appointments || [])
    .filter(a => a.status !== 'released')
    .filter(a => { const t = new Date(a.start).getTime(); return t >= today.getTime() && t < tomorrow.getTime(); });

  const waiting = (appointments || []).filter(a => a.status === 'pending').length;

  const recent = [...(leads || [])]
    .sort((a, b) => (leadTime(b) || '').localeCompare(leadTime(a) || ''))
    .slice(0, 6);

  /**
   * Four numbers, stated plainly.
   *
   * No icon beside each one and no card around it. An icon next to a number
   * adds nothing a reader did not get from the word underneath it, and four
   * boxes in a row is the shape everyone recognises as a template. They sit on
   * one surface, divided, which also lets the numbers line up.
   */
  const figures = [
    { label: 'New leads', hint: 'Not contacted yet', value: count('new'), to: '/admin/dashboard/leads' },
    { label: 'Scheduled', hint: 'Visit booked', value: count('scheduled'), to: '/admin/dashboard/schedule' },
    { label: 'Completed', hint: 'Service delivered', value: count('completed'), to: '/admin/dashboard/leads' },
    { label: 'All leads', hint: 'Every source, all time', value: leads?.length || 0, to: '/admin/dashboard/leads' },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title="Overview"
        hint="Everything the site, the text line and the phone assistant brought in."
        actions={
          <Link to="/admin/dashboard/schedule">
            <Button intent="blue" icon={<Plus size={16} />}>New job</Button>
          </Link>
        }
      />

      {waiting > 0 && (
        <Link
          to="/admin/dashboard/schedule"
          className="flex items-center gap-3 bg-amber-50 text-amber-800 rounded-xl px-4 py-3 mb-5 hover:bg-amber-100 transition-colors group"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <p className="text-sm font-medium">
            The assistant held <strong className="font-bold">{waiting}</strong> {waiting === 1 ? 'time' : 'times'} waiting for you to confirm.
          </p>
          <ArrowRight size={15} className="ml-auto shrink-0 transition-transform duration-200 ease-[var(--ease-out-quint)] group-hover:translate-x-0.5" />
        </Link>
      )}

      <Panel flush className="mb-6 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-900/[0.06]">
          {figures.map(f => (
            <Link key={f.label} to={f.to} className="p-5 hover:bg-slate-50/70 transition-colors">
              <p className="font-sans text-[30px] font-bold text-slate-900 leading-none tabular-nums tracking-[-0.02em]">
                {isLoading ? <Skeleton className="h-7 w-10" /> : f.value}
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-2.5">{f.label}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{f.hint}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start">
        <Panel>
          <PanelHeader
            title="Latest leads"
            hint="Newest first"
            actions={
              <Link to="/admin/dashboard/leads">
                <Button intent="neutral" variant="bare" size="sm" iconAfter={<ArrowRight size={14} />}>See all</Button>
              </Link>
            }
          />

          {isLoading ? (
            <div className="space-y-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : recent.length === 0 ? (
            <Empty
              icon={<Phone size={19} />}
              title="No leads yet"
              hint="They arrive here from the quote form, a text message, or a call the assistant answers."
            />
          ) : (
            <ul className="divide-y divide-slate-900/[0.05] -mb-1">
              {recent.map(lead => {
                const at = leadTime(lead);
                return (
                  <li key={String(lead.id)}>
                    <Link to="/admin/dashboard/leads"
                          className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{lead.name || 'No name given'}</p>
                        <p className="text-[13px] text-slate-500 truncate">
                          {[lead.phone, (lead as any).city].filter(Boolean).join(' · ') || 'No contact details'}
                        </p>
                      </div>
                      {lead.status === 'new'
                        ? <Badge tone="blue" dot>New</Badge>
                        : <Badge tone="neutral">{String(lead.status || 'unknown')}</Badge>}
                      {at && <span className="hidden sm:block text-[12px] text-slate-400 w-16 text-right shrink-0 tabular-nums">{whenWords(at)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Today"
            hint={today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            actions={
              <Link to="/admin/dashboard/schedule">
                <Button intent="neutral" variant="bare" size="sm" iconAfter={<ArrowRight size={14} />}>Calendar</Button>
              </Link>
            }
          />

          {todays.length === 0 ? (
            <Empty
              icon={<CalendarDays size={19} />}
              title="Nothing booked today"
              hint="A free day, or a day to fill."
              action={
                <Link to="/admin/dashboard/schedule">
                  <Button intent="neutral" variant="ghost" size="sm" icon={<Plus size={15} />}>Add a job</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {todays.map(a => (
                <li key={a.id} className="flex items-start gap-3 rounded-lg ring-1 ring-slate-900/[0.06] p-3">
                  <span className="text-[13px] font-bold text-slate-900 tabular-nums w-[70px] shrink-0 pt-0.5">
                    {clock(a.start)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.name || 'Job'}</p>
                    {a.city && <p className="text-[12px] text-slate-500 truncate">{a.city}</p>}
                  </div>
                  {a.status === 'pending' && <Badge tone="amber">Waiting</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
