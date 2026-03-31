/**
 * Motor Settings menu component
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { robotClient } from '@/lib/robotAPIClient';
import { MotorSettings } from '@/types/robot';

export const MotorSettingsMenu: React.FC = () => {
  const [settings, setSettings] = useState<MotorSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await robotClient.getMotorSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof MotorSettings, value: boolean) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      await robotClient.setMotorSettings({[key]: value});
    } catch (err) {
      await fetchSettings();
      setError(err instanceof Error ? 'Failed to update setting: ' + err.message : 'Failed to update setting');
    }
  };

  return (
    <div className="relative p-2 grid gap-x-2 gap-y-1 grid-cols-1 lg:grid-cols-3">
      {error
        ? <div className="lg:col-span-2 mb-1 p-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        : null}
      {loading
        ? <div className="absolute top-2 left-0 right-0 flex items-center justify-center">
            <div className="p-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-400">Loading...</p>
            </div>
          </div>
        : null}

      <div className="flex items-center justify-between border-2 dark:border-main-700 px-2">
        <label className="text-xs text-white">Rotation Correction</label>
        <Button
          onClick={() => updateSetting('rotation_correction_enabled', !settings.rotation_correction_enabled)}
          activeClass='bg-green-600 hover:bg-green-700 text-white'
          active={settings.rotation_correction_enabled}
          className="min-w-20"
        >
          {settings.rotation_correction_enabled ? 'ON' : 'OFF'}
        </Button>
      </div>

      <div className="flex items-center justify-between border-2 dark:border-main-700 px-2">
        <label className="text-xs text-white">Line Avoiding</label>
        <Button
          onClick={() => updateSetting('line_avoiding_enabled', !settings.line_avoiding_enabled)}
          activeClass='bg-green-600 hover:bg-green-700 text-white'
          active={settings.line_avoiding_enabled}
          className="min-w-20"
        >
          {settings.line_avoiding_enabled ? 'ON' : 'OFF'}
        </Button>
      </div>

      <div className="flex items-center justify-between border-2 dark:border-main-700 px-2">
        <label className="text-xs text-white">Position Based Speed</label>
        <Button
          onClick={() => updateSetting('position_based_speed_enabled', !settings.position_based_speed_enabled)}
          activeClass='bg-green-600 hover:bg-green-700 text-white'
          active={settings.position_based_speed_enabled}
          className="min-w-20"
        >
          {settings.position_based_speed_enabled ? 'ON' : 'OFF'}
        </Button>
      </div>
    </div>
  );
};
