import { ArticleCover } from './ArticleCover';
import { useEffect, useState } from 'react';
import { filesApi, fileUrl, IMAGE_ACCEPT, ArticleImage } from '@/core/api/filesApi';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Props {
  articleId: number;
  editable?: boolean;
  coverObjectKey?: string | null;
  onInsert?: (url: string) => void;
  onReplace?: (previousUrl: string, nextUrl: string) => void;
}
export function ArticleMedia({ articleId, editable = false, coverObjectKey, onInsert, onReplace }: Props) {
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [cover, setCover] = useState(coverObjectKey);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArticleImage | null>(null);
  useEffect(() => {
    let active = true;
    setCover(coverObjectKey);
    setLoading(true);
    setError(null);
    filesApi.list(articleId).then(data => { if (active) setImages(data); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [articleId, coverObjectKey]);
  const change = async (file: File, category: 'COVER' | 'ARTICLE_IMAGE', image?: ArticleImage) => {
    setBusy(true); setError(null);
    try {
      const result = image ? await filesApi.replace(articleId, image.id, file) : await filesApi.upload(articleId, file, category);
      if (category === 'COVER') setCover(result.objectKey);
      else {
        if (image) onReplace?.(fileUrl(image.objectKey), fileUrl(result.objectKey));
        setImages(await filesApi.list(articleId));
      }
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true); setError(null);
    try {
      await filesApi.delete(articleId, deleteTarget.id);
      onReplace?.(fileUrl(deleteTarget.objectKey), '');
      setImages(current => current.filter(image => image.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) { setDeleteTarget(null); setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const uploadInput = (label: string, category: 'COVER' | 'ARTICLE_IMAGE', image?: ArticleImage) => <label className={`inline-flex items-center rounded-lg border border-outline px-3 py-2 text-sm ${busy ? 'opacity-50' : 'cursor-pointer hover:bg-surface-container'}`}>{label}<input type="file" className="sr-only" aria-label={label} accept={IMAGE_ACCEPT} disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void change(file, category, image); }} /></label>;
  if (!editable && !cover && !images.length && !error && !loading) return null;
  return <section aria-label="Изображения статьи" className="space-y-4">
    {editable && <><h2 className="text-lg font-semibold">Изображения</h2><div className="flex flex-wrap gap-2">{uploadInput(cover ? 'Заменить обложку' : 'Загрузить обложку', 'COVER')}{uploadInput('Добавить изображение', 'ARTICLE_IMAGE')}</div><p className="text-sm text-secondary">JPEG, PNG, GIF или WebP, до 10 МиБ. Изображение можно вставить в текст статьи.</p></>}
    <ArticleCover objectKey={cover} alt="Обложка статьи" className="w-full max-h-80 object-contain rounded-lg" />
    {loading && <p className="text-sm text-secondary">Загрузка изображений…</p>}
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{images.map(image => <div key={image.id} className="space-y-2 min-w-0"><a href={fileUrl(image.objectKey)} target="_blank" rel="noreferrer"><img src={fileUrl(image.objectKey)} alt="Изображение статьи" loading="lazy" className="w-full h-44 object-contain rounded-lg border border-outline-variant" /></a>{editable && <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onInsert?.(fileUrl(image.objectKey))}>Вставить в текст</Button>{uploadInput('Заменить', 'ARTICLE_IMAGE', image)}<Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setDeleteTarget(image)}>Удалить</Button></div>}</div>)}</div>
    <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={remove} isLoading={busy} title="Удалить изображение?" description="Файл будет удалён. Ссылки на него в текущем тексте статьи будут убраны; сохраните изменения текста." confirmLabel="Удалить" />
  </section>;
}
