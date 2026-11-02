import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-4">
      <div className="font-mono text-6xl font-extrabold text-primary">404</div>
      <h1 className="text-xl font-bold text-on-surface">Страница не найдена</h1>
      <p className="text-sm text-secondary leading-relaxed">
        Запрошенная страница не существует или была перемещена по другому адресу.
      </p>
      <div className="pt-4">
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Button>
        </Link>
      </div>
    </div>
  );
};
