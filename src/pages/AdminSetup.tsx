import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, AlertCircle, Check } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * The first administrator, created once.
 *
 * A dashboard cannot hand out its own first key, so this page exists to do it
 * and then stop mattering: the server accepts the setup key only while no
 * administrator exists. After that it answers that one already does, and new
 * people are added from inside the panel instead.
 */
export default function AdminSetup() {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmation) { setError('As duas senhas nao sao iguais.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Setup-Key': key.trim() },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error || `Falhou (${res.status})`); return; }
      setDone(true);
      setTimeout(() => navigate('/admin/login'), 2200);
    } catch {
      setError('Nao foi possivel falar com o servidor. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full bg-surface border border-rule px-4 py-3 text-ink text-sm focus:border-accent focus:outline-none';
  const label = 'block text-label-sm uppercase text-ink-muted mb-2';

  return (
    <div className="min-h-screen bg-surface-low flex flex-col">
      <header className="border-b border-rule bg-surface">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div>
            <span className="block font-display text-headline-sm text-ink tracking-tight leading-none">
              Dany Clean Pro
            </span>
            <span className="block text-label-sm uppercase text-accent mt-1">First-time setup</span>
          </div>
          <a href="/" className="text-label-md uppercase text-ink-muted hover:text-ink transition-colors">
            Back to site
          </a>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {done ? (
            <div className="bg-surface border border-rule p-8">
              <Check size={20} className="text-accent mb-4" />
              <h1 className="font-display text-headline-sm text-ink mb-2">Administrador criado</h1>
              <p className="text-sm text-ink-muted">
                A chave de setup deixou de funcionar. Novos acessos passam a ser criados
                dentro do painel, em Team Access. Levando-te ao login…
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-surface border border-rule p-8">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={15} className="text-accent" />
                <span className="text-label-md uppercase text-ink">Criar o primeiro acesso</span>
              </div>
              <p className="text-sm text-ink-muted mb-8">
                Funciona uma vez so. Depois disto, apenas quem ja tem acesso pode dar acesso.
              </p>

              <div className="space-y-5">
                <label className="block">
                  <span className={label}>Chave de setup</span>
                  <input type="password" required value={key} onChange={e => setKey(e.target.value)}
                         placeholder="ADMIN_SETUP_KEY" className={field} />
                </label>
                <label className="block">
                  <span className={label}>Nome</span>
                  <input value={name} onChange={e => setName(e.target.value)}
                         placeholder="Dany" className={field} />
                </label>
                <label className="block">
                  <span className={label}>E-mail</span>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                         placeholder="dany@danycleanpro.com" className={field} />
                </label>
                <label className="block">
                  <span className={label}>Senha (minimo 10 caracteres)</span>
                  <input type="password" required minLength={10} value={password}
                         onChange={e => setPassword(e.target.value)} placeholder="••••••••••" className={field} />
                </label>
                <label className="block">
                  <span className={label}>Repetir a senha</span>
                  <input type="password" required minLength={10} value={confirmation}
                         onChange={e => setConfirmation(e.target.value)} placeholder="••••••••••" className={field} />
                </label>
              </div>

              <button type="submit" disabled={busy}
                      className="mt-8 w-full bg-ink text-surface hover:bg-accent transition-colors text-label-md uppercase px-6 py-4 disabled:opacity-50">
                {busy ? 'Criando…' : 'Criar administrador'}
              </button>

              {error && (
                <p className="mt-5 flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
                </p>
              )}
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
