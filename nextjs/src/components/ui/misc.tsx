import { cn } from '@/lib/utils';

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span className={cn('inline-grid place-items-center rounded-full font-semibold flex-none', className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `oklch(0.93 0.045 ${hue})`, color: `oklch(0.42 0.1 ${hue})` }}>
      {initials}
    </span>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="inline-block rounded-full border-2 border-solid border-border-strong border-t-accent animate-[ssSpin_.7s_linear_infinite]" style={{ width: size, height: size }} />;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="px-[20px] py-[48px] text-center bg-surface border border-dashed border-border-strong rounded-[14px]">
      <div className="font-semibold text-[15px]">{title}</div>
      {hint && <div className="text-text-3 text-[13px] mt-[4px]">{hint}</div>}
      {action && <div className="mt-[14px]">{action}</div>}
    </div>
  );
}
