/**
 * Modal component for calibration dialogs and other pop-up content
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title?: string;
  isOpen?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  title = "",
  isOpen = true,
  onClose = () => {},
  children = null,
  size = 'medium',
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setPosition({
          x: e.clientX - offset.x,
          y: e.clientY - offset.y,
        });
      }
    };
    const handleMouseUp = () => {
      setDragging(false);
    };
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setDragging(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className={cn(
          'relative bg-main-100 dark:bg-main-950 border border-main-300 dark:border-main-800 shadow-lg w-full',
          sizeClasses[size],
          className
        )}
        style={{
          position: 'absolute',
          left: position.x ? position.x : '50%',
          top: position.y ? position.y : '50%',
          transform: position.x || position.y ? 'translate(0, 0)' : 'translate(-50%, -50%)',
          cursor: dragging ? 'grabbing' : undefined,
        }}
      >
        <div
          className="bg-main-200 dark:bg-main-900 border-b border-main-300 dark:border-main-800 px-3 py-1 flex justify-between items-center select-none"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-sm font-bold text-main-900 dark:text-white uppercase mt-1">{title}</h2>
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
