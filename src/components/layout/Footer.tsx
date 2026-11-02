import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-outline-variant bg-surface mt-auto py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant/70">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-on-surface">Editorial</span>
          <span>— Независимый редакционный журнал</span>
        </div>
        <div>
          © 2026 Editorial Platform. Чистая архитектура, типографика и открытый доступ.
        </div>
      </div>
    </footer>
  );
};
