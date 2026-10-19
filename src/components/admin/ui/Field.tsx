import { useId } from 'react';
import { cn } from '../../../lib/utils';

/**
 * Form controls.
 *
 * Three decisions carried from the references the owner chose:
 *
 * Labels sit above the field, not inside it. A placeholder used as a label
 * disappears the moment someone types, so anyone checking their work on a long
 * form has to empty the box to remember what it wanted.
 *
 * Focus is a border change plus a soft ring, not the browser's outline. The
 * ring is what makes the focused field findable at a glance on a dense screen.
 *
 * Errors replace the hint in the same place rather than appearing underneath
 * it, so the form does not jump a line taller when something goes wrong.
 */
const base =
  'w-full bg-white text-slate-900 placeholder:text-slate-400 ' +
  'rounded-lg ring-1 ring-inset ring-slate-900/[0.10] ' +
  'transition-[box-shadow,background-color] duration-150 ease-[var(--ease-out-quint)] ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgb(59_130_246_/_0.12)] ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

const sizing = 'h-10 px-3 text-sm';
const invalid = 'ring-red-400 focus:ring-red-500 focus:shadow-[0_0_0_3px_rgb(239_68_68_/_0.12)]';

interface Shared {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
}

function Shell({
  label, hint, error, required, htmlFor, children,
}: Shared & { htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {(error || hint) && (
        <p className={cn('text-[12px] mt-1.5', error ? 'text-red-600' : 'text-slate-500')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function Input({
  label, hint, error, className, id, ...rest
}: Shared & React.InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <Shell label={label} hint={hint} error={error} required={rest.required} htmlFor={fieldId}>
      <input
        id={fieldId}
        aria-invalid={!!error || undefined}
        {...rest}
        className={cn(base, sizing, error && invalid, className)}
      />
    </Shell>
  );
}

export function Textarea({
  label, hint, error, className, id, rows = 4, ...rest
}: Shared & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <Shell label={label} hint={hint} error={error} required={rest.required} htmlFor={fieldId}>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={!!error || undefined}
        {...rest}
        className={cn(base, 'px-3 py-2.5 text-sm resize-y', error && invalid, className)}
      />
    </Shell>
  );
}

export function Select({
  label, hint, error, className, id, children, ...rest
}: Shared & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <Shell label={label} hint={hint} error={error} required={rest.required} htmlFor={fieldId}>
      <div className="relative">
        <select
          id={fieldId}
          aria-invalid={!!error || undefined}
          {...rest}
          className={cn(base, sizing, 'appearance-none pr-9 cursor-pointer', error && invalid, className)}
        >
          {children}
        </select>
        <svg viewBox="0 0 16 16" aria-hidden
             className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Shell>
  );
}

/**
 * A row that is both the label and the hit target.
 *
 * The whole row highlights when chosen, which is the pattern in the supplied
 * references: on a long list of options, a 16px box is a small thing to aim at
 * and a smaller thing to read the state of.
 */
export function Choice({
  type = 'checkbox', label, note, checked, className, ...rest
}: { label: React.ReactNode; note?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 h-10 px-3 rounded-lg cursor-pointer select-none',
        'transition-colors duration-150',
        checked ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50',
        className,
      )}
    >
      <input
        type={type}
        checked={checked}
        {...rest}
        className={cn(
          'w-4 h-4 shrink-0 border-slate-300 text-blue-600',
          type === 'radio' ? 'rounded-full' : 'rounded',
          'focus:ring-2 focus:ring-blue-500 focus:ring-offset-0',
        )}
      />
      <span className="text-sm font-medium truncate">{label}</span>
      {note && <span className="ml-auto text-[12px] text-slate-400 tabular-nums shrink-0">{note}</span>}
    </label>
  );
}

/** On or off, where the change takes effect immediately and has no Save. */
export function Toggle({
  checked, onChange, label, hint, disabled,
}: { checked: boolean; onChange: (next: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {hint && <p className="text-[12px] text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ease-[var(--ease-settle)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
          'disabled:opacity-50 disabled:pointer-events-none',
          checked ? 'bg-blue-600' : 'bg-slate-200',
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm',
          'transition-transform duration-200 ease-[var(--ease-settle)]',
          checked && 'translate-x-4',
        )} />
      </button>
    </div>
  );
}

/** A search box, which every list in this panel has. */
export function SearchInput({
  className, ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <svg viewBox="0 0 16 16" aria-hidden
           className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input type="search" {...rest} className={cn(base, sizing, 'pl-9')} />
    </div>
  );
}
