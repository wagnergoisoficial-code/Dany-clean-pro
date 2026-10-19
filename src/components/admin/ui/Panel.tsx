import { cn } from '../../../lib/utils';

/**
 * The surface everything in the panel sits on.
 *
 * One rule decides whether something gets a Panel: does it group things that
 * belong together? A box drawn around content that was already obviously
 * related just adds a line to look past. Most of a good dashboard is white on
 * white, separated by space.
 *
 * The edge is a hairline at 6% rather than a solid grey border. A full-strength
 * 1px grey reads as a drawn box; a hairline reads as the edge of a surface,
 * which is the difference between a diagram and an object.
 */
export function Panel({
  className, children, flush, ...rest
}: React.HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  return (
    <section
      {...rest}
      className={cn(
        'bg-white rounded-xl ring-1 ring-slate-900/[0.06] shadow-[var(--shadow-panel)]',
        !flush && 'p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Title row for a Panel. Actions sit right, aligned to the title's baseline. */
export function PanelHeader({
  title, hint, actions, className,
}: { title: React.ReactNode; hint?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <header className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        <h2 className="font-sans text-[15px] font-bold text-slate-900 tracking-[-0.01em]">{title}</h2>
        {hint && <p className="text-[13px] text-slate-500 mt-0.5">{hint}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

/**
 * The page's own title block.
 *
 * Kept apart from Panel deliberately: a page heading is not a card, and
 * wrapping it in one is the habit that makes a dashboard look like a grid of
 * boxes with no hierarchy.
 */
export function PageHeader({
  title, hint, actions,
}: { title: React.ReactNode; hint?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="font-sans text-[26px] font-bold tracking-[-0.025em] text-slate-900 leading-tight">
          {title}
        </h1>
        {hint && <p className="text-[15px] text-slate-500 mt-1">{hint}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

/**
 * What a screen says when it has nothing to show.
 *
 * Always offers the action it is empty of. "No leads yet" is a dead end; "No
 * leads yet — here is how they arrive" is the screen doing its job.
 */
export function Empty({
  icon, title, hint, action,
}: { icon?: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      {icon && <div className="inline-grid place-items-center w-11 h-11 rounded-xl bg-slate-50 text-slate-400 mb-3">{icon}</div>}
      <p className="font-sans text-[15px] font-semibold text-slate-900">{title}</p>
      {hint && <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Loading that keeps the page's shape instead of replacing it with a spinner. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-lg bg-slate-100 animate-pulse', className)} aria-hidden />;
}
