export type AuthResult = "ok" | "wrong" | "deactivated";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock sign-in. Replace the body with a call to the backend (see lib/api.ts) when it is wired.
 * Demo rules: password "staffsync" signs in; emails starting with "former" are deactivated.
 * Locking after repeated failures is handled by the form, which counts attempts.
 */
export async function authenticate(email: string, password: string): Promise<AuthResult> {
  await delay(1300);
  if (/^former/i.test(email)) return "deactivated";
  return password === "staffsync" ? "ok" : "wrong";
}
