import React from 'react';
import { cn } from '@/core/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hoverable = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-surface border border-outline-variant rounded-xl p-5 sm:p-6 transition-all',
        hoverable && 'hover:border-outline hover:bg-surface-container-low/40 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
