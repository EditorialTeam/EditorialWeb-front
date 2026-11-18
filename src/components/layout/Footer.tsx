import React from 'react';

export const Footer: React.FC = () => (
  <footer className="mt-auto border-t border-outline-variant py-6">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 text-xs text-secondary">
      <span className="font-semibold text-on-surface">Editorial</span>
      <span>© {new Date().getFullYear()} Editorial</span>
    </div>
  </footer>
);
