import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../components/admin/panel/Icons';
import { CoinsArt, LayersArt, RingArt } from '../../components/admin/panel/FeatureArt';
import { list } from '../../lib/data';
import { Lead } from '../../types';

/**
 * Visão geral — composição do ficheiro aprovado, conteúdo da Dany.
 *
 * O ficheiro trazia três blocos para criar campanhas, ofertas e eventos, e uma
 * lista de "atividades" com categorias. Este negócio não tem campanhas: tem
 * trabalhos marcados, pedidos de orçamento e clientes. Os três blocos passam a
 * ser as três coisas que ela realmente começa aqui, e a lista mostra os
 * trabalhos — mesma grelha, mesma miniatura, mesmos estados, mesmos botões.
 */
interface Appointment {
  id: string; start: string; end: string;
  status: 'pending' | 'confirmed' | 'released';
  name?: string | null; phone?: string | null; city?: string | null;
  address?: string | null; service_type?: string | null; source?: string | null;
}

const KINDS = {
  confirmed: { thumb: 'thumb-green',  headline: 'CONFIRMED', sub: 'ON THE CALENDAR', label: 'Confirmed' },
  pending:   { thumb: 'thumb-yellow', headline: 'WAITING',    sub: 'NEEDS YOUR OK',   label: 'Waiting for you' },
  released:  { thumb: 'thumb-blue',   headline: 'RELEASED',   sub: 'SLOT GIVEN BACK', label: 'Released' },
} as const;

const STATUS_CLASS: Record<string, string> = {
  confirmed: 'status-active', pending: 'status-paused', released: 'status-ended',
};

const clock = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

interface Props {
  leads: Lead[];
  isLoading: boolean;
  search: string;
  onNewJob: () => void;
  onEditJob: (job: Appointment) => void;
  onDecide: (job: Appointment, status: 'confirmed' | 'released') => void;
  onDelete: (job: Appointment) => void;
  onExport: (rows: Appointment[]) => void;
}

