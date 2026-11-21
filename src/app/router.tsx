import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { CatalogPage } from '@/pages/catalog/CatalogPage';
import { ReaderPage } from '@/pages/reader/ReaderPage';
import { ArticleEditorPage } from '@/pages/editor/ArticleEditorPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { UserProfilePage } from '@/pages/profile/UserProfilePage';
import { AuthorPanelPage } from '@/pages/author/AuthorPanelPage';
import { ModerationQueuePage } from '@/pages/editor/ModerationQueuePage';
import { AdminPanelPage } from '@/pages/admin/AdminPanelPage';
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
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'author',
        element: <AuthorPanelPage />,
      },
      {
        path: 'editor/moderation',
        element: <ModerationQueuePage />,
      },
      {
        path: 'admin',
        element: <AdminPanelPage />,
      },
      {
        path: 'user/:id',
        element: <UserProfilePage />,
      },
      {
        path: 'author/:id',
        element: <UserProfilePage />,
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
