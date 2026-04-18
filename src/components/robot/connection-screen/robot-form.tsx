'use client';

import React, { useState } from 'react';
import { RobotConnection, RobotColor } from '@/types/robot';
import { validateIP, validatePort } from '@/lib/robotUtils'
import { Button } from '@/components/ui/button';
import { getColorForRobot, getColorDotClass, ROBOT_COLORS } from '@/lib/robotColors';
import { cn } from '@/lib/utils';
import { useRobot } from '@/context/RobotContext';

interface RobotFormProps {
  robot?: RobotConnection;
  onSave?: (robot: RobotConnection) => Promise<void>;
  onConnect?: (robot: RobotConnection) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onCancel: () => void;
}

const COLORS = Object.keys(ROBOT_COLORS) as Array<keyof typeof ROBOT_COLORS>;

/**
 * Unified robot form that handles both editing existing robots and creating new connections.
 * 
 * Usage for editing:
 * <RobotForm robot={robotToEdit} onSave={handleSave} onCancel={handleCancel} />
 * 
 * Usage for creating new connection:
 * <RobotForm onConnect={handleConnect} onCancel={handleCancel} />
 */
export const RobotForm: React.FC<RobotFormProps> = ({
  robot,
  onSave,
  onConnect,
  isLoading = false,
  error,
  onCancel,
}) => {
  const robotCtx = useRobot();
  const isEditing = !!robot;

  const [name, setName] = useState(robot?.name || '');
  const [ip, setIp] = useState(robot?.ip || '192.168.1.100');
  const [port, setPort] = useState(robot?.port.toString() || '8000');
  const [token, setToken] = useState(robot?.token || '');
  const [color, setColor] = useState<RobotColor | undefined>(
    robot ? (robot.color as RobotColor) || getColorForRobot(robot.id) : undefined
  );
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    setFormError('');

    if (!name.trim()) {
      setFormError('Robot name is required');
      return false;
    }

    if (!ip.trim()) {
      setFormError('IP address is required');
      return false;
    }

    if (!validateIP(ip)) {
      setFormError('Invalid IP address format');
      return false;
    }

    const portNum = parseInt(port, 10);
    if (!validatePort(portNum)) {
      setFormError('Port must be between 1 and 65535');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && robot && onSave) {
        const updatedRobot: RobotConnection = {
          ...robot,
          name: name.trim(),
          ip: ip.trim(),
          port: parseInt(port, 10),
          color,
          token: token.trim() || undefined,
        };
        await onSave(updatedRobot);
      } else if (!isEditing && onConnect) {
        const newRobot: RobotConnection = robotCtx.createNewRobotConnection(
          name.trim(),
          ip.trim(),
          parseInt(port, 10),
          token.trim() || undefined,
          color,
        );
        await onConnect(newRobot);
        setName('');
        setIp('192.168.1.100');
        setPort('8000');
        setToken('');
        setColor(undefined);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (isEditing ? 'Failed to update robot' : 'Connection failed');
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = error || formError;
  const submitButtonText = isEditing
    ? (isLoading || isSubmitting ? 'Saving...' : 'Save Changes')
    : (isLoading || isSubmitting ? 'Connecting...' : 'Connect');

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-main-700 dark:text-main-300">
          Robot Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Main Bot, Lab Bot"
          disabled={isLoading || isSubmitting}
          className="mt-1 block w-full px-1 border border-main-400 dark:border-main-600 shadow-sm 
                     focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                     bg-main-100 text-main-900 dark:bg-main-700 dark:text-white
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ip" className="block text-sm font-medium text-main-700 dark:text-main-300">
            IP Address
          </label>
          <input
            type="text"
            id="ip"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.100"
            disabled={isLoading || isSubmitting}
            className="mt-1 block w-full px-1 border border-main-400 dark:border-main-600 shadow-sm 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                       bg-main-100 text-main-900 dark:bg-main-700 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="port" className="block text-sm font-medium text-main-700 dark:text-main-300">
            Port
          </label>
          <input
            type="number"
            id="port"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="8000"
            min="1"
            max="65535"
            disabled={isLoading || isSubmitting}
            className="mt-1 block w-full px-1 border border-main-400 dark:border-main-600 shadow-sm 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                       bg-main-100 text-main-900 dark:bg-main-700 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-main-700 dark:text-main-300">
            Color
          </label>
          <div className="mt-1 flex gap-1 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                disabled={isLoading || isSubmitting}
                className={cn(
                  'w-5 h-5 border-2',
                  color === c ? 'border-main-900 dark:border-white scale-110' : 'border-transparent',
                  getColorDotClass(c),
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <label htmlFor="token" className="block text-sm font-medium text-main-700 dark:text-main-300">
            Access Token (Optional)
          </label>
          <input
            type="password"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your access token"
            disabled={isLoading || isSubmitting}
            className="mt-1 block w-full px-1 border border-main-400 dark:border-main-600 shadow-sm 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                       bg-main-100 text-main-900 dark:bg-main-700 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {displayError && (
        <div className="p-1 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">{displayError}</p>
        </div>
      )}

      <div className={`flex gap-2 ${displayError ? '' : 'pt-1'}`}>
        <button
          type="submit"
          className="flex-1 px-1 text-xs font-medium border-2 bg-main-900 hover:bg-main-600 border-transparent text-white dark:bg-main-200 dark:hover:bg-main-400 dark:border-transparent dark:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isSubmitting}
          title={isEditing ? 'Save changes' : 'Connect'}
        >
          {submitButtonText}
        </button>

        {onCancel && (
          <Button
            onClick={onCancel}
            className="px-2 py-0.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            active={false}
            disabled={isLoading || isSubmitting}
            title="Cancel"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
