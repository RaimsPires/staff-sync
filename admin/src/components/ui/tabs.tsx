'use client';
import { cn } from '@/lib/utils';

/** Underlined tabs (2px accent). For pill-style view switches use <Segmented>. */
export function Tabs<T extends string>({ value, onChange, items }: {
  value: T; onChange: (v: T) => void; items: { id: T; label: React.ReactNode }[];
}) {
  return (
    <div role="tablist" className="flex gap-[20px] border-b border-solid border-b-border">
      {items.map((i) => (
        <button key={i.id} role="tab" aria-selected={i.id === value} onClick={() => onChange(i.id)}
          className={cn('h-[38px] bg-transparent border-0 cursor-pointer text-[13.5px] font-medium -mb-px border-b-2 border-solid',
            i.id === value ? 'text-accent border-b-accent' : 'text-text-2 border-b-transparent hover:text-text')}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, items }: {
  value: T; onChange: (v: T) => void; items: { id: T; label: React.ReactNode }[];
}) {
  return (
    <div className="inline-flex gap-[2px] p-[3px] border border-solid border-border rounded-[9px]">
      {items.map((i) => (
        <button key={i.id} onClick={() => onChange(i.id)}
          className={cn('h-[26px] px-[10px] border-0 rounded-[6px] cursor-pointer text-[12px] font-semibold',
            i.id === value ? 'bg-accent-soft text-accent' : 'bg-transparent text-text-3')}>
          {i.label}
        </button>
      ))}
    </div>
  );
}
