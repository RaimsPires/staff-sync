import { cn } from '@/lib/utils';

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-surface border border-solid border-border rounded-[12px] shadow-card', className)} {...p} />;
}

export function CardHeader({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[12px] px-[18px] py-[14px] border-b border-solid border-b-border">
      <h3 className="m-0 text-[14px] font-semibold">{title}</h3>
      {action}
    </div>
  );
}
