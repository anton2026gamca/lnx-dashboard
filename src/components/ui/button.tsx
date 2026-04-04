'use client';

import { cn } from '@/lib/utils';

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  active?: boolean;
  activeClass?: string;
  disabled?: boolean;
  disabledClass?: string;
}

export const Button: React.FC<ButtonProps> = ({ title = '', active = true, onClick = () => {}, activeClass = '', className = '', disabled = false, disabledClass = '', children }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center px-2 text-xs font-medium border-2',
        active
          ? 'bg-main-900 hover:bg-main-600 border-transparent text-white dark:bg-main-200 dark:hover:bg-main-400 dark:border-transparent dark:text-black'
          : 'bg-main-200 hover:bg-main-300 border-main-300 text-main-700 dark:bg-main-900 dark:hover:bg-main-700 dark:border-main-700 dark:text-main-400',
        disabled
          ? 'opacity-50 cursor-not-allowed bg-main-300 hover:bg-main-300 border-main-300 text-main-500 dark:bg-main-800 dark:hover:bg-main-800 dark:border-main-800 dark:text-main-600 hover:grayscale'
          : '',
        className,
        active ? activeClass : '',
        disabled ? disabledClass : '',
      )}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
