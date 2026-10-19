import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, ShieldCheck, Trash2, AlertCircle, Check } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { PageHeader, Panel, PanelHeader, Empty, Skeleton } from '../../components/admin/ui/Panel';
import { Badge } from '../../components/admin/ui/Table';
import Button from '../../components/admin/ui/Button';
import { Input } from '../../components/admin/ui/Field';

interface AdminRecord {
  uid: string;
  email: string;
  name: string;
  createdAt: string | null;
  createdBy: string;
}

/** Every call carries the caller's own identity; the server decides from it. */
async function authed(path: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}`, ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Falhou (${res.status})`);
  return body;
}

export default function TeamManager() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const { data, isLoading } = useQuery<{ admins: AdminRecord[]; you: string | null }>({
    queryKey: ['admin-users'],
    queryFn: () => authed('/api/admin-users'),
  });

  const create = useMutation({
    mutationFn: () => authed('/api/admin-users', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    }),
    onSuccess: () => {
      setDone(`${email} agora tem acesso ao painel.`);
      setError('');
      setEmail(''); setName(''); setPassword('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => { setError(err.message); setDone(''); },
  });

  const revoke = useMutation({
    mutationFn: (uid: string) => authed(`/api/admin-users?uid=${encodeURIComponent(uid)}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl">
      <PageHeader
        title="Team access"
        hint="Who can open this panel. There is no public sign-up — an account only exists if it is created here."
      />

      {/* Create */}
      <Panel className="mb-5">
      <form onSubmit={e => { e.preventDefault(); setError(''); setDone(''); create.mutate(); }}>
        <PanelHeader title="Give someone access" hint="They sign in with the e-mail and password you set here." />

        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Dany" />
          <Input label="E-mail" type="email" required value={email}
                 onChange={e => setEmail(e.target.value)} placeholder="dany@danycleanpro.com" />
          <Input label="Password" type="password" required minLength={10} value={password}
                 onChange={e => setPassword(e.target.value)} placeholder="At least 10 characters"
                 hint="They can change it later." />
        </div>

        <div className="flex items-center gap-3 mt-5">
          <Button type="submit" intent="blue" busy={create.isPending} icon={<UserPlus size={16} />}>
            Create access
          </Button>
          {error && (
            <p className="flex items-start gap-1.5 text-[13px] text-red-600">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
            </p>
          )}
          {done && (
            <p className="flex items-start gap-1.5 text-[13px] text-emerald-700">
              <Check size={14} className="shrink-0 mt-0.5" /> {done}
            </p>
          )}
        </div>
      </form>
      </Panel>

      {/* List */}
      <Panel>
      <PanelHeader title="Who has access" />
      {isLoading ? (
        <div className="space-y-2">{[0, 1].map(i => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <div className="divide-y divide-slate-900/[0.05]">
          {data?.admins?.map(person => {
            const isYou = person.uid === data.you;
            return (
              <div key={person.uid} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  <ShieldCheck size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">{person.name || person.email}</span>
                      {isYou && <Badge tone="blue">you</Badge>}
                    </div>
                    <span className="block text-[13px] text-slate-500 truncate">{person.email}</span>
                    {person.createdBy && (
                      <span className="block text-[12px] text-slate-400 mt-0.5">
                        added by {person.createdBy}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove access for ${person.email}? The account stays, but it will no longer open this panel.`)) {
                      revoke.mutate(person.uid);
                    }
                  }}
                  disabled={isYou || revoke.isPending}
                  title={isYou ? 'You cannot remove your own access' : 'Remove access'}
                  className={cn(
                    'w-9 h-9 grid place-items-center rounded-lg transition-colors duration-150 shrink-0',
                    isYou ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:bg-red-50 hover:text-red-600',
                  )}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          {!data?.admins?.length && (
            <Empty icon={<ShieldCheck size={19} />} title="Nobody listed yet" />
          )}
        </div>
      )}
      </Panel>
    </div>
  );
}
