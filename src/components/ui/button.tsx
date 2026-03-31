'use client';

import { cn } from '@/lib/utils';

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
}

export const Button: React.FC<ButtonProps> = ({ title = '', active = true, onClick, activeClass = '', className = '', children }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center px-2 text-xs font-medium border-2',
        active ? 'bg-main-200 hover:bg-main-400 border-transparent text-black' : 'bg-main-900 hover:bg-main-700 border-main-700 text-main-400',
        className,
        active ? activeClass : ''
      )}
      title={title}
    >
      {children}
    </button>
  );
};
