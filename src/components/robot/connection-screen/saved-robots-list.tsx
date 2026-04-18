/**
 * Saved robots list component
 */

'use client';

import React from 'react';
import { RobotConnection } from '@/types/robot';
import { Button } from '@/components/ui/button';
import { getColorForRobot, getColorDotClass, ROBOT_COLORS } from '@/lib/robotColors';
import { cn } from '@/lib/utils';

interface SavedRobotsListProps {
  robots: RobotConnection[];
  connectedRobotId?: string;
  connectedRobotIds?: string[];
  isConnecting?: boolean;
  onConnect: (robot: RobotConnection) => void;
  onDisconnect?: (robotId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (robot: RobotConnection) => void;
  isLoading?: boolean;
}

const getTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
};

export const SavedRobotsList: React.FC<SavedRobotsListProps> = ({
  robots,
  connectedRobotId,
  connectedRobotIds = [],
  isConnecting = false,
  onConnect,
  onDisconnect,
  onDelete,
  onEdit,
  isLoading = false,
}) => {
  if (robots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-main-500 dark:text-main-400">No saved robots yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {robots.map((robot) => {
        const color = (robot.color as string) || getColorForRobot(robot.id);
        const colorStyle = ROBOT_COLORS[color as keyof typeof ROBOT_COLORS] || ROBOT_COLORS.blue;
        const isConnected = connectedRobotIds.includes(robot.id);
        const isActive = connectedRobotId === robot.id;

        return (
          <div
            key={robot.id}
            className={cn(
              'p-2 border transition-all',
              isActive
                ? `${colorStyle.bg} ${colorStyle.darkBg} ${colorStyle.border} ${colorStyle.darkBorder}`
                : isConnected
                ? `${colorStyle.bg} ${colorStyle.darkBg} ${colorStyle.border} ${colorStyle.darkBorder} opacity-75`
                : 'bg-main-200 dark:bg-main-800 border-main-300 dark:border-main-700 hover:border-main-400 dark:hover:border-main-600'
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', getColorDotClass(color as any))} />
                  <h3 className="font-semibold text-main-900 dark:text-white truncate">{robot.name}</h3>
                  {isConnected && (
                    <span className={cn(
                      'inline-flex items-center gap-1 px-1 text-xs font-semibold',
                      isActive
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    )}>
                      <span className={cn('w-2 h-2', isActive ? 'bg-green-600 dark:bg-green-400 animate-pulse' : 'bg-blue-600 dark:bg-blue-400')}></span>
                      {isActive ? 'Active' : 'Connected'}
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-main-600 dark:text-main-400 mt-1">
                  <p>{robot.ip}:{robot.port}</p>
                </div>

                {robot.lastConnected && (
                  <div className="text-xs text-main-500 dark:text-main-500 mt-1">
                    Last connected: {getTimeAgo(robot.lastConnected)}
                  </div>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                {isConnected ? (
                  <Button
                    onClick={() => onDisconnect?.(robot.id)}
                    disabled={isConnecting || isLoading}
                    className="px-1 font-semibold text-xs bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Disconnect from robot"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={() => onConnect(robot)}
                    disabled={isConnecting || isLoading}
                    className="px-1 font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Connect to robot"
                  >
                    Connect
                  </Button>
                )}

                <Button
                  onClick={() => onEdit(robot)}
                  disabled={isConnecting || isLoading}
                  className="px-1 font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit robot"
                >
                  Edit
                </Button>

                <Button
                  onClick={() => onDelete(robot.id)}
                  active={false}
                  disabled={isConnecting || isLoading}
                  className="px-1 border-red-500 dark:border-red-500 hover:bg-red-300 dark:hover:bg-red-800 font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete robot"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
