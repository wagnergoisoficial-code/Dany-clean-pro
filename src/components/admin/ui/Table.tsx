import { cn } from '../../../lib/utils';

/**
 * The data table, as the supplied references build one.
 *
 * Column heads are small, grey and quiet — they are read once and then
 * ignored, so they must not compete with the rows. Rows are separated by a
 * hairline rather than boxed, which is what lets a long list read as one
 * surface instead of a stack of cards. The row highlights on hover because on
 * a wide table the eye loses the line between the first column and the last.
 *
 * Numbers get tabular figures everywhere. Proportional digits make a column of
 * prices or dates ragged, and a ragged column cannot be scanned.
 */
export function Table({ className, children, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table {...rest} className={cn('w-full text-left border-collapse', className)}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-slate-900/[0.07]">{children}</tr>
    </thead>
  );
}

export function TH({
  className, align = 'left', children, ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      scope="col"
      {...rest}
      className={cn(
        'py-2.5 px-3 first:pl-0 last:pr-0',
        'text-[11px] font-semibold tracking-wide text-slate-400 whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-900/[0.05]">{children}</tbody>;
}

export function TR({
  className, selected, onClick, children, ...rest
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      {...rest}
      onClick={onClick}
      className={cn(
        'transition-colors duration-100',
        selected ? 'bg-blue-50/70' : 'hover:bg-slate-50/80',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  className, align = 'left', children, ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      {...rest}
      className={cn(
        'py-3 px-3 first:pl-0 last:pr-0 text-sm text-slate-700 align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}

/**
 * A small coloured word carrying a state.
 *
 * Tinted background with matching text, never a solid block: a row full of
 * saturated pills is harder to read than the data it is describing.
 */
const TONES = {
  neutral: 'bg-slate-100 text-slate-600',
  blue:    'bg-blue-50 text-blue-700',
  green:   'bg-emerald-50 text-emerald-700',
  amber:   'bg-amber-50 text-amber-700',
  red:     'bg-red-50 text-red-700',
} as const;

export function Badge({
  tone = 'neutral', dot, className, children,
}: { tone?: keyof typeof TONES; dot?: boolean; className?: string; children: React.ReactNode }) {
  const DOTS = {
    neutral: 'bg-slate-400', blue: 'bg-blue-500', green: 'bg-emerald-500',
    amber: 'bg-amber-500', red: 'bg-red-500',
  } as const;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md',
      'text-[12px] font-semibold whitespace-nowrap',
      TONES[tone], className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOTS[tone])} />}
      {children}
    </span>
  );
}
