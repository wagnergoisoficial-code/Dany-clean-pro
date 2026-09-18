import { cn } from "../../lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div 
      className={cn("max-w-7xl mx-auto px-6 lg:px-12", className)} 
      {...props}
    >
      {children}
    </div>
  );
}
