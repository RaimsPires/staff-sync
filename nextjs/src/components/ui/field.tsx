import { cn } from '@/lib/utils';

const control = 'w-full h-[36px] px-[12px] rounded-[9px] border border-solid border-border-strong bg-surface text-text text-[13.5px] outline-0 focus:border-accent';

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-[6px] text-[13px] font-medium">
      {label}
      {children}
      {error ? <span className="text-bad text-[12px] font-normal">{error}</span> : hint && <span className="text-text-3 text-[12px] font-normal">{hint}</span>}
    </label>
  );
}

export const Input = ({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) => <input className={cn(control, className)} {...p} />;
/** Native select: 7+ options automatically get the searchable popover (see searchable-selects.tsx). */
export const Select = ({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className={cn(control, className)} {...p} />;
