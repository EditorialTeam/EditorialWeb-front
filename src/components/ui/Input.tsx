import React from 'react';
import { cn } from '@/core/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, rightElement, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-on-surface">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full px-3.5 py-2.5 text-sm rounded-xl border border-outline/70 bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50 disabled:bg-surface-container-low',
              error && 'border-error focus:border-error focus:ring-error',
              rightElement && 'pr-10',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-on-surface-variant/70">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        {helperText && !error && <p className="text-xs text-on-surface-variant/70">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
