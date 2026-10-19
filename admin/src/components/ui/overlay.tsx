'use client';
import { createContext, useContext, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useHeldWhileOpen, usePresence } from '@/lib/use-presence';

/** Tells a Modal or Drawer inside <KeepMounted> that its parent is closing, so it can play the exit animation. */
const LiveContext = createContext(true);

/**
 * Wraps a conditionally rendered overlay (`{open && <SomeModal />}`) so it stays mounted while it animates out.
 * Pass the same condition as `show` and keep the conditional child inside.
 */
export function KeepMounted({ show, children }: { show: boolean; children: React.ReactNode }) {
  const { mounted } = usePresence(show, 220);
  const held = useHeldWhileOpen({ children }, show);
  if (!mounted) return null;
  return <LiveContext.Provider value={show}>{held.children}</LiveContext.Provider>;
}

export function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

interface Base { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; className?: string }

/** Centered dialog with overlay, Esc to close, sticky footer for actions. */
export function Modal({ open: openProp, onClose, title, children, footer, className }: Base) {
  const live = useContext(LiveContext);
  const open = openProp && live;
  useEscape(open, onClose);
  const { mounted, state } = usePresence(open, 160);
  const held = useHeldWhileOpen({ title, children, footer }, open);
  if (!mounted) return null;
  return (
    <div data-state={state} className="ss-fade fixed inset-0 z-[200] grid place-items-center bg-overlay p-[20px]" onMouseDown={onClose}>
      <div role="dialog" aria-modal data-state={state} onMouseDown={(e) => e.stopPropagation()}
        className={cn('ss-pop w-full max-w-[520px] max-h-[90vh] flex flex-col bg-surface text-text rounded-[14px] shadow-pop', className)}>
        <div className="px-[20px] py-[16px] border-b border-solid border-b-border text-[16px] font-semibold">{held.title}</div>
        <div className="p-[20px] overflow-auto">{held.children}</div>
        {held.footer && <div className="flex justify-end gap-[8px] px-[20px] py-[14px] border-t border-solid border-t-border">{held.footer}</div>}
      </div>
    </div>
  );
}

/** Right-hand panel used for record, leave and employee details. */
export function Drawer({ open: openProp, onClose, title, children, footer, className }: Base) {
  const live = useContext(LiveContext);
  const open = openProp && live;
  useEscape(open, onClose);
  const { mounted, state } = usePresence(open, 180);
  const held = useHeldWhileOpen({ title, children, footer }, open);
  if (!mounted) return null;
  return (
    <div data-state={state} className="ss-fade fixed inset-0 z-[150] bg-overlay" onMouseDown={onClose}>
      <aside data-state={state} onMouseDown={(e) => e.stopPropagation()}
        className={cn('ss-slide absolute top-0 right-0 bottom-0 w-full max-w-[520px] flex flex-col bg-surface text-text shadow-pop', className)}>
        <div className="sticky top-0 px-[20px] py-[16px] border-b border-solid border-b-border text-[16px] font-semibold bg-surface">{held.title}</div>
        <div className="flex-1 overflow-auto p-[20px]">{held.children}</div>
        {held.footer && <div className="sticky bottom-0 flex justify-end gap-[8px] px-[20px] py-[14px] border-t border-solid border-t-border bg-surface">{held.footer}</div>}
      </aside>
    </div>
  );
}
