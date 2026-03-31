/**
 * Control Panel Component - Main export with all control components
 */

'use client';

import React from 'react';
import { ModeComponent } from './mode-component';
import { TargetGoalComponent } from './target-goal-component';
import { SettingsComponent } from './settings-component';
import { ManualMovementComponent } from './manual-movement-component';

export const ControlPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <ModeComponent />
      <TargetGoalComponent />
      <SettingsComponent />
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
