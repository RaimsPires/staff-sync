import { cn } from '@/lib/utils';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'orange' | 'violet' | 'neutral';

const TONE: Record<Tone, { chip: string; dot: string }> = {
  ok: { chip: 'bg-ok-bg text-ok', dot: 'bg-ok-dot' },
  warn: { chip: 'bg-warn-bg text-warn', dot: 'bg-warn-dot' },
  bad: { chip: 'bg-bad-bg text-bad', dot: 'bg-bad-dot' },
  info: { chip: 'bg-info-bg text-info', dot: 'bg-info-dot' },
  orange: { chip: 'bg-orange-bg text-orange', dot: 'bg-orange-dot' },
  violet: { chip: 'bg-violet-bg text-violet', dot: 'bg-violet-dot' },
  neutral: { chip: 'bg-neutral-bg text-neutral', dot: 'bg-neutral-dot' },
};

/** Status pill with a leading dot: on time, late, absent, on leave... */
export function Chip({ tone = 'neutral', dot = true, className, children }: {
  tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <span className={cn('inline-flex items-center gap-[6px] h-[22px] px-[8px] rounded-full text-[12px] font-semibold', TONE[tone].chip, className)}>
      {dot && <span className={cn('w-[6px] h-[6px] rounded-full', TONE[tone].dot)} />}
      {children}
    </span>
  );
}
