import { z } from 'zod';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9]{8,15}$/;

/** Accepts an email or a phone number (spaces, dots and dashes ignored). */
export const identifierSchema = z
  .string()
  .trim()
  .refine((v) => EMAIL.test(v) || PHONE.test(v.replace(/[\s.-]/g, '')), { message: 'invalid' });

export const emailSchema = z.string().trim().regex(EMAIL);

export const otpSchema = z.string().regex(/^\d{6}$/);

export const pinSchema = z.string().regex(/^\d{4}$/);

/** Masks an email for display: `a***@company.com`. */
export function maskEmail(value: string): string {
  const [name, domain] = value.split('@');
  return `${name.slice(0, 1)}***@${domain}`;
}

/** Compatibility helper for any caller that only has a raw identifier. */
export function maskIdentifier(value: string): string {
  if (value.includes('@')) return maskEmail(value);
  const digits = value.replace(/[\s.-]/g, '');
  return `${digits.slice(0, 4)} ••• ••• ${digits.slice(-2)}`;
}
