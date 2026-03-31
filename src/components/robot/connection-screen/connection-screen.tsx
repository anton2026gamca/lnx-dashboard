/**
 * Main robot connection screen component
 */

'use client';

import React, { useState } from 'react';
import { useRobot } from '@/context/RobotContext';
import { RobotConnectionForm } from './connection-form';
import { SavedRobotsList } from './saved-robots-list';
import { RobotConnection } from '@/types/robot';

export const RobotConnectionScreen: React.FC = () => {
  const {
    connectionState,
    savedRobots,
    connectToRobot,
    disconnectFromRobot,
    saveRobot,
    deleteSavedRobot,
  } = useRobot();

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleConnect = async (robot: RobotConnection) => {
    setFormError(null);

    try {
      // If already connected, disconnect first
      if (connectionState.isConnected && connectionState.connectedRobot?.id === robot.id) {
        disconnectFromRobot();
        return;
      }

      // If connected to a different robot, disconnect first
      if (connectionState.isConnected && connectionState.connectedRobot?.id !== robot.id) {
        disconnectFromRobot();
      }
      
      await connectToRobot(robot);
      saveRobot(robot);
      setShowForm(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setFormError(errorMessage);
    }
  };

  const handleQuickConnect = async (robot: RobotConnection) => {
    if (connectionState.connectedRobot?.id === robot.id) {
      disconnectFromRobot();
    } else {
      await handleConnect(robot);
    }
  };

  const handleDeleteRobot = (id: string) => {
    deleteSavedRobot(id);
  };

  return (
    <div className="min-h-screen bg-main-100 dark:bg-main-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-main-900 dark:text-white mb-2">
            LNX Robot Dashboard
          </h1>
        </div>

        {/* Current Connection Status */}
        {connectionState.isConnected && connectionState.connectedRobot && (
          <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-300">
                  Connected to {connectionState.connectedRobot.name}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {connectionState.connectedRobot.ip}:{connectionState.connectedRobot.port}
                </p>
              </div>
              <button
                onClick={() => {
                  disconnectFromRobot();
                  setShowForm(false);
                }}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Connection Error */}
        {connectionState.error && !connectionState.isConnecting && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">Connection Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400">{connectionState.error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-2">
          {/* Saved Robots Section */}
          <div className="bg-main-200 dark:bg-main-800 rounded-lg shadow-lg border border-main-300 dark:border-main-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-main-900 dark:text-white">Saved Robots</h2>
              {savedRobots.length > 0 && (
                <span className="px-3 py-1 bg-main-300 dark:bg-gray-700 text-main-700 dark:text-gray-300 text-sm rounded-full">
                  {savedRobots.length} robot{savedRobots.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {savedRobots.length > 0 ? (
              <SavedRobotsList
                robots={savedRobots}
                connectedRobotId={connectionState.connectedRobot?.id}
                isConnecting={connectionState.isConnecting}
                onConnect={handleQuickConnect}
                onDelete={handleDeleteRobot}
                isLoading={connectionState.isConnecting}
              />
            ) : (
              <p className="text-main-500 dark:text-gray-400 text-center py-4">
                No saved robots yet. Add one using the form below.
              </p>
            )}
          </div>

          {/* Add New Robot Section */}
          <div className="bg-main-200 dark:bg-main-800 rounded-lg shadow-lg border border-main-300 dark:border-main-700 p-3">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full p-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors border border-blue-700"
              >
                + Add New Robot
              </button>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-main-900 dark:text-white mb-4">Add New Robot</h2>
                <RobotConnectionForm
                  onConnect={handleConnect}
                  isLoading={connectionState.isConnecting}
                  error={formError}
                  onCancel={() => {
                    setShowForm(false);
                    setFormError(null);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
