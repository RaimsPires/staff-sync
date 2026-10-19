'use client';
import { Button } from './button';
import { Modal } from './overlay';

/** Destructive-action confirmation (delete, turn off 2FA, discard changes). */
export function ConfirmDialog({ open, title, message, cancelLabel = 'Cancel', okLabel = 'Confirm', danger, onCancel, onOk }: {
  open: boolean; title: string; message: string; cancelLabel?: string; okLabel?: string; danger?: boolean; onCancel: () => void; onOk: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} className="max-w-[420px]"
      footer={<>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onOk}>{okLabel}</Button>
      </>}>
      <p className="m-0 text-text-2 text-[14px]">{message}</p>
    </Modal>
  );
}
