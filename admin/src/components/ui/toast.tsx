'use client';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Kind = 'ok' | 'info' | 'bad';
interface Toast { id: number; msg: string; kind: Kind }
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});

const SHOWN_MS: Record<Kind, number> = { ok: 5000, info: 5000, bad: 8000 };
const MAX_VISIBLE = 4;

const LOOK: Record<Kind, { icon: typeof Info; box: string; bar: string }> = {
  ok: { icon: CheckCircle2, box: 'bg-ok-bg text-ok', bar: 'border-l-ok-dot' },
  info: { icon: Info, box: 'bg-info-bg text-info', bar: 'border-l-info-dot' },
  bad: { icon: AlertTriangle, box: 'bg-bad-bg text-bad', bar: 'border-l-bad-dot' },
};

/** Wrap a subtree once, then `const toast = useToast(); toast('Saved')`. Messages appear as alerts in the top-right corner. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Common');
  const [items, setItems] = useState<Toast[]>([]);
  const n = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((s) => s.filter((x) => x.id !== id));
  }, []);
  const arm = useCallback((id: number, kind: Kind) => {
    clearTimeout(timers.current.get(id));
    timers.current.set(id, setTimeout(() => dismiss(id), SHOWN_MS[kind]));
  }, [dismiss]);
  const push = useCallback((msg: string, kind: Kind = 'ok') => {
    const id = ++n.current;
    setItems((s) => [{ id, msg, kind }, ...s].slice(0, MAX_VISIBLE));
    arm(id, kind);
  }, [arm]);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[400] flex w-[min(400px,calc(100vw-2rem))] flex-col gap-2.5">
        {items.map((it) => {
          const { icon: Icon, box, bar } = LOOK[it.kind];
          return (
            <div
              key={it.id}
              role="alert"
              aria-live="assertive"
              onMouseEnter={() => clearTimeout(timers.current.get(it.id))}
              onMouseLeave={() => arm(it.id, it.kind)}
              className={cn('pointer-events-auto flex items-start gap-3 rounded-xl border border-l-4 border-solid border-border px-3.5 py-3 text-[13.5px] font-medium leading-[1.4] shadow-pop animate-[ssToastIn_.22s_ease-out]', box, bar)}
            >
              <Icon size={18} className="mt-px flex-none" aria-hidden />
              <span className="min-w-0 flex-1 break-words">{it.msg}</span>
              <button type="button" onClick={() => dismiss(it.id)} aria-label={t('close')} className="-mr-1 -mt-0.5 grid size-6 flex-none place-items-center rounded-md border-0 bg-transparent p-0 text-current opacity-70 hover:opacity-100">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
