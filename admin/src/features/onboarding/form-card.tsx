import { cn } from "@/lib/utils";

export function FormCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-[18px] rounded-[14px] border border-border bg-surface p-6 shadow-card", className)} {...props} />;
}
