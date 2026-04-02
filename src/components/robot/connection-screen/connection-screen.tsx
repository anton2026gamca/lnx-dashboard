/**
 * Main robot connection screen component
 */

'use client';

import React, { useState } from 'react';
import { useRobot } from '@/context/RobotContext';
import { RobotConnectionForm } from './connection-form';
import { RobotEditForm } from './robot-edit-form';
import { SavedRobotsList } from './saved-robots-list';
import { RobotConnection } from '@/types/robot';
import { Button } from '@/components/ui/button';

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
  const [editingRobot, setEditingRobot] = useState<RobotConnection | null>(null);

  const handleConnect = async (robot: RobotConnection) => {
    setFormError(null);

    try {
      if (connectionState.isConnected && connectionState.connectedRobot?.id === robot.id) {
        disconnectFromRobot();
        return;
      }

      if (connectionState.isConnected && connectionState.connectedRobot?.id !== robot.id) {
        disconnectFromRobot();
      }
      
      saveRobot(robot);
      
      await connectToRobot(robot);
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

  const handleEditRobot = (robot: RobotConnection) => {
    setEditingRobot(robot);
  };

  const handleSaveEditedRobot = async (updatedRobot: RobotConnection) => {
    setFormError(null);
    try {
      saveRobot(updatedRobot);
      setEditingRobot(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update robot';
      setFormError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-main-100 dark:bg-main-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl flex items-center justify-center md:text-4xl font-bold text-main-900 dark:text-white mb-2">
            LNX Robot Dashboard
          </h1>
        </div>

        {/* Current Connection Status */}
        {connectionState.isConnected && connectionState.connectedRobot && (
          <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-300">
                  Connected to {connectionState.connectedRobot.name}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {connectionState.connectedRobot.ip}:{connectionState.connectedRobot.port}
                </p>
              </div>
              <Button
                onClick={() => {
                  disconnectFromRobot();
                  setShowForm(false);
                }}
                className="px-2 py-1 font-semibold"
                title="Disconnect from robot"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Connection Error */}
        {connectionState.error && !connectionState.isConnecting && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 overflow-auto">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">Connection Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre">{connectionState.error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-2">
          {/* Saved Robots Section */}
          <div className="bg-main-200 dark:bg-main-800 shadow-lg border border-main-300 dark:border-main-700 p-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-main-900 dark:text-white">Saved Robots</h2>
              {savedRobots.length > 0 && (
                <span className="px-3 py-0.5 bg-main-300 dark:bg-gray-700 text-main-700 dark:text-gray-300 text-sm rounded-full">
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
                onEdit={handleEditRobot}
                isLoading={connectionState.isConnecting}
              />
            ) : (
              <p className="text-main-500 dark:text-gray-400 text-center py-4">
                No saved robots yet. Add one using the form below.
              </p>
            )}
          </div>

          {/* Add New Robot Section */}
          <div className="bg-main-200 dark:bg-main-800 shadow-lg border border-main-300 dark:border-main-700 p-2">
            {!showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="w-full font-semibold text-sm"
                title="Add new robot"
              >
                + Add New Robot
              </Button>
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

      {/* Edit Robot Modal */}
      {editingRobot && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-main-100 dark:bg-main-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-main-300 dark:border-main-700 p-4">
            <h2 className="text-2xl font-bold text-main-900 dark:text-white mb-4">Edit Robot</h2>
            <RobotEditForm
              robot={editingRobot}
              onSave={handleSaveEditedRobot}
              isLoading={connectionState.isConnecting}
              error={formError}
              onCancel={() => {
                setEditingRobot(null);
                setFormError(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
