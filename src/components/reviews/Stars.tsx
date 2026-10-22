import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

/** A rating as five stars, filled up to the score. Read out as "5 out of 5 stars". */
export default function Stars({ rating, size = 15, className, emptyClassName }: {
  rating: number;
  size?: number;
  className?: string;
  emptyClassName?: string;
}) {
  return (
    <span role="img" aria-label={`${rating} out of 5 stars`} className="inline-flex gap-[3px]">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          aria-hidden
          className={cn(n <= rating ? className : emptyClassName)}
          fill={n <= rating ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}
