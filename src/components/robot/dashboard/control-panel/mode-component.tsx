/**
 * Mode selector component with real-time sync
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRobotMode } from '@/hooks/useRobot';
import { robotClient } from '@/lib/robotAPIClient';
import { RobotMode } from '@/types/robot';

export const ModeComponent: React.FC = () => {
  const { mode, changeMode, loading } = useRobotMode();
  const [localMode, setLocalMode] = useState<RobotMode>(mode);

  // Subscribe to real-time mode updates from robot
  useEffect(() => {
    const handleModeUpdate = (data: any) => {
      if (data?.mode) {
        setLocalMode(data.mode as RobotMode);
      }
    };

    robotClient.on('mode_update', handleModeUpdate);

    return () => {
      robotClient.off('mode_update', handleModeUpdate);
    };
  }, []);

  // Sync local mode with hook mode
  useEffect(() => {
    setLocalMode(mode);
  }, [mode]);

  const handleModeChange = async (newMode: RobotMode) => {
    setLocalMode(newMode);
    try {
      await changeMode(newMode);
    } catch (err) {
      console.error('Failed to change mode:', err);
      setLocalMode(mode);
    }
  };

  const getButtonClass = (isLoading: boolean) => isLoading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <div className="bg-main-900 p-2">
      <h3 className="text-xs font-bold text-white uppercase mb-2">Mode</h3>
      <div className="grid grid-cols-3 gap-1">
        <Button
          activeClass='bg-blue-500 hover:bg-blue-600 text-white'
          active={localMode === 'idle'}
          onClick={() => !loading && handleModeChange('idle')}
          className={getButtonClass(loading)}
        >
          Idle
        </Button>
        <Button
          activeClass='bg-blue-500 hover:bg-blue-600 text-white'
          active={localMode === 'autonomous'}
          onClick={() => !loading && handleModeChange('autonomous')}
          className={getButtonClass(loading)}
        >
          Autonomous
        </Button>
        <Button
          activeClass='bg-blue-500 hover:bg-blue-600 text-white'
          active={localMode === 'manual'}
          onClick={() => !loading && handleModeChange('manual')}
          className={getButtonClass(loading)}
        >
          Manual
        </Button>
      </div>
    </div>
  );
};
