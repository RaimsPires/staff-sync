import { cn } from "@/lib/utils";

/** A small turning ring in the accent colour. */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("box-border inline-block flex-none animate-spin-fast rounded-full border-2 border-solid border-border-strong border-t-accent", className)}
      style={{ width: size, height: size }}
    />
  );
}
