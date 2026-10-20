import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PanelOverview from './PanelOverview';
import { Dialog, ConfirmDialog } from '../../components/admin/panel/Dialog';
import { useToast } from '../../components/admin/panel/Toasts';
import { Lead } from '../../types';
import { create, update, remove } from '../../lib/data';

interface Appointment {
  id: string; start: string; end: string;
  status: 'pending' | 'confirmed' | 'released';
  name?: string | null; phone?: string | null; city?: string | null;
  address?: string | null; service_type?: string | null; source?: string | null;
}

const SERVICES = ['Standard cleaning', 'Deep cleaning', 'Move-in / move-out',
                  'Post-event', 'Post-construction', 'Office / commercial', 'Airbnb turnover'];

/** `2026-10-20T14:00` local, que é o que os campos de data e hora devolvem. */
function localISO(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).toISOString();
}
const dayOf = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const timeOf = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

/**
 * Liga a composição aprovada às operações reais.
 *
 * Nada aqui usa o armazenamento local do protótipo: cada gravação vai para
 * /api/data, que confirma no servidor quem está a pedir antes de escrever.
 */
export default function PanelHome({ leads, isLoading, search }: { leads: Lead[]; isLoading: boolean; search: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Appointment | null>(null);
  const [error, setError] = useState('');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });

  const save = useMutation({
    mutationFn: async (fields: Record<string, any> & { id?: string }) => {
      const { id, ...rest } = fields;
      if (id) { await update('appointments', id, rest); return id; }
      return create('appointments', rest);
    },
    onSuccess: (_data, variables) => {
      setAdding(false); setEditing(null); setError(''); refresh();
      toast(variables.id ? 'Job updated.' : 'Job added to the calendar.');
    },
    onError: (err: any) => setError(err?.message || 'Could not save that job.'),
  });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'confirmed' | 'released' }) =>
      update('appointments', id, { status }),
    onSuccess: (_d, variables) => { refresh(); toast(variables.status === 'confirmed' ? 'Job confirmed.' : 'Slot released.'); },
    onError: (err: any) => toast(err?.message || 'Could not update that job.', { error: true }),
  });

  const destroy = useMutation({
    mutationFn: (job: Appointment) => remove('appointments', job.id),
    onSuccess: (_d, job) => {
      refresh();
      // O ficheiro oferece "Desfazer" depois de apagar; aqui isso significa
      // voltar a criar o registo, porque não há lixeira do lado do servidor.
      toast('Job deleted.', { action: { label: 'Undo', run: () => save.mutate({
        start: job.start, end: job.end, status: job.status, name: job.name,
        phone: job.phone, city: job.city, address: job.address, service_type: job.service_type,
      }) } });
    },
    onError: (err: any) => toast(err?.message || 'Could not delete that job.', { error: true }),
  });

  const exportCsv = (rows: Appointment[]) => {
    const cell = (value: unknown) => {
      let text = String(value ?? '');
      // Um valor que começa por = + @ - é lido como fórmula ao abrir num Excel.
      if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const lines = [['Client', 'Starts', 'Ends', 'Status', 'Service', 'Phone', 'Town', 'Address'],
      ...rows.map(r => [r.name, r.start, r.end, r.status, r.service_type, r.phone, r.city, r.address])];
    const csv = '﻿' + lines.map(line => line.map(cell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Export ready with ${rows.length} ${rows.length === 1 ? 'job' : 'jobs'}.`);
  };

  const job = editing;
  const open = adding || !!editing;

  return (
    <>
      <PanelOverview
        leads={leads}
        isLoading={isLoading}
        search={search}
        onNewJob={() => { setError(''); setEditing(null); setAdding(true); }}
        onEditJob={item => { setError(''); setAdding(false); setEditing(item); }}
        onDecide={(item, status) => decide.mutate({ id: item.id, status })}
        onDelete={item => setRemoving(item)}
        onExport={exportCsv}
      />

      <Dialog
        open={open}
        onClose={() => { setAdding(false); setEditing(null); setError(''); }}
        title={job ? 'Edit job' : 'New job'}
        subtitle="Set the details for this cleaning."
        labelledBy="adm-job-title"
        footer={<>
          <button type="button" className="button" onClick={() => { setAdding(false); setEditing(null); }}>Cancel</button>
          <button type="submit" form="adm-job-form" className="button button-primary" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : job ? 'Save job' : 'Create job'}
          </button>
        </>}
      >
        <form id="adm-job-form" onSubmit={event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const name = String(form.get('name') || '').trim();
          const date = String(form.get('date') || '');
          const time = String(form.get('time') || '');
          const hours = Number(form.get('hours') || 3);
          if (!date || !time) { setError('Choose a day and a time.'); return; }
          const start = localISO(date, time);
          save.mutate({
            id: job?.id,
            start,
            end: new Date(new Date(start).getTime() + hours * 3_600_000).toISOString(),
            status: String(form.get('status') || 'confirmed'),
            name: name || null,
            phone: String(form.get('phone') || '').trim() || null,
            city: String(form.get('city') || '').trim() || null,
            address: String(form.get('address') || '').trim() || null,
            service_type: String(form.get('service') || SERVICES[0]),
            source: job?.source || 'added by owner',
          });
        }}>
          <div className="field">
            <label htmlFor="adm-job-name">Client</label>
            <input id="adm-job-name" name="name" maxLength={100} defaultValue={job?.name || ''}
                   placeholder="Who is it for?" autoFocus />
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="adm-job-date">Day *</label>
              <input id="adm-job-date" name="date" type="date" required
                     defaultValue={job ? dayOf(job.start) : dayOf(new Date().toISOString())} />
            </div>
            <div className="field">
              <label htmlFor="adm-job-time">Starts *</label>
              <input id="adm-job-time" name="time" type="time" required
                     defaultValue={job ? timeOf(job.start) : '09:00'} />
            </div>
            <div className="field">
              <label htmlFor="adm-job-hours">Hours</label>
              <input id="adm-job-hours" name="hours" type="number" min="1" max="12" step="0.5"
                     defaultValue={job ? Math.max(1, Math.round((new Date(job.end).getTime() - new Date(job.start).getTime()) / 3_600_000)) : 3} />
            </div>
            <div className="field">
              <label htmlFor="adm-job-status">Status</label>
              <select id="adm-job-status" name="status" defaultValue={job?.status || 'confirmed'}>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Waiting for you</option>
                <option value="released">Released</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="adm-job-phone">Phone</label>
              <input id="adm-job-phone" name="phone" maxLength={40} defaultValue={job?.phone || ''}
                     placeholder="So you can reach them" />
            </div>
            <div className="field">
              <label htmlFor="adm-job-service">Service</label>
              <select id="adm-job-service" name="service" defaultValue={job?.service_type || SERVICES[0]}>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="adm-job-city">Town</label>
              <input id="adm-job-city" name="city" maxLength={90} defaultValue={job?.city || ''} placeholder="Waterbury" />
            </div>
            <div className="field">
              <label htmlFor="adm-job-address">Address</label>
              <input id="adm-job-address" name="address" maxLength={160} defaultValue={job?.address || ''}
                     placeholder="Where the team is going" />
            </div>
          </div>

          {error && <div className="dialog-error" role="alert">{error}</div>}
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        title="Delete job?"
        copy={removing ? `The job for ${removing.name || 'this client'} will be removed from the calendar. You can undo it from the notice that follows.` : ''}
        confirmLabel="Delete job"
        onConfirm={() => removing && destroy.mutate(removing)}
        onClose={() => setRemoving(null)}
      />
    </>
  );
}
