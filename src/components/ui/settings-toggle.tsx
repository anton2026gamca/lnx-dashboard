/**
 * Reusable Settings Toggle Component
 * Used for boolean settings with ON/OFF or custom display states
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SettingsToggleProps {
  /** Label text displayed on the left */
  label: string;
  /** Current toggle state */
  value: boolean | undefined;
  /** Callback when toggle is clicked */
  onChange: (newValue: boolean) => void;
  /** Custom text for ON state (default: 'ON') */
  onLabel?: string;
  /** Custom text for OFF state (default: 'OFF') */
  offLabel?: string;
  /** Optional CSS class for the container */
  className?: string;
  /** Optional CSS class for the button */
  buttonClassName?: string;
  /** Disable the toggle */
  disabled?: boolean;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  value = false,
  onChange,
  onLabel = 'ON',
  offLabel = 'OFF',
  className = '',
  buttonClassName = 'min-w-20',
  disabled = false,
}) => {
  return (
    <div className={cn('flex items-center justify-between border-2 border-main-400 dark:border-main-700 px-2', className)}>
      <label className="text-xs text-main-800 dark:text-white">{label}</label>
      <Button
        onClick={() => !disabled && onChange(!value)}
        activeClass="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600 dark:text-black"
        active={value}
        className={buttonClassName}
      >
        {value ? onLabel : offLabel}
      </Button>
    </div>
  );
};
