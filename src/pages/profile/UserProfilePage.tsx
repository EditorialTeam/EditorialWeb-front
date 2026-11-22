import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articlesApi } from '@/core/api/articlesApi';
import { ArticleResponse } from '@/core/api/types';
import { ArticleCard } from '../catalog/ArticleCard';
import { Avatar } from '@/components/media/Avatar';
import { Button } from '@/components/ui/Button';
export function UserProfilePage() {
  const { id } = useParams();
  const accountId = Number(id);
  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null); setArticles([]);
    if (!Number.isSafeInteger(accountId) || accountId <= 0) { setError('Некорректный ID автора.'); setLoading(false); return; }
    articlesApi.getAll('published', accountId).then(data => { if (active) setArticles(data); }).catch((err: Error) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accountId]);
  const author = articles[0];
  const name = author?.authorDisplayName || `Автор №${accountId}`;
  return <div className="max-w-4xl mx-auto space-y-6"><Link to="/"><Button variant="ghost">В каталог</Button></Link>{loading ? <p>Загрузка публикаций…</p> : error ? <p role="alert" className="text-error">{error}</p> : <><div className="flex items-center gap-4"><Avatar objectKey={author?.authorAvatarObjectKey} name={name} className="w-16 h-16" /><div><h1 className="text-2xl font-bold">{name}</h1><p className="text-sm text-secondary">Опубликованные статьи</p></div></div>{!articles.length ? <p className="text-secondary">Опубликованные статьи этого автора не найдены.</p> : <div className="grid md:grid-cols-2 gap-5">{articles.map(article => <ArticleCard key={article.id} article={article} />)}</div>}</>}</div>;
}
