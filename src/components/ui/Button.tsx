import React from 'react';
import { cn } from '@/core/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none';

    const variants = {
      primary: 'bg-primary text-on-primary hover:bg-primary-hover shadow-sm',
      secondary: 'bg-surface-container text-on-surface hover:bg-surface-container-high',
      outline: 'bg-surface border border-outline/70 text-on-surface hover:bg-surface-container/60 hover:border-outline',
      ghost: 'bg-transparent text-secondary hover:text-on-surface hover:bg-surface-container/50',
      danger: 'bg-error text-on-primary hover:bg-error/90 shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-9 sm:h-10 px-4 py-2 text-sm rounded-xl gap-2',
      lg: 'h-11 px-5 text-base rounded-xl gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
