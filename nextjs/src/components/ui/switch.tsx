'use client';
import { cn } from '@/lib/utils';

/** Toggle that saves instantly (settings pages have no sticky save bar). */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn('relative w-[36px] h-[20px] rounded-full border-0 cursor-pointer transition-colors', checked ? 'bg-accent' : 'bg-border-strong')}>
      <span className={cn('absolute top-[2px] left-[2px] w-[16px] h-[16px] rounded-full bg-white transition-transform', checked && 'translate-x-[16px]')} />
    </button>
  );
}
