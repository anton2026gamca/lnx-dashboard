/**
 * Motor Settings menu component
 */

'use client';

import React from 'react';
import { SettingsToggle } from '@/components/ui/settings-toggle';
import { useMotorSettings } from '@/hooks/useRobot';

export const MotorSettingsMenu: React.FC = () => {
  const { settings, updateSetting, error, loading } = useMotorSettings();

  return (
    <div className="relative grid gap-x-2 gap-y-1 grid-cols-1 lg:grid-cols-3">
      {error
        ? <div className="lg:col-span-2 mb-1 p-1 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        : null
      }
      {/* {loading */}
      {/*   ? <div className="absolute top-2 left-0 right-0 flex items-center justify-center"> */}
      {/*       <div className="p-1 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-md"> */}
      {/*         <p className="text-sm text-green-700 dark:text-green-400">Loading...</p> */}
      {/*       </div> */}
      {/*     </div> */}
      {/*   : null */}
      {/* } */}

      <SettingsToggle
        label="Rotation Correction"
        value={settings.rotation_correction_enabled}
        onChange={(value) => updateSetting('rotation_correction_enabled', value)}
      />

      <SettingsToggle
        label="Line Avoiding"
        value={settings.line_avoiding_enabled}
        onChange={(value) => updateSetting('line_avoiding_enabled', value)}
      />

      <SettingsToggle
        label="Position Based Speed"
        value={settings.position_based_speed_enabled}
        onChange={(value) => updateSetting('position_based_speed_enabled', value)}
      />
    </div>
  );
};
