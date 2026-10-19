import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Phone, MapPin, Check, X, CalendarDays, AlertCircle } from 'lucide-react';
import { list, create, update } from '../../lib/data';
import { cn } from '../../lib/utils';
import Button from '../../components/admin/ui/Button';

interface Appointment {
  id: string;
  start: string;
  end: string;
  status: 'pending' | 'confirmed' | 'released';
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  service_type?: string | null;
  notes?: string | null;
  source?: string | null;
}

const DAY_MS = 86_400_000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const atMidnight = (d: Date) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };

/** The Monday on or before the first of this month, so the grid starts clean. */
function gridStart(month: Date): Date {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const shift = (first.getDay() + 6) % 7;
  return new Date(first.getTime() - shift * DAY_MS);
}

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** `2026-10-19T14:00` in local time, which is what a date+time input gives. */
function localISO(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

const STATUS = {
  pending:   { dot: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700',       label: 'Waiting for you' },
  confirmed: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700',   label: 'Confirmed' },
  released:  { dot: 'bg-slate-300',   chip: 'bg-slate-100 text-slate-500',      label: 'Cancelled' },
} as const;

export default function ScheduleManager() {
  const queryClient = useQueryClient();
  const today = atMidnight(new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = gridStart(month);
  const cells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => new Date(from.getTime() + i * DAY_MS)),
    [from.getTime()],
  );
  const to = new Date(from.getTime() + 42 * DAY_MS);

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', from.toISOString()],
    queryFn: () => list<Appointment>('appointments', { orderBy: 'start', limit: 400 }),
    select: rows => rows.filter(a => {
      const t = new Date(a.start).getTime();
      return t >= from.getTime() && t < to.getTime();
    }),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments || []) {
      const key = atMidnight(new Date(a.start)).toDateString();
      map.set(key, [...(map.get(key) || []), a]);
    }
    for (const list of map.values()) list.sort((x, y) => x.start.localeCompare(y.start));
    return map;
  }, [appointments]);

  const dayList = (byDay.get(selected.toDateString()) || []).filter(a => a.status !== 'released');
  const waiting = (appointments || []).filter(a => a.status === 'pending').length;

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'confirmed' | 'released' }) =>
      update('appointments', id, { status }),
    onSuccess: () => { setError(null); queryClient.invalidateQueries({ queryKey: ['appointments'] }); },
    onError: (e: any) => setError(e?.message || 'Could not update that booking.'),
  });

  const add = useMutation({
    mutationFn: (fields: Record<string, any>) => create('appointments', fields),
    onSuccess: () => {
      setAdding(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (e: any) => setError(e?.message || 'Could not save that booking.'),
  });

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-7">
        <div>
          <h1 className="font-sans text-2xl sm:text-[28px] font-bold tracking-[-0.02em] text-slate-900">Schedule</h1>
          <p className="text-[15px] text-slate-500 mt-1">
            {waiting > 0
              ? <>The assistant held <strong className="text-amber-700 font-semibold">{waiting}</strong> {waiting === 1 ? 'time' : 'times'} that need your approval.</>
              : 'Everything here is confirmed. Add a job whenever you need to.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="w-9 h-9 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Previous month"
            ><ChevronLeft size={17} /></button>
            <span className="px-3 text-sm font-semibold text-slate-900 min-w-[132px] text-center tabular-nums">
              {monthLabel}
            </span>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="w-9 h-9 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Next month"
            ><ChevronRight size={17} /></button>
          </div>
          <Button tone="quiet" size="md" onClick={() => {
            setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelected(today);
          }}>Today</Button>
          <Button tone="primary" size="md" icon={<Plus size={16} />} onClick={() => { setAdding(true); setError(null); }}>
            New job
          </Button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        {/* Month grid */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-3 text-center text-[11px] font-semibold tracking-wide text-slate-400">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const inMonth = day.getMonth() === month.getMonth();
              const isToday = sameDay(day, today);
              const isSelected = sameDay(day, selected);
              const items = (byDay.get(day.toDateString()) || []).filter(a => a.status !== 'released');

              return (
                <button
                  key={i}
                  onClick={() => setSelected(atMidnight(day))}
                  className={cn(
                    'relative min-h-[92px] p-2 text-left border-b border-r border-slate-100 transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600',
                    i % 7 === 6 && 'border-r-0',
                    inMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60',
                    isSelected && 'bg-blue-50 hover:bg-blue-50',
                  )}
                >
                  <span className={cn(
                    'inline-grid place-items-center w-7 h-7 rounded-full text-[13px] tabular-nums',
                    !inMonth && 'text-slate-300',
                    inMonth && !isToday && 'text-slate-700',
                    isToday && 'bg-blue-600 text-white font-bold',
                    isSelected && !isToday && 'font-bold text-blue-700',
                  )}>{day.getDate()}</span>

                  <div className="mt-1 space-y-1">
                    {items.slice(0, 2).map(a => (
                      <div key={a.id} className="flex items-center gap-1.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS[a.status].dot)} />
                        <span className="text-[11px] text-slate-600 truncate">
                          {clock(a.start)} {a.name || 'Job'}
                        </span>
                      </div>
                    ))}
                    {items.length > 2 && (
                      <span className="text-[11px] text-slate-400 pl-3">+{items.length - 2} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Day panel */}
        <aside className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-sans text-[17px] font-bold text-slate-900">
              {selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            {sameDay(selected, today) && <span className="text-xs font-semibold text-blue-600">Today</span>}
          </div>

          {adding ? (
            <NewJobForm
              date={selected}
              busy={add.isPending}
              onCancel={() => setAdding(false)}
              onSave={fields => add.mutate(fields)}
            />
          ) : isLoading ? (
            <div className="space-y-3">
              {[0, 1].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : dayList.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays size={28} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 mb-4">Nothing booked for this day.</p>
              <Button tone="quiet" size="sm" icon={<Plus size={15} />} onClick={() => setAdding(true)}>
                Add a job
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {dayList.map(a => (
                <li key={a.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 tabular-nums">
                        {clock(a.start)} – {clock(a.end)}
                      </p>
                      <p className="text-sm text-slate-600 truncate">{a.name || 'No name given'}</p>
                    </div>
                    <span className={cn('shrink-0 text-[11px] font-semibold px-2 py-1 rounded-md', STATUS[a.status].chip)}>
                      {STATUS[a.status].label}
                    </span>
                  </div>

                  {(a.phone || a.city || a.address) && (
                    <div className="space-y-1 mb-3">
                      {a.phone && (
                        <a href={`tel:${a.phone}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors">
                          <Phone size={13} /> {a.phone}
                        </a>
                      )}
                      {(a.address || a.city) && (
                        <p className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin size={13} /> <span className="truncate">{[a.address, a.city].filter(Boolean).join(', ')}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {a.service_type && (
                    <p className="text-[13px] text-slate-500 mb-3">{a.service_type}</p>
                  )}

                  {a.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button tone="go" size="sm" icon={<Check size={15} />}
                        busy={decide.isPending && decide.variables?.id === a.id && decide.variables.status === 'confirmed'}
                        onClick={() => decide.mutate({ id: a.id, status: 'confirmed' })}>
                        Confirm
                      </Button>
                      <Button tone="quiet" size="sm" icon={<X size={15} />}
                        busy={decide.isPending && decide.variables?.id === a.id && decide.variables.status === 'released'}
                        onClick={() => decide.mutate({ id: a.id, status: 'released' })}>
                        Release
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Adding a job by hand — the reason this page exists for the owner. */
function NewJobForm({ date, busy, onCancel, onSave }: {
  date: Date;
  busy: boolean;
  onCancel: () => void;
  onSave: (fields: Record<string, any>) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [service, setService] = useState('Standard cleaning');
  const [startTime, setStartTime] = useState('09:00');
  const [hours, setHours] = useState('3');

  const field = 'w-full h-11 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-shadow';
  const label = 'block text-[13px] font-medium text-slate-600 mb-1.5';

  return (
    <form
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault();
        const start = localISO(date, startTime);
        const end = new Date(new Date(start).getTime() + Number(hours || 2) * 3_600_000).toISOString();
        onSave({
          start, end, status: 'confirmed',
          name: name.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          service_type: service,
          source: 'added by owner',
        });
      }}
    >
      <div>
        <label className={label} htmlFor="job-name">Client</label>
        <input id="job-name" className={field} value={name} onChange={e => setName(e.target.value)}
               placeholder="Who is it for?" autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="job-start">Starts</label>
          <input id="job-start" type="time" required className={cn(field, 'tabular-nums')}
                 value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="job-hours">Hours</label>
          <input id="job-hours" type="number" min="1" max="12" step="0.5" required
                 className={cn(field, 'tabular-nums')} value={hours} onChange={e => setHours(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="job-phone">Phone</label>
        <input id="job-phone" className={field} value={phone} onChange={e => setPhone(e.target.value)}
               placeholder="So you can reach them" />
      </div>

      <div>
        <label className={label} htmlFor="job-address">Address</label>
        <input id="job-address" className={field} value={address} onChange={e => setAddress(e.target.value)}
               placeholder="Where the team is going" />
      </div>

      <div>
        <label className={label} htmlFor="job-service">Service</label>
        <select id="job-service" className={field} value={service} onChange={e => setService(e.target.value)}>
          {['Standard cleaning', 'Deep cleaning', 'Move-in / move-out', 'Post-event',
            'Post-construction', 'Office / commercial', 'Airbnb turnover'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" tone="primary" size="md" busy={busy} className="flex-1">Save job</Button>
        <Button type="button" tone="ghost" size="md" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
