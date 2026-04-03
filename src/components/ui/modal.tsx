/**
 * Modal component for calibration dialogs and other pop-up content
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  isOpen,
  onClose,
  children,
  size = 'medium',
  className = '',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-main-100 dark:bg-main-950 border border-main-300 dark:border-main-800 shadow-lg w-full mx-4',
          sizeClasses[size],
          className
        )}
      >
        <div className="bg-main-200 dark:bg-main-900 border-b border-main-300 dark:border-main-800 px-3 py-2 flex justify-between items-center">
          <h2 className="text-sm font-bold text-main-900 dark:text-white uppercase">{title}</h2>
          <button
            onClick={onClose}
            className="text-main-600 dark:text-main-400 hover:text-main-900 dark:hover:text-white font-bold text-lg"
          >
            ×
          </button>
        </div>
        <div className="p-3 max-h-[calc(100vh-120px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
