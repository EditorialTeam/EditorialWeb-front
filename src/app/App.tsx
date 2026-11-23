import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuth, AuthProvider } from '@/core/auth/AuthContext';
import { router } from './router';

function SessionRouter() {
  const { isLoading } = useAuth();
  return isLoading ? <div role="status" className="p-8 text-secondary">Загрузка сессии…</div> : <RouterProvider router={router} />;
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SessionRouter />
    </AuthProvider>
  );
};
