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
import { cn } from '@/lib/utils';
import { SensorPanel } from './sensor-panel';

// ============= Sub-components =============

const PanelContainer: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("w-full bg-main-100 dark:bg-main-950 border-solid border-2 dark:border-main-900 overflow-y-auto", className)}>
    {children}
  </div>
);

// ============= Main Dashboard =============

export const RobotDashboard: React.FC = () => {
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
    <div className="h-screen bg-white dark:bg-black flex flex-col max-h-screen">
      {/* Header */}
      <div className="flex-none pt-2">
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-main-900 dark:text-white">
              {robot.name}
            </h1>
            <p className="text-xs text-main-600 dark:text-main-400">
              {robot.ip}:{robot.port}
            </p>
          </div>
          <Button onClick={disconnectFromRobot} className="bg-red-500 hover:bg-red-800 text-white">Disconnect</Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-10 grid-rows-1 gap-2 p-2 overflow-y-auto">
        {/* Left */}
        <div className="col-span-6 h-full flex flex-col items-center justify-center gap-2">
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
        <div className="col-span-4 h-full flex flex-col items-center justify-center gap-2 overflow-y-auto">
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

