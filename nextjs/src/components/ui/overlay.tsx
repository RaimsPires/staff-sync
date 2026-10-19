'use client';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

interface Base { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; className?: string }

/** Centered dialog with overlay, Esc to close, sticky footer for actions. */
export function Modal({ open, onClose, title, children, footer, className }: Base) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-overlay p-[20px]" onMouseDown={onClose}>
      <div role="dialog" aria-modal onMouseDown={(e) => e.stopPropagation()}
        className={cn('w-full max-w-[520px] max-h-[90vh] flex flex-col bg-surface text-text rounded-[14px] shadow-pop animate-[ssIn_.18s_ease-out]', className)}>
        <div className="px-[20px] py-[16px] border-b border-solid border-b-border text-[16px] font-semibold">{title}</div>
        <div className="p-[20px] overflow-auto">{children}</div>
        {footer && <div className="flex justify-end gap-[8px] px-[20px] py-[14px] border-t border-solid border-t-border">{footer}</div>}
      </div>
    </div>
  );
}

/** Right-hand panel used for record, leave and employee details. */
export function Drawer({ open, onClose, title, children, footer, className }: Base) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] bg-overlay" onMouseDown={onClose}>
      <aside onMouseDown={(e) => e.stopPropagation()}
        className={cn('absolute top-0 right-0 bottom-0 w-full max-w-[520px] flex flex-col bg-surface text-text shadow-pop animate-[ssDrawer_.2s_ease-out]', className)}>
        <div className="sticky top-0 px-[20px] py-[16px] border-b border-solid border-b-border text-[16px] font-semibold bg-surface">{title}</div>
        <div className="flex-1 overflow-auto p-[20px]">{children}</div>
        {footer && <div className="sticky bottom-0 flex justify-end gap-[8px] px-[20px] py-[14px] border-t border-solid border-t-border bg-surface">{footer}</div>}
      </aside>
    </div>
  );
}
