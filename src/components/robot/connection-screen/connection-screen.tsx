/**
 * Main robot connection screen component
 */

'use client';

import React, { useState } from 'react';
import { useRobot } from '@/context/RobotContext';
import { RobotForm } from './robot-form';
import { SavedRobotsList } from './saved-robots-list';
import { RobotConnection } from '@/types/robot';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Modal } from '@/components/ui/modal';

interface RobotConnectionScreenProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export const RobotConnectionScreen: React.FC<RobotConnectionScreenProps> = ({ isOverlay = false, onClose }) => {
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
      saveRobot(robot);
      await connectToRobot(robot);
      setShowForm(false);
      if (isOverlay && onClose) {
        onClose();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setFormError(errorMessage);
    }
  };

  const handleQuickConnect = async (robot: RobotConnection) => {
    await handleConnect(robot);
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

  // Modal/Overlay mode - for connecting additional robots
  if (isOverlay) {
    return (
      <Modal isOpen={true} onClose={onClose ?? (() => {return})} title="Connect to Another Robot">
        {formError && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 overflow-auto">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">Connection Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre">{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          {/* Saved Robots Section */}
          {savedRobots.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-main-900 dark:text-white">Saved Robots</h3>
                <span className="px-2 py-0.5 bg-main-300 dark:bg-gray-700 text-main-700 dark:text-gray-300 text-xs">
                  {savedRobots.length} robot{savedRobots.length !== 1 ? 's' : ''}
                </span>
              </div>
              <SavedRobotsList
                robots={savedRobots}
                connectedRobotId={connectionState.connectedRobot?.id}
                connectedRobotIds={connectionState.connectedRobots.map(r => r.id)}
                isConnecting={connectionState.isConnecting}
                onConnect={handleQuickConnect}
                onDisconnect={(robotId) => {
                  // Trigger disconnect but keep the dialog open
                  disconnectFromRobot(robotId);
                }}
                onDelete={handleDeleteRobot}
                onEdit={handleEditRobot}
                isLoading={connectionState.isConnecting}
              />
            </div>
          )}

          {/* Add New Robot Section */}
          <Button onClick={() => setShowForm(true)} className="w-full font-semibold text-sm" title="Add new robot">
            + Add New Robot
          </Button>
          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Robot">
            <RobotForm
              onConnect={handleConnect}
              isLoading={connectionState.isConnecting}
              error={formError}
              onCancel={() => {
                setShowForm(false);
                setFormError(null);
              }}
            />
          </Modal>
        </div>

        {/* Edit Robot Modal */}
        {editingRobot && (
          <Modal onClose={() => setEditingRobot(null)} title="Edit Robot">
            <RobotForm
              robot={editingRobot}
              onSave={handleSaveEditedRobot}
              isLoading={connectionState.isConnecting}
              error={formError}
              onCancel={() => {
                setEditingRobot(null);
                setFormError(null);
              }}
            />
          </Modal>
        )}
      </Modal>
    );
  }

  // Full screen mode - initial connection
  return (
    <div className="min-h-screen bg-main-100 dark:bg-main-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="my-16 pb-4">
          <h1 className="text-3xl flex items-center justify-center md:text-4xl font-bold text-main-900 dark:text-white">
            LNX Robot Dashboard
          </h1>
        </div>

        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Connection Error */}
        {formError && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 overflow-auto">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">Connection Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre">{formError}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-2">
          {/* Saved Robots Section */}
          <div className="bg-main-200 dark:bg-main-800 shadow-lg border border-main-300 dark:border-main-700 p-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-main-900 dark:text-white">Saved Robots</h2>
              {savedRobots.length > 0 && (
                <span className="px-3 py-0.5 bg-main-300 dark:bg-gray-700 text-main-700 dark:text-gray-300 text-sm">
                  {savedRobots.length} robot{savedRobots.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {savedRobots.length > 0 ? (
              <SavedRobotsList
                robots={savedRobots}
                connectedRobotId={connectionState.connectedRobot?.id}
                connectedRobotIds={connectionState.connectedRobots.map(r => r.id)}
                isConnecting={connectionState.isConnecting}
                onConnect={handleQuickConnect}
                onDisconnect={(robotId) => {
                  // Trigger disconnect
                  disconnectFromRobot(robotId);
                }}
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
            <Button
              onClick={() => setShowForm(true)}
              className="w-full font-semibold text-sm"
              title="Add new robot"
            >
              + Add New Robot
            </Button>
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Robot">
              <RobotForm
                onConnect={handleConnect}
                isLoading={connectionState.isConnecting}
                error={formError}
                onCancel={() => {
                  setShowForm(false);
                  setFormError(null);
                }}
              />
            </Modal>
          </div>
        </div>
      </div>

      {/* Edit Robot Modal */}
      {editingRobot && (
        <Modal onClose={() => setEditingRobot(null)} title="Edit Robot">
          <RobotForm
            robot={editingRobot}
            onSave={handleSaveEditedRobot}
            isLoading={connectionState.isConnecting}
            error={formError}
            onCancel={() => {
              setEditingRobot(null);
              setFormError(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
};
