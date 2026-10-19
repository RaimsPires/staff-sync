export type StrengthScore = 0 | 1 | 2 | 3 | 4;

/** 0 (empty) to 4 (strong). Shorter than 8 characters never scores above 1. */
export function passwordScore(p: string): StrengthScore {
  if (!p) return 0;
  const rules = [p.length >= 8, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)];
  const score = rules.filter(Boolean).length;
  return (p.length < 8 ? Math.min(score, 1) : score) as StrengthScore;
}

/** The minimum bar used by sign-up and invitation forms. */
export const isPasswordAcceptable = (p: string): boolean => p.length >= 8 && passwordScore(p) >= 2;
