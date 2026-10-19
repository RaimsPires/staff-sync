import { useEffect, useState } from "react";

export const MAX_ATTEMPTS = 5;
export const LOCK_MS = 15 * 60 * 1000;

/** Failed-attempt counter plus a one-second countdown while the account is locked. */
export function useLockout(initial?: { attempts: number; lockedFor?: number }) {
  const [attempts, setAttempts] = useState(initial?.attempts ?? 0);
  const [lockUntil, setLockUntil] = useState(() => (initial?.lockedFor ? Date.now() + initial.lockedFor : 0));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lockUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockUntil]);

  const remaining = Math.max(0, lockUntil - now);
  const locked = remaining > 0;

  /** Registers a failure; returns true when this failure locks the account. */
  const fail = () => {
    const next = (locked ? 0 : attempts) + 1;
    if (next >= MAX_ATTEMPTS) {
      const t = Date.now();
      setAttempts(next);
      setNow(t);
      setLockUntil(t + LOCK_MS);
      return true;
    }
    setAttempts(next);
    return false;
  };
  const reset = () => {
    setAttempts(0);
    setLockUntil(0);
  };

  return { attempts, attemptsLeft: MAX_ATTEMPTS - attempts, locked, remaining, fail, reset };
}
