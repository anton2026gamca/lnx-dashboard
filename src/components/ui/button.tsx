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
  if (![activeClass, className].join(' ').includes(' bg-') && ![activeClass, className].join(' ').substring(0, 3).includes('bg-')) {
    activeClass += ' bg-main-100';
    if (![activeClass, className].join(' ').includes('hover:bg-')) {
      activeClass += ' hover:bg-main-400';
    }
  }
  if (![activeClass, className].join(' ').includes('border-')) {
    activeClass += ' border-transparent';
  }
  if (![activeClass, className].join(' ').includes('text-')) {
    activeClass += ' text-black';
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center px-2 text-xs font-medium border-2',
        active ? 'bg-main-100 hover:bg-main-400 border-transparent text-black' : 'bg-main-900 hover:bg-main-700 border-main-700 text-main-400',
        className,
        active ? activeClass : ''
      )}
      title={title}
    >
      {children}
    </button>
  );
};