export default function PanelOverview({
  leads, isLoading, search, onNewJob, onEditJob, onDecide, onDelete, onExport,
}: Props) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');

  const { data: jobs } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: () => list<Appointment>('appointments', { orderBy: 'start', limit: 400 }),
  });

  const all = jobs || [];
  const term = (query || search).trim().toLowerCase();

  const visible = useMemo(() => all.filter(job =>
    (tab === 'all' || job.status === tab)
    && (kind === 'all' || (job.service_type || '').toLowerCase().includes(kind))
    && (!term || `${job.name || ''} ${job.city || ''} ${job.service_type || ''}`.toLowerCase().includes(term))
  ), [all, tab, kind, term]);

  const counts = {
    all: all.length,
    confirmed: all.filter(j => j.status === 'confirmed').length,
    pending: all.filter(j => j.status === 'pending').length,
  };

  const today = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  const newLeads = leads.filter(l => l.status === 'new').length;

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="breadcrumb"><span>Workspace</span><Icon name="right" /><span>Overview</span></div>
          <h1>Operations panel</h1>
          <p>Your jobs, your leads and your settings, in one place.</p>
        </div>
        <div className="heading-actions">
          <button className="button export-button" onClick={() => onExport(visible)} aria-label="Export the job list">
            <Icon name="download" /><span className="export-label">Export</span>
          </button>
          <button className="button button-primary" onClick={onNewJob}>
            <Icon name="plus" /><span className="new-label">New job</span>
          </button>
        </div>
      </section>

      <section className="hero-grid" aria-label="Start something">
        <article className="feature feature-blue">
          <div className="eyebrow">BOOK THE WORK</div>
          <h2>New cleaning job</h2>
          <p>Put a job on the calendar<br />and keep the day straight.</p>
          <button className="feature-action" onClick={onNewJob}>Add a job<Icon name="arrow" /></button>
          <CoinsArt />
        </article>

        <article className="feature feature-green">
          <div className="eyebrow">ANSWER FIRST</div>
          <h2>{newLeads > 0 ? `${newLeads} new ${newLeads === 1 ? 'lead' : 'leads'}` : 'Leads'}</h2>
          <p>From the site, the text line<br />and the phone assistant.</p>
          <button className="feature-action" onClick={() => navigate('/admin/dashboard/leads')}>Open leads<Icon name="arrow" /></button>
          <LayersArt />
        </article>

        <article className="feature feature-yellow">
          <div className="eyebrow">SHOW YOUR WORK</div>
          <h2>Photos and reviews</h2>
          <p>What customers see<br />before they call you.</p>
          <button className="feature-action" onClick={() => navigate('/admin/dashboard/gallery')}>Open gallery<Icon name="arrow" /></button>
          <RingArt />
        </article>
      </section>

      <section className="activities-section" aria-label="Jobs">
        <div className="section-heading">
          <div><h2>Jobs and bookings</h2><p>Follow, confirm and organise what is happening.</p></div>
          <span className="section-meta"><Icon name="activity" /><span>{today}</span></span>
        </div>

        <div className="activity-shell">
          <div className="tabs" role="tablist" aria-label="Job status">
            {([['all', 'All jobs'], ['confirmed', 'Confirmed'], ['pending', 'Waiting for you']] as const).map(([key, label]) => (
              <button type="button" key={key} className="tab" role="tab"
                      aria-selected={tab === key} tabIndex={tab === key ? 0 : -1}
                      onClick={() => setTab(key)}>
                {label}<span className="tab-count">{counts[key]}</span>
              </button>
            ))}
          </div>

          <form className="filters" role="search" aria-label="Filter jobs" onSubmit={e => e.preventDefault()}>
            <div className="filter-field">
              <label htmlFor="adm-job-search">Client or town</label>
              <input id="adm-job-search" type="search" placeholder="Type a name to search"
                     autoComplete="off" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div className="filter-field">
              <label htmlFor="adm-job-kind">Service</label>
              <select id="adm-job-kind" value={kind} onChange={e => setKind(e.target.value)}>
                <option value="all">All services</option>
                <option value="standard">Standard cleaning</option>
                <option value="deep">Deep cleaning</option>
                <option value="move">Move-in / move-out</option>
                <option value="post-event">Post-event</option>
                <option value="office">Office / commercial</option>
              </select>
            </div>
            <button className="button button-blue" type="submit">Search</button>
            <button className="button button-primary publish-button" type="button" onClick={onNewJob}>
              <Icon name="plus" />Add job
            </button>
          </form>

          <div role="tabpanel" tabIndex={0}>
            <div className="activity-list">
              {visible.map(job => {
                const kindInfo = KINDS[job.status] || KINDS.released;
                const next = job.status === 'confirmed' ? 'Release' : 'Confirm';
                return (
                  <article className="activity-row" key={job.id}>
                    <div className={`activity-thumb ${kindInfo.thumb}`} aria-hidden="true">
                      <b>{kindInfo.headline}</b><small>{kindInfo.sub}</small><span className="thumb-shape" />
                    </div>
                    <div className="activity-copy">
                      <h3>{job.name || 'No name given'}</h3>
                      <p>{clock(job.start)}{job.address || job.city ? ` · ${[job.address, job.city].filter(Boolean).join(', ')}` : ''}</p>
                      <span className="activity-category"><Icon name="tag" />{job.service_type || 'Cleaning'}</span>
                    </div>
                    <span className={`status ${STATUS_CLASS[job.status] || 'status-ended'}`}>{kindInfo.label}</span>
                    <div className="row-actions">
                      <button type="button" className="row-action" onClick={() => onEditJob(job)}
                              aria-label={`Edit ${job.name || 'job'}`}><Icon name="edit" />Edit</button>
                      <button type="button" className="row-action"
                              onClick={() => onDecide(job, job.status === 'confirmed' ? 'released' : 'confirmed')}
                              aria-label={`${next} ${job.name || 'job'}`}>
                        <Icon name={job.status === 'confirmed' ? 'pause' : 'play'} />{next}
                      </button>
                      <button type="button" className="row-action delete" onClick={() => onDelete(job)}
                              aria-label={`Delete ${job.name || 'job'}`}>Delete</button>
                    </div>
                  </article>
                );
              })}
            </div>

            {visible.length === 0 && (
              <div className="empty-state">
                <Icon name="search" />
                <h3>{isLoading ? 'Loading jobs…' : 'No jobs found'}</h3>
                <p>{all.length === 0
                  ? 'Add the first one, or wait for the assistant to hold a time.'
                  : 'Try another name or choose a different service.'}</p>
                <button type="button" className="button button-blue"
                        onClick={() => { setQuery(''); setKind('all'); setTab('all'); }}>Clear filters</button>
              </div>
            )}
          </div>

          <div className="activity-footer">
            <span role="status">Showing {visible.length} of {all.length} {all.length === 1 ? 'job' : 'jobs'}</span>
            <span className="updated"><Icon name="clock" /><span>Updated just now</span></span>
          </div>
        </div>
      </section>

      <footer className="page-footer">
        <span>© {new Date().getFullYear()} Dany Clean Pro</span>
        <span><Icon name="globe" />Connecticut · United States</span>
      </footer>
    </>
  );
}
