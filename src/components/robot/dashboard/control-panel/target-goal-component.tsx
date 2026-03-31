/**
 * Target goal selector component
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTargetGoal } from '@/hooks/useRobot';
import { robotClient } from '@/lib/robotAPIClient';

export const TargetGoalComponent: React.FC = () => {
  const { targetGoal, refresh } = useTargetGoal();
  const [localGoal, setLocalGoal] = useState<'yellow' | 'blue' | null>(targetGoal);
  const [loading, setLoading] = useState(false);

  // Subscribe to real-time goal updates from robot
  useEffect(() => {
    const handleGoalUpdate = (data: any) => {
      if (data?.goal_color) {
        setLocalGoal(data.goal_color as 'yellow' | 'blue');
      }
    };

    robotClient.on('goal_update', handleGoalUpdate);

    return () => {
      robotClient.off('goal_update', handleGoalUpdate);
    };
  }, []);

  // Sync local goal with hook goal
  useEffect(() => {
    setLocalGoal(targetGoal);
  }, [targetGoal]);

  const setGoalColor = async (color: 'yellow' | 'blue') => {
    setLocalGoal(color);
    setLoading(true);
    try {
      await robotClient.setGoalSettings({ goal_color: color });
      await refresh();
    } catch (err) {
      console.error(`Failed to set goal color to ${color}:`, err);
      setLocalGoal(targetGoal);
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = (isLoading: boolean) => isLoading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <div className="bg-main-900 p-2">
      <h3 className="text-xs font-bold text-white uppercase mb-2">Target Goal</h3>
      <div className="grid grid-cols-2 gap-1">
        <Button
          activeClass='bg-yellow-500 hover:bg-yellow-600 text-black'
          active={localGoal === 'yellow'}
          onClick={() => !loading && setGoalColor('yellow')}
          className={getButtonClass(loading)}
        >
          Yellow
        </Button>
        <Button
          activeClass='bg-blue-500 hover:bg-blue-600 text-white'
          active={localGoal === 'blue'}
          onClick={() => !loading && setGoalColor('blue')}
          className={getButtonClass(loading)}
        >
          Blue
        </Button>
      </div>
    </div>
  );
};
