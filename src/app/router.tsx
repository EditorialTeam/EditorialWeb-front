import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { CatalogPage } from '@/pages/catalog/CatalogPage';
import { ReaderPage } from '@/pages/reader/ReaderPage';
import { ArticleEditorPage } from '@/pages/editor/ArticleEditorPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { NotFoundPage } from '@/pages/not-found/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <CatalogPage />,
      },
      {
        path: 'article/:id',
        element: <ReaderPage />,
      },
      {
        path: 'editor',
        element: <ArticleEditorPage />,
      },
      {
        path: 'editor/:id',
        element: <ArticleEditorPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
]);
