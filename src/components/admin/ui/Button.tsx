import { cn } from '../../../lib/utils';

type Intent = 'blue' | 'red' | 'green' | 'amber' | 'neutral';
type Variant = 'solid' | 'smooth' | 'ghost' | 'raised' | 'bare';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  intent?: Intent;
  variant?: Variant;
  size?: Size;
  busy?: boolean;
  icon?: React.ReactNode;
  iconAfter?: React.ReactNode;
  block?: boolean;
}

/**
 * One button, four strengths, four meanings.
 *
 * The strengths matter as much as the colours. A panel where every action is
 * a solid blue block has no hierarchy — everything shouts, so nothing reads.
 * Solid is the one thing to do on a screen; smooth is a secondary action that
 * still belongs to the same idea; ghost is an option among several, which is
 * why table rows use it; raised is for toolbars, where a button sits on the
 * same white as everything else and needs an edge to be seen at all.
 *
 * Colour is meaning, never decoration: blue acts, green approves, red undoes,
 * amber warns. Neutral is for everything that is merely possible.
 */
const PALETTE: Record<Intent, Record<Variant, string>> = {
  blue: {
    solid:  'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    smooth: 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200',
    ghost:  'bg-white text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50',
    raised: 'bg-white text-blue-700 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow',
    bare:   'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
  },
  red: {
    solid:  'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    smooth: 'bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200',
    ghost:  'bg-white text-red-600 border border-red-200 hover:border-red-400 hover:bg-red-50',
    raised: 'bg-white text-red-600 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow',
    bare:   'text-red-600 hover:text-red-800 hover:bg-red-50',
  },
  green: {
    solid:  'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
    smooth: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200',
    ghost:  'bg-white text-emerald-600 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50',
    raised: 'bg-white text-emerald-700 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow',
    bare:   'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50',
  },
  amber: {
    solid:  'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700',
    smooth: 'bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200',
    ghost:  'bg-white text-amber-600 border border-amber-200 hover:border-amber-400 hover:bg-amber-50',
    raised: 'bg-white text-amber-700 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow',
    bare:   'text-amber-600 hover:text-amber-800 hover:bg-amber-50',
  },
  neutral: {
    solid:  'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
    smooth: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
    ghost:  'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50',
    raised: 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow',
    bare:   'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
  },
};

const RING: Record<Intent, string> = {
  blue: 'focus-visible:outline-blue-600',
  red: 'focus-visible:outline-red-600',
  green: 'focus-visible:outline-emerald-600',
  amber: 'focus-visible:outline-amber-500',
  neutral: 'focus-visible:outline-slate-500',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
};

export default function Button({
  intent = 'blue', variant = 'solid', size = 'md',
  busy, icon, iconAfter, block, className, children, disabled, type, ...rest
}: ButtonProps) {
  return (
    <button
      type={type || 'button'}
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        'transition-[background-color,border-color,box-shadow,transform] duration-150',
        'active:translate-y-px',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        SIZES[size], PALETTE[intent][variant], RING[intent],
        block && 'w-full',
        className,
      )}
    >
      {busy
        ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" aria-hidden />
        : icon}
      {children}
      {!busy && iconAfter}
    </button>
  );
}

/** A square button that holds only an icon — toolbars, row menus, steppers. */
export function IconButton({
  label, intent = 'neutral', variant = 'bare', size = 'md', className, children, ...rest
}: Omit<ButtonProps, 'icon' | 'iconAfter' | 'block'> & { label: string }) {
  const box = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-10 h-10';
  return (
    <button
      type="button"
      {...rest}
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid place-items-center rounded-lg transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        box, PALETTE[intent][variant], RING[intent], className,
      )}
    >
      {children}
    </button>
  );
}
