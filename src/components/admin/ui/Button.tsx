import { cn } from '../../../lib/utils';

type Tone = 'primary' | 'go' | 'stop' | 'quiet' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: Size;
  busy?: boolean;
  icon?: React.ReactNode;
}

/**
 * The dashboard's button.
 *
 * The marketing site is editorial — square corners, rules, restraint — and
 * that is deliberate there. A working panel is a different job: the owner
 * spends her day in it, pressing the same few things, and wants to recognise
 * them at a glance rather than read them. So colour means something here.
 * Blue acts, green approves, red undoes, and nothing else is coloured, which
 * is what keeps the colours readable.
 *
 * `translate-y` on press rather than a scale: a button that physically sinks
 * reads as a key being struck, which is the small piece of warmth the brief
 * asked for and costs nothing in clarity.
 */
const TONES: Record<Tone, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-600/20 focus-visible:outline-blue-600',
  go:      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/20 focus-visible:outline-emerald-600',
  stop:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/20 focus-visible:outline-red-600',
  quiet:   'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-slate-400',
  ghost:   'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 focus-visible:outline-slate-400',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

export default function Button({
  tone = 'primary', size = 'md', busy, icon, className, children, disabled, ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cn(
        'inline-flex items-center justify-center font-semibold tracking-[-0.01em]',
        'transition-[background-color,transform,box-shadow] duration-150',
        'active:translate-y-px',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-55 disabled:pointer-events-none',
        SIZES[size], TONES[tone], className,
      )}
    >
      {busy
        ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
        : icon}
      {children}
    </button>
  );
}
