import type { ThemeColors } from '@/core/theme/tokens';

export type LeaveTint = { bg: keyof ThemeColors; fg: keyof ThemeColors };

/** Per-type colours from the design: annual blue, sick green, family purple, everything else neutral. */
export function leaveTint(typeId: string): LeaveTint {
  switch (typeId) {
    case 'annual':
      return { bg: 'infoBg', fg: 'infoFg' };
    case 'sick':
      return { bg: 'successBg', fg: 'successFg' };
    case 'family':
      return { bg: 'purpleBg', fg: 'purpleFg' };
    default:
      return { bg: 'grayBg', fg: 'grayFg' };
  }
}

/** Last comment left by an approver (used for the "Admin: …" / "Reason: …" note on list rows). */
export function lastApproverComment(timeline: readonly { action: string; comment?: string }[]): string | undefined {
  return [...timeline].reverse().find((e) => e.comment && ['changes_requested', 'rejected', 'approved'].includes(e.action))?.comment;
}
