/**
 * Control Panel Component - Main export with all control components
 */

'use client';

import React from 'react';
import { ModeComponent } from './mode-component';
import { TargetGoalComponent } from './target-goal-component';
import { SettingsComponent } from './settings-component';
import { ManualMovementComponent } from './manual-movement-component';
import { Button } from '@/components/ui/button';

export const ControlPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <ModeComponent />
      <TargetGoalComponent />
      <SettingsComponent />
      <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2">
        <h3 className="text-xs font-bold text-main-900 dark:text-white uppercase mb-2">Calibration</h3>
        <Button className="w-full" onClick={() => {}}>Open Calibration Menu</Button>
      </div>
      <ManualMovementComponent />
    </div>
  );
};

// Export individual components for flexible use
export { ModeComponent } from './mode-component';
export { TargetGoalComponent } from './target-goal-component';
export { SettingsComponent } from './settings-component';
export { ManualMovementComponent } from './manual-movement-component';
export { MotorSettingsMenu } from './motor-settings-menu';
export { AutonomousSettingsMenu } from './autonomous-settings-menu';
