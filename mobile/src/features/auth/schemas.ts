import { z } from 'zod';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9]{8,15}$/;

/** Accepts an email or a phone number (spaces, dots and dashes ignored). */
export const identifierSchema = z
  .string()
  .trim()
  .refine((v) => EMAIL.test(v) || PHONE.test(v.replace(/[\s.-]/g, '')), { message: 'invalid' });

export const otpSchema = z.string().regex(/^\d{6}$/);

export const pinSchema = z.string().regex(/^\d{4}$/);

/** Masks an identifier for display: `a***@company.com`, `+237 ••• ••• 89`. */
export function maskIdentifier(value: string): string {
  if (value.includes('@')) {
    const [name, domain] = value.split('@');
    return `${name.slice(0, 1)}***@${domain}`;
  }
  const digits = value.replace(/[\s.-]/g, '');
  return `${digits.slice(0, 4)} ••• ••• ${digits.slice(-2)}`;
}
