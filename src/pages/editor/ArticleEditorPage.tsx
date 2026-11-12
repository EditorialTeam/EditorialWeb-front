import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { articlesApi } from '@/core/api/articlesApi';
import { useAuth } from '@/core/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Eye,
  Edit3,
  Bold,
  Italic,
  Heading2,
  Quote,
  Code,
  List,
  Save,
  ShieldAlert,
} from 'lucide-react';

export const ArticleEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canWrite, setDevRole } = useAuth();

  const isEditMode = Boolean(id);
  const articleId = id ? parseInt(id, 10) : NaN;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode) return;

    if (isNaN(articleId)) {
      setError('Статья не найдена');
      setIsLoading(false);
      return;
    }

    const loadArticle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await articlesApi.getById(articleId);
        setTitle(data.title);
        setContent(data.content);
      } catch (err: any) {
        console.error('Failed to load article for editing:', err);
        setError(err.message || 'Не удалось загрузить статью');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [articleId, isEditMode]);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('article-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = `${prefix}${selected || 'текст'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 5));
    }, 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation matching backend article-service constraints
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setError('Заголовок статьи не может быть пустым');
      return;
    }
    if (trimmedTitle.length > 200) {
      setError('Длина заголовка не должна превышать 200 символов');
      return;
    }
    if (!trimmedContent) {
      setError('Текст статьи не может быть пустым');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        await articlesApi.update(articleId, {
          title: trimmedTitle,
          content: trimmedContent,
        });
        navigate(`/article/${articleId}`);
      } else {
        const created = await articlesApi.create({
          title: trimmedTitle,
          content: trimmedContent,
        });
        navigate(`/article/${created.id}`);
      }
    } catch (err: any) {
      console.error('Failed to save article:', err);
      if (err.status === 403 || err.code === 'NOT_ENOUGH_RIGHTS') {
        setError('У вас недостаточно прав для изменения этой статьи (требуется роль AUTHOR, EDITOR или ADMIN)');
      } else if (err.errors) {
        const msg = Object.entries(err.errors)
          .map(([field, m]) => `${field}: ${m}`)
          .join(', ');
        setError(`Ошибка валидации: ${msg}`);
      } else {
        setError(err.message || 'Ошибка сохранения публикации');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Guard for role permissions
  if (!canWrite) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-surface border border-outline-variant rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">Доступ ограничен</h2>
        <p className="text-sm text-secondary leading-relaxed">
          Для создания и редактирования публикаций требуется роль <strong>AUTHOR</strong>, <strong>EDITOR</strong> или <strong>ADMIN</strong>.
          Текущая роль вашего аккаунта: <strong>{user?.role || 'Гость'}</strong>.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="sm"
            onClick={() => setDevRole('AUTHOR')}
            className="w-full sm:w-auto"
          >
            Переключить роль на AUTHOR
          </Button>
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full">
              Вернуться в каталог
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-surface-container rounded w-1/4" />
        <div className="h-12 bg-surface-container rounded w-full" />
        <div className="h-64 bg-surface-container rounded w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-outline-variant mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
            {isEditMode ? 'Редактирование публикации' : 'Новая публикация'}
          </h1>
        </div>

        {/* Tab switchers: Write vs Preview */}
        <div className="flex items-center bg-surface-container rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'write'
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Редактор
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'preview'
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Предпросмотр
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm leading-relaxed">
          {error}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Title Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="article-title" className="text-xs font-semibold text-on-surface">
              Заголовок публикации
            </label>
            <span
              className={`text-[11px] font-mono ${
                title.length > 200 ? 'text-error font-bold' : 'text-secondary/70'
              }`}
            >
              {title.length} / 200
            </span>
          </div>
          <input
            id="article-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите выразительный заголовок..."
            required
            maxLength={200}
            className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-outline/70 bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Markdown Toolbar (visible in write mode) */}
        {activeTab === 'write' ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="article-content-textarea" className="text-xs font-semibold text-on-surface">
                Текст статьи (поддерживается Markdown)
              </label>
              <span className="text-[11px] font-mono text-secondary/70">
                {content.length} симв.
              </span>
            </div>

            {/* Quick Markdown formatting bar */}
            <div className="flex flex-wrap items-center gap-1 p-1.5 bg-surface-container rounded-t-xl border border-b-0 border-outline/70 text-secondary">
              <button
                type="button"
                onClick={() => insertMarkdown('**', '**')}
                className="p-1.5 rounded hover:bg-surface hover:text-on-surface transition-colors"
                title="Жирный текст (**текст**)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('*', '*')}
                className="p-1.5 rounded hover:bg-surface hover:text-on-surface transition-colors"
                title="Курсив (*текст*)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('## ')}
                className="p-1.5 rounded hover:bg-surface hover:text-on-surface transition-colors"
                title="Подзаголовок H2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('> ')}
                className="p-1.5 rounded hover:bg-surface hover:text-on-surface transition-colors"
                title="Цитата (> цитата)"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('```\n', '\n```')}
                className="p-1.5 rounded hover:bg-surface hover:text-on-surface transition-colors"
                title="Блок кода"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('- ')}
                className="p-1.5 rounded hover:bg-surface hover:text-on-surface transition-colors"
                title="Список"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              id="article-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Начните писать вашу статью здесь. Используйте Markdown для форматирования заголовков, списков, цитат и фрагментов кода..."
              rows={16}
              required
              className="w-full px-4 py-3 text-base rounded-b-xl border border-outline/70 bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono leading-relaxed"
            />
          </div>
        ) : (
          /* Live Markdown Preview */
          <div className="bg-surface border border-outline/70 rounded-xl p-6 sm:p-8 min-h-[400px]">
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight pb-4 border-b border-outline-variant mb-6">
              {title || 'Заголовок публикации (предпросмотр)'}
            </h2>
            {content.trim() ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-secondary italic text-sm">Текст статьи пока не заполнен...</p>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            disabled={isSaving}
          >
            Отмена
          </Button>

          <Button type="submit" size="md" isLoading={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isEditMode ? 'Сохранить изменения' : 'Опубликовать статью'}
          </Button>
        </div>
      </form>
    </div>
  );
};
