import React, { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button } from './Button';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="glass-panel w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-danger-muted shrink-0">
            <AlertTriangle className="w-5 h-5 text-danger" aria-hidden="true" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-lg font-bold">
              {title}
            </h3>
            <p id="confirm-dialog-message" className="text-sm text-muted mt-1">
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
