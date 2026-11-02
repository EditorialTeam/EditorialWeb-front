import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/core/auth/AuthContext';
import { router } from './router';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};
