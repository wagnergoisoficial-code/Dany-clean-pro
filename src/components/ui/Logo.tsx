import { cn } from '../../lib/utils';
import { useSetting } from '../../lib/settings';

interface LogoProps {
  className?: string;
  /** `inverse` renders the wordmark for use on top of a dark image. */
  variant?: 'default' | 'inverse';
}

export default function Logo({ className, variant = 'default' }: LogoProps) {
  const { value: preview } = useSetting('app_logo');
  const inverse = variant === 'inverse';

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3 min-w-0", className)}>
      {preview && (
        <img src={preview} alt="Dany Clean Pro" className="h-8 sm:h-9 md:h-10 w-auto object-contain shrink-0" />
      )}
      <span className="block">
        <span
          className={cn(
            "block font-display text-body-lg sm:text-headline-sm tracking-tight transition-colors whitespace-nowrap",
            inverse ? "text-white" : "text-ink group-hover:text-accent"
          )}
        >
          Dany Clean Pro
        </span>
        <span
          className={cn(
            "hidden sm:block text-label-sm uppercase mt-0.5 transition-colors whitespace-nowrap",
            inverse ? "text-white/70" : "text-accent"
          )}
        >
          Residential &amp; Commercial Care
        </span>
      </span>
    </div>
  );
}
