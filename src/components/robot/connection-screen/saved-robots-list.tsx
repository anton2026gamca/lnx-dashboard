/**
 * Saved robots list component
 */

'use client';

import React from 'react';
import { RobotConnection } from '@/types/robot';

interface SavedRobotsListProps {
  robots: RobotConnection[];
  connectedRobotId?: string;
  isConnecting?: boolean;
  onConnect: (robot: RobotConnection) => void;
  onDelete: (id: string) => void;
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
  isConnecting = false,
  onConnect,
  onDelete,
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
      {robots.map((robot) => (
        <div
          key={robot.id}
          className={`p-2 border rounded-lg transition-all ${
            connectedRobotId === robot.id
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              : 'bg-main-200 dark:bg-main-800 border-main-300 dark:border-main-700 hover:border-main-400 dark:hover:border-main-600'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-main-900 dark:text-white truncate">{robot.name}</h3>
                {connectedRobotId === robot.id && (
                  <span className="inline-flex items-center gap-1 px-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                    <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
                    Connected
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

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => onConnect(robot)}
                disabled={isConnecting || isLoading}
                className={`px-3 py-1 rounded-md font-medium transition-colors text-sm ${
                  connectedRobotId === robot.id
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {connectedRobotId === robot.id ? 'Disconnect' : 'Connect'}
              </button>

              <button
                onClick={() => onDelete(robot.id)}
                disabled={isConnecting || isLoading}
                className="px-3 py-1 bg-main-300 dark:bg-main-700 hover:bg-main-400 dark:hover:bg-main-600 text-main-900 dark:text-white font-medium rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
