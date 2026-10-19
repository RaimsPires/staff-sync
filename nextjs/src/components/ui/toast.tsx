'use client';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Kind = 'ok' | 'info' | 'bad';
interface Toast { id: number; msg: string; kind: Kind }
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});

/** Wrap a subtree once, then `const toast = useToast(); toast('Saved')`. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const n = useRef(0);
  const push = useCallback((msg: string, kind: Kind = 'ok') => {
    const id = ++n.current;
    setItems((s) => [...s, { id, msg, kind }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[400] flex flex-col gap-[8px] items-center">
        {items.map((t) => (
          <div key={t.id} className={cn('px-[16px] py-[10px] rounded-full text-[13px] font-medium text-white shadow-pop animate-[ssIn_.18s_ease-out]',
            t.kind === 'bad' ? 'bg-bad' : t.kind === 'info' ? 'bg-accent' : 'bg-text')}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
