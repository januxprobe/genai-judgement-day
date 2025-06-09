"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'foreground';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-[6px]',
  };

  const colorClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    foreground: 'border-foreground',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      <div
        className={cn(
          'rounded-full animate-spin',
          sizeClasses[size],
          colorClasses[color],
          'border-t-transparent' // Make one side transparent for spin effect
        )}
      />
      {text && <p className={cn("font-headline text-lg", `neon-text-${color}`)}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
