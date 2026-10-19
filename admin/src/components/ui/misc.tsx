import { cn } from "@/lib/utils";

/** Stable hue (0–359) derived from a name, shared by avatars across the app. */
export const nameHue = (name: string): number => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Colour pair for a person, readable in both themes. */
export const avatarColors = (name: string): { background: string; color: string } => {
  const hue = nameHue(name);
  return {
    background: `light-dark(oklch(0.93 0.045 ${hue}), oklch(0.34 0.07 ${hue}))`,
    color: `light-dark(oklch(0.42 0.1 ${hue}), oklch(0.9 0.06 ${hue}))`,
  };
};

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid flex-none place-items-center rounded-full font-semibold", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, ...avatarColors(name) }}
    >
      {initials(name)}
    </span>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      role="status"
      className="inline-block animate-spin-fast rounded-full border-2 border-solid border-border-strong border-t-accent"
      style={{ width: size, height: size }}
    />
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-border-strong bg-surface px-5 py-12 text-center">
      <div className="text-[15px] font-semibold">{title}</div>
      {hint && <div className="mt-1 text-[13px] text-text-3">{hint}</div>}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}
