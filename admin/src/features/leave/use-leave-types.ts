import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useSettings } from "@/store/settings";
import type { LeaveTypeDef } from "@/types/settings";

export interface ResolvedLeaveType extends LeaveTypeDef {
  /** Display name: the translated default for built-in types, or what someone typed. */
  label: string;
  /** Tinted background with the type colour as text, for pills. */
  pill: CSSProperties;
}

const NEUTRAL = "#6F7A8B";
const pillOf = (color: string): CSSProperties => ({ background: `color-mix(in srgb, ${color} 16%, transparent)`, color });

/**
 * Leave types as configured in Settings. Requests keep the id of the type they were made with,
 * so `get` still resolves a type that was deleted afterwards (shown with a neutral colour).
 */
export function useLeaveTypes() {
  const defs = useSettings((s) => s.leaveTypes);
  const t = useTranslations("Leave.types");
  return useMemo(() => {
    const labelOf = (d: LeaveTypeDef) => d.name ?? (t.has(d.id) ? t(d.id) : d.id);
    const types: ResolvedLeaveType[] = defs.map((d) => ({ ...d, label: labelOf(d), pill: pillOf(d.color) }));
    const get = (id: string): ResolvedLeaveType =>
      types.find((x) => x.id === id) ?? {
        id, name: id, builtIn: false, color: NEUTRAL, paid: true, allowance: 0, document: false, notice: 0, half: false, carry: 0, label: t.has(id) ? t(id) : id, pill: pillOf(NEUTRAL),
      };
    return { types, get, label: (id: string) => get(id).label };
  }, [defs, t]);
}
