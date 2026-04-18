/**
 * Robot dashboard with sensor visualization and controls
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRobot } from '@/context/RobotContext';
import { LogPanel } from '@/components/robot/dashboard/log-panel';
import { ControlPanel } from '@/components/robot/dashboard/control-panel';
import { CameraPanel } from './camera-panel';
import { RobotHeader } from './robot-header';
import { cn } from '@/lib/utils';
import { SensorPanel } from './sensor-panel';

// ============= Sub-components =============

const PanelContainer: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("w-full bg-main-200 dark:bg-main-950 border border-main-300 dark:border-main-900 overflow-y-auto", className)}>
    {children}
  </div>
);

// ============= Main Dashboard =============

interface RobotDashboardProps {
  onAddRobot?: () => void;
}

export const RobotDashboard: React.FC<RobotDashboardProps> = ({ onAddRobot }) => {
  const { connectionState, disconnectFromRobot } = useRobot();

  if (!connectionState.isConnected) {
    return (
      <div className="p-4 text-center">
        <p className="text-main-400">Not connected to any robot</p>
      </div>
    );
  }

  const robot = connectionState.connectedRobot;
  if (!robot) return null;

  return (
    <div className="h-screen bg-main-100 dark:bg-black flex flex-col max-h-screen">
      {/* Header with tabs */}
      <RobotHeader onAddRobot={onAddRobot} />

      <div className="flex-1 grid grid-cols-10 grid-rows-1 gap-1 overflow-y-auto m-1">
        {/* Left */}
        <div className="col-span-6 h-full flex flex-col items-center justify-center gap-1">
          {/* Video Controls & Stream */}
          <PanelContainer className="flex-none">
            <CameraPanel />
          </PanelContainer>

          {/* Logs */}
          <PanelContainer className="flex-1">
            <LogPanel />
          </PanelContainer>
        </div>
        
        {/* Right */}
        <div className="col-span-4 h-full flex flex-col items-center justify-center gap-1 overflow-y-auto">
          {/* Sensors */}
          <PanelContainer className="flex-none">
            <SensorPanel />
          </PanelContainer>

          {/* Control Panel */}
          <PanelContainer className="flex-1">
            <ControlPanel />
          </PanelContainer>
        </div>
      </div>
    </div>
  );
};
