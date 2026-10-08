import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { CalendarClock, CheckCircle2, X, ChevronLeft, ChevronRight, Phone, MapPin } from 'lucide-react';
import { db, isFirebaseReady } from '../../lib/firebase';
import { cn } from '../../lib/utils';

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
  leadId?: string | null;
  source?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday of the week containing this date. */
function weekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return d;
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function ScheduleManager() {
  const queryClient = useQueryClient();
  const [anchor, setAnchor] = useState(() => weekStart(new Date()));

  const from = anchor;
  const to = new Date(anchor.getTime() + 7 * DAY_MS);

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', from.toISOString()],
    queryFn: async () => {
      if (!isFirebaseReady()) return [];
      const q = query(
        collection(db, 'appointments'),
        where('start', '>=', from.toISOString()),
        where('start', '<', to.toISOString()),
        orderBy('start', 'asc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ leadId, action }: { leadId: string; action: 'confirm' | 'release' }) => {
      const res = await fetch('/api/confirm-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, action }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not update');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    onError: (err: any) => alert(`Not updated: ${err.message}`),
  });

  const days = Array.from({ length: 7 }, (_, i) => new Date(from.getTime() + i * DAY_MS));
  const visible = (appointments || []).filter(a => a.status !== 'released');
  const pending = visible.filter(a => a.status === 'pending');

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <span className="block text-label-sm uppercase text-accent mb-2">Operational Control</span>
          <h1 className="font-display text-headline-md text-ink">Schedule</h1>
          <p className="text-body-md text-ink-muted mt-2">
            Times the assistant held are marked pending until you approve them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor(new Date(anchor.getTime() - 7 * DAY_MS))}
            className="w-10 h-10 flex items-center justify-center bg-surface border border-rule text-ink hover:bg-ink hover:text-white transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setAnchor(weekStart(new Date()))}
            className="text-label-md uppercase text-ink hover:text-accent transition-colors px-3"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setAnchor(new Date(anchor.getTime() + 7 * DAY_MS))}
            className="w-10 h-10 flex items-center justify-center bg-surface border border-rule text-ink hover:bg-ink hover:text-white transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 px-6 py-4 mb-8 flex items-center gap-3">
          <CalendarClock size={18} className="text-amber-700 shrink-0" />
          <p className="text-body-md text-ink">
            <strong>{pending.length}</strong> {pending.length === 1 ? 'time is' : 'times are'} waiting for your approval.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-px bg-rule border border-rule">
        {days.map(day => {
          const dayAppointments = visible.filter(
            a => new Date(a.start).toDateString() === day.toDateString(),
          );
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div key={day.toISOString()} className="bg-surface p-4 min-h-[180px]">
              <div className={cn('pb-3 mb-3 border-b', isToday ? 'border-accent' : 'border-rule')}>
                <span className={cn('block text-label-sm uppercase', isToday ? 'text-accent' : 'text-ink-faint')}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="block font-display text-headline-sm text-ink leading-none mt-1">
                  {day.getDate()}
                </span>
              </div>

              {isLoading ? (
                <span className="text-body-sm text-ink-faint">…</span>
              ) : dayAppointments.length === 0 ? (
                <span className="text-body-sm text-ink-faint">—</span>
              ) : (
                <div className="flex flex-col gap-3">
                  {dayAppointments.map(a => (
                    <div
                      key={a.id}
                      className={cn(
                        'p-3 border-l-2',
                        a.status === 'pending'
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-surface-low border-accent',
                      )}
                    >
                      <span className="block text-label-sm uppercase text-ink-faint">
                        {time(a.start)} – {time(a.end)}
                      </span>
                      <span className="block text-body-md font-semibold text-ink mt-1 leading-tight">
                        {a.name || 'New client'}
                      </span>
                      {a.service_type && (
                        <span className="block text-body-sm text-ink-muted">{a.service_type}</span>
                      )}
                      {a.phone && (
                        <a
                          href={`tel:${String(a.phone).replace(/\D/g, '')}`}
                          className="flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-accent transition-colors mt-1"
                        >
                          <Phone size={11} /> {a.phone}
                        </a>
                      )}
                      {(a.city || a.address) && (
                        <span className="flex items-center gap-1.5 text-body-sm text-ink-muted mt-0.5">
                          <MapPin size={11} /> {a.address || a.city}
                        </span>
                      )}

                      {a.status === 'pending' && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            disabled={decide.isPending || !a.leadId}
                            title={a.leadId ? undefined : 'This hold is not linked to a lead'}
                            onClick={() => decide.mutate({ leadId: String(a.leadId), action: 'confirm' })}
                            className="inline-flex items-center gap-1 bg-ink text-white text-label-sm uppercase px-2.5 py-1.5 hover:bg-accent transition-colors disabled:opacity-40"
                          >
                            <CheckCircle2 size={11} /> OK
                          </button>
                          <button
                            type="button"
                            disabled={decide.isPending || !a.leadId}
                            onClick={() => {
                              if (confirm('Release this time? The slot is freed and the customer is not booked.')) {
                                decide.mutate({ leadId: String(a.leadId), action: 'release' });
                              }
                            }}
                            className="inline-flex items-center gap-1 text-label-sm uppercase text-ink-muted hover:text-red-600 transition-colors disabled:opacity-40"
                          >
                            <X size={11} /> Drop
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isFirebaseReady() && (
        <p className="mt-6 text-body-sm text-ink-muted">
          Not connected to the database — the schedule cannot be read right now.
        </p>
      )}
    </div>
  );
}
