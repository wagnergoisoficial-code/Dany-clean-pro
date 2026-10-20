import { createContext, useCallback, useContext, useState } from 'react';
import { Icon } from './Icons';

/** Avisos — mesma aparência e o mesmo "Desfazer" do ficheiro aprovado. */
interface Toast { id: string; message: string; error?: boolean; action?: { label: string; run: () => void } }

const ToastContext = createContext<(message: string, options?: Omit<Toast, 'id' | 'message'>) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((message: string, options: Omit<Toast, 'id' | 'message'> = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems(list => [...list, { id, message, ...options }].slice(-4));
    // Um aviso com acção fica até alguém decidir; os outros saem sozinhos.
    if (!options.action) setTimeout(() => setItems(list => list.filter(item => item.id !== id)), 6500);
  }, []);

  const dismiss = (id: string) => setItems(list => list.filter(item => item.id !== id));

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="adm-toast-stack" aria-live="polite" aria-atomic="false">
        {items.map(item => (
          <div className={`toast${item.error ? ' error' : ''}`} key={item.id}>
            <Icon name={item.error ? 'warning' : 'check-circle'} />
            <span>{item.message}</span>
            {item.action && (
              <button type="button" onClick={() => { item.action!.run(); dismiss(item.id); }}>{item.action.label}</button>
            )}
            <button type="button" className="icon-button" aria-label="Dismiss" onClick={() => dismiss(item.id)}
                    style={{ width: 24, height: 24, flexShrink: 0 }}>
              <Icon name="close" style={{ width: 13, height: 13 }} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
