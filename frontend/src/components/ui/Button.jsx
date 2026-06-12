import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const variants = {
  primary:
    'bg-accent-cyan text-white hover:opacity-90 active:scale-[0.98] disabled:active:scale-100',
  secondary:
    'bg-slate-100 dark:bg-white/10 text-foreground hover:bg-cyan-100 dark:hover:bg-accent-cyan/20 hover:text-cyan-800 dark:hover:text-accent-cyan',
  danger:
    'bg-danger-muted text-danger border border-danger/30 hover:bg-danger/10',
  ghost:
    'text-muted hover:text-foreground hover:bg-[var(--color-panel-hover)]',
  outline:
    'border border-border text-muted hover:text-foreground hover:bg-[var(--color-panel-hover)]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-4 py-3 text-base rounded-xl',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
