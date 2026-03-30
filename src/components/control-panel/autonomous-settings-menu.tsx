/**
 * Autonomous Settings menu component
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { robotClient } from '@/lib/robotAPIClient';
import { AutonomousSettings } from '@/types/robot';

export const AutonomousSettingsMenu: React.FC = () => {
  const [settings, setSettings] = useState<AutonomousSettings>({});
  const [stateMachines, setStateMachines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [autonomousData, stateMachinesData] = await Promise.all([
        robotClient.getAutonomousSettings(),
        robotClient.getAllStateMachines(),
      ]);

      if (autonomousData) {
        setSettings(autonomousData);
      }
      
      if (stateMachinesData) {
        setStateMachines(stateMachinesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof AutonomousSettings, value: any) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      await robotClient.setAutonomousSettings({[key]: value});
    } catch (err) {
      await fetchSettings();
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    }
  };

  return (
    <div className="relative p-2 grid gap-x-4 gap-y-1 grid-cols-1 lg:grid-cols-2">
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

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-main-200">State Machine</label>
        <select
          value={settings.state_machine || ''}
          onChange={(e) => updateSetting('state_machine', e.target.value || null)}
          className="text-xs bg-main-800 text-white border border-main-700 rounded px-2 py-1"
        >
          <option value="" className='hidden'></option>
          {stateMachines.map((sm) => (
            <option key={sm} value={sm}>
              {sm}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs text-main-200">Face Goal/North</label>
        <Button
          onClick={() => updateSetting('always_face_goal_enabled', !settings.always_face_goal_enabled)}
          activeClass='bg-green-600 hover:bg-green-700 text-white'
          active={settings.always_face_goal_enabled}
          className="min-w-20"
        >
          {settings.always_face_goal_enabled ? 'GOAL' : 'NORTH'}
        </Button>
      </div>
    </div>
  );
};
