'use client';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { setLocale } from '@/i18n/actions';
import type { Locale } from '@/i18n/config';
import { hrefFor, ROLE_KEY, type NavOpts, type Role } from '@/lib/routes';

// The ported screens read window/localStorage and use timers, so they render client-side only.
const load = (p: () => Promise<any>) => dynamic(p, { ssr: false, loading: () => <div className="min-h-screen bg-bg" /> });
const SignIn = load(() => import('@/screens/SignIn'));
const Invite = load(() => import('@/screens/Invite'));
const Workspaces = load(() => import('@/screens/Workspaces'));
const Onboarding = load(() => import('@/screens/Onboarding'));
const Admin = load(() => import('@/screens/Admin'));

/** Props every screen understands (navigation, theme, language). */
function useShell() {
  const router = useRouter();
  const lang = useLocale() as Locale;
  const { resolvedTheme } = useTheme();
  const onNavigate = useCallback(
    (target: string, opts?: NavOpts) => {
      if (opts?.role) sessionStorage.setItem(ROLE_KEY, opts.role);
      router.push(hrefFor(target, opts));
      window.scrollTo(0, 0);
    },
    [router],
  );
  const onLang = useCallback(
    async (l: Locale) => {
      await setLocale(l);
      router.refresh();
    },
    [router],
  );
  return { onNavigate, onLang, lang, theme: (resolvedTheme as 'light' | 'dark') ?? 'light' };
}

export function SignInHost({ previewState }: { previewState?: string }) {
  return <SignIn {...useShell()} previewState={previewState} />;
}
export function InviteHost({ inviteState }: { inviteState?: string }) {
  return <Invite {...useShell()} inviteState={inviteState} />;
}
export function WorkspacesHost() {
  return <Workspaces {...useShell()} />;
}
export function OnboardingHost() {
  const step = Number(useSearchParams().get('step')) || undefined;
  const { onNavigate, theme } = useShell();
  return <Onboarding onNavigate={onNavigate} theme={theme} startStep={step} />;
}

export interface AdminHostProps {
  page: string;
  sidebar?: 'expanded' | 'collapsed';
  layout?: 'auto' | 'desktop' | 'tablet';
  dashState?: string;
  recordsState?: string;
}

export function AdminHost({ page, ...rest }: AdminHostProps) {
  const shell = useShell();
  const [current, setCurrent] = useState(page);
  const [nonce, setNonce] = useState(0);
  const [role, setRole] = useState<Role>('admin');
  const first = useRef(true);

  useEffect(() => {
    const r = sessionStorage.getItem(ROLE_KEY) as Role | null;
    if (r) setRole(r);
  }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setCurrent(page);
    setNonce((n) => n + 1);
  }, [page]);

  // Sidebar clicks change the page inside the shell; keep the URL in sync without remounting.
  const onPageChange = useCallback((p: string) => {
    setCurrent(p);
    window.history.replaceState(null, '', `/admin/${p}`);
  }, []);

  return (
    <Admin {...shell} {...rest} role={role} initialPage={current} pageNonce={nonce} onPageChange={onPageChange} />
  );
}
