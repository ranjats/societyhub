import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        className
      )}
      {...props}
    >
      <span className="shimmer absolute inset-0" aria-hidden="true" />
    </div>
  );
}

export { Skeleton };
