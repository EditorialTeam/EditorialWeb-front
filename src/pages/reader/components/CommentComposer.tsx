import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  label: string;
  submitLabel: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  focusOnMount?: boolean;
}

export function CommentComposer({ label, submitLabel, onSubmit, onCancel, focusOnMount = false }: Props) {
  const id = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const submitting = useRef(false);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (focusOnMount) textarea.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || !content.trim()) return;
    if (content.length > 5000) { setError('Комментарий не должен превышать 5000 символов.'); return; }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err) {
      setError((err as Error).message || 'Не удалось отправить комментарий.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="comment-composer">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <textarea
        ref={textarea}
        id={id}
        value={content}
        onChange={event => setContent(event.target.value)}
        placeholder="Напишите комментарий…"
        rows={3}
        maxLength={5000}
        disabled={busy}
        required
        aria-describedby={error ? `${id}-error` : undefined}
        className="comment-composer__input"
      />
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-secondary tabular-nums">{content.length} / 5000</span>
        <div className="flex items-center gap-2">
          {onCancel && <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>Отмена</Button>}
          <Button type="submit" size="sm" isLoading={busy} disabled={!content.trim()}>{submitLabel}</Button>
        </div>
      </div>
    </form>
  );
}
