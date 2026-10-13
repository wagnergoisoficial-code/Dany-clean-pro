import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, ShieldCheck, Trash2, AlertCircle, Check } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';

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
    <div className="bg-surface border border-rule p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h3 className="font-bold text-xl sm:text-2xl text-ink">Team Access</h3>
        <p className="text-sm text-ink-muted">
          Quem pode abrir este painel. Nao existe cadastro aberto — uma conta so entra se for criada aqui.
        </p>
      </div>

      {/* Create */}
      <form
        onSubmit={e => { e.preventDefault(); setError(''); setDone(''); create.mutate(); }}
        className="border border-rule bg-surface-low p-4 sm:p-6 mb-8"
      >
        <div className="flex items-center gap-2 mb-5">
          <UserPlus size={15} className="text-accent" />
          <span className="text-label-md uppercase text-ink">Dar acesso a alguem</span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-label-sm uppercase text-ink-muted mb-2">Nome</span>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Dany"
              className="w-full bg-surface border border-rule px-3 py-2.5 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="block text-label-sm uppercase text-ink-muted mb-2">E-mail</span>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="dany@danycleanpro.com"
              className="w-full bg-surface border border-rule px-3 py-2.5 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="block text-label-sm uppercase text-ink-muted mb-2">Senha (min. 10)</span>
            <input
              type="password" required minLength={10} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full bg-surface border border-rule px-3 py-2.5 text-ink text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        <button
          type="submit" disabled={create.isPending}
          className="mt-5 inline-flex items-center gap-2 bg-ink text-surface hover:bg-accent transition-colors text-label-md uppercase px-6 py-3 disabled:opacity-50"
        >
          {create.isPending ? 'Criando…' : 'Criar acesso'}
        </button>

        {error && (
          <p className="mt-4 flex items-start gap-2 text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </p>
        )}
        {done && (
          <p className="mt-4 flex items-start gap-2 text-sm text-accent">
            <Check size={15} className="shrink-0 mt-0.5" /> {done}
          </p>
        )}
      </form>

      {/* List */}
      {isLoading ? (
        <div className="text-ink-faint italic py-8">Carregando…</div>
      ) : (
        <div className="divide-y divide-rule border-t border-rule">
          {data?.admins?.map(person => {
            const isYou = person.uid === data.you;
            return (
              <div key={person.uid} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  <ShieldCheck size={15} className="text-accent shrink-0 mt-1" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-ink truncate">{person.name || person.email}</span>
                      {isYou && <span className="text-label-sm uppercase text-accent">voce</span>}
                    </div>
                    <span className="block text-sm text-ink-muted truncate">{person.email}</span>
                    {person.createdBy && (
                      <span className="block text-label-sm uppercase text-ink-faint mt-1">
                        criado por {person.createdBy}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remover o acesso de ${person.email}? A conta continua a existir, mas deixa de abrir o painel.`)) {
                      revoke.mutate(person.uid);
                    }
                  }}
                  disabled={isYou || revoke.isPending}
                  title={isYou ? 'Nao pode remover o seu proprio acesso' : 'Remover acesso'}
                  className={cn(
                    'p-2 transition-colors shrink-0',
                    isYou ? 'text-ink-faint cursor-not-allowed' : 'text-ink-muted hover:text-red-600',
                  )}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
          {!data?.admins?.length && (
            <p className="text-ink-faint italic py-8 text-center bg-surface-low">Nenhum administrador listado.</p>
          )}
        </div>
      )}
    </div>
  );
}
