import { cn } from '../../lib/utils';

/**
 * The public site's column: 1170px, the width the approved reference is laid
 * out on, with a gutter on anything narrower.
 */
export default function SiteContainer({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-[1210px] px-5 sm:px-8 lg:px-5', className)} {...props}>
      {children}
    </div>
  );
}
