/**
 * Autonomous Settings menu component
 */

'use client';

import React from 'react';
import { SettingsToggle } from '@/components/ui/settings-toggle';
import { useAutonomousSettings } from '@/hooks/useRobot';

export const AutonomousSettingsMenu: React.FC = () => {
  const { settings, updateSetting, error, loading, stateMachines } = useAutonomousSettings();

  return (
    <div className="relative grid gap-x-2 gap-y-1 grid-cols-1 lg:grid-cols-3">
      {error
        ? <div className="lg:col-span-2 mb-1 p-1 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        : null}
      {loading
        ? <div className="absolute top-2 left-0 right-0 flex items-center justify-center">
            <div className="p-1 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-400">Loading...</p>
            </div>
          </div>
        : null}

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <select
        value={settings.state_machine || ''}
        onChange={(e) => updateSetting('state_machine', e.target.value || null)}
        className="text-xs bg-main-100 dark:bg-main-800 text-main-900 dark:text-white border border-main-400 dark:border-main-700 px-1"
      >
        <option value="" className='hidden'></option>
        {stateMachines.map((sm) => (
          <option key={sm} value={sm}>
            {sm}
          </option>
        ))}
      </select>

      <SettingsToggle
        label="Face Goal/North"
        value={settings.always_face_goal_enabled}
        onChange={(value) => updateSetting('always_face_goal_enabled', value)}
        onLabel="GOAL"
        offLabel="NORTH"
      />

      <SettingsToggle
        label="Camera Ball Usage"
        value={settings.camera_ball_usage_enabled}
        onChange={(value) => updateSetting('camera_ball_usage_enabled', value)}
      />
    </div>
  );
};
