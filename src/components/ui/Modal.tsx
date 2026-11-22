import { useEffect, useId, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}
export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  const id = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== dialog.current) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key === 'Tab') {
        const elements = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0);
        const first = elements[0]; const last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); dialog.current?.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [isOpen]);
  if (!isOpen) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-primary/25" onClick={onClose} /><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={title ? id : undefined} aria-label={title ? undefined : 'Диалог'} tabIndex={-1} className={`relative w-full ${widths[maxWidth]} max-h-[90dvh] overflow-y-auto bg-surface rounded-xl border border-outline-variant shadow-lg p-6`}><div className="flex items-center justify-between gap-3 mb-5">{title && <h2 id={id} className="text-lg font-semibold">{title}</h2>}<button type="button" onClick={onClose} aria-label="Закрыть" className="p-2 rounded-lg hover:bg-surface-container ml-auto"><X className="w-5 h-5" /></button></div>{children}</div></div>, document.body);
}
