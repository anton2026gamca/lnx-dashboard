/**
 * Dashboard header with robot tabs
 */

'use client';

import React from 'react';
import { useRobot } from '@/context/RobotContext';
import { RobotConnection } from '@/types/robot';
import { getColorForRobot, getColorDotClass, ROBOT_COLORS } from '@/lib/robotColors';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

interface RobotHeaderProps {
  onAddRobot?: () => void;
}

export const RobotHeader: React.FC<RobotHeaderProps> = ({ onAddRobot }) => {
  const { connectionState, disconnectFromRobot, switchActiveRobot } = useRobot();
  const { connectedRobots, activeRobotId } = connectionState;

  if (connectedRobots.length === 0) {
    return null;
  }

  const activeRobot = connectedRobots.find(r => r.id === activeRobotId);

  return (
    <div className="flex-none bg-main-100 dark:bg-main-950 border-b border-main-300 dark:border-main-900">
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        {/* Robot Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {connectedRobots.map((robot) => {
            const color = (robot.color as string) || getColorForRobot(robot.id);
            const colorStyle = ROBOT_COLORS[color as keyof typeof ROBOT_COLORS] || ROBOT_COLORS.red;
            const isActive = robot.id === activeRobotId;

            return (
              <div
                key={robot.id}
                className={cn(
                  'flex-1 flex items-center gap-2 px-0.5 py-0.5 border-2 cursor-pointer whitespace-nowrap',
                  isActive
                    ? `border-current ${colorStyle.light} ${colorStyle.dark}`
                    : 'border-main-300 hover:border-main-400 dark:border-main-800 dark:hover:border-main-700 text-main-600 dark:text-main-400 hover:text-main-700 dark:hover:text-main-300'
                )}
                onClick={() => switchActiveRobot(robot.id)}
              >
                <div className={cn('ml-2 w-2 h-2 rounded-full', getColorDotClass(color as any))} />
                <span className="text-xs font-medium">{robot.name}</span>
                <span className="text-xs text-main-500 dark:text-main-500">{robot.ip}:{robot.port}</span>
                <div className="flex-1"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectFromRobot(robot.id);
                  }}
                  className="text-main-500 hover:text-main-700 dark:text-main-500 dark:hover:text-main-300 text-xs border-1 px-1"
                  title="Disconnect"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onAddRobot && (
            <Button
              onClick={onAddRobot}
              className="px-2 py-0.5 text-xs"
              title="Connect to another robot"
            >
              + Connect
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};
