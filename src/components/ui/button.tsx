'use client';

import { cn } from '@/lib/utils';

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ title = '', active = true, onClick, activeClass = '', className = '', disabled = false, children }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center px-2 text-xs font-medium border-2',
        active
          ? 'bg-main-900 hover:bg-main-600 border-transparent text-white dark:bg-main-200 dark:hover:bg-main-400 dark:border-transparent dark:text-black'
          : 'bg-main-200 hover:bg-main-300 border-main-300 text-main-700 dark:bg-main-900 dark:hover:bg-main-700 dark:border-main-700 dark:text-main-400',
        className,
        active ? activeClass : ''
      )}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
