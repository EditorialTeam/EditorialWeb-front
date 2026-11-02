import React from 'react';
import { cn } from '@/core/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'outline' | 'role';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-surface-container text-on-surface-variant',
    primary: 'bg-primary text-on-primary',
    outline: 'border border-outline/70 text-on-surface-variant bg-surface',
    role: 'bg-primary/10 text-primary font-mono text-[10px] uppercase font-bold tracking-wider',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
