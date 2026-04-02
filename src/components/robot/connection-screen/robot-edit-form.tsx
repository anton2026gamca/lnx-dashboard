/**
 * Robot edit form component
 */

'use client';

import React, { useState } from 'react';
import { RobotConnection } from '@/types/robot';
import { validateIP, validatePort } from '@/lib/robotUtils'
import { Button } from '@/components/ui/button';

interface RobotEditFormProps {
  robot: RobotConnection;
  onSave: (robot: RobotConnection) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onCancel: () => void;
}

export const RobotEditForm: React.FC<RobotEditFormProps> = ({
  robot,
  onSave,
  isLoading = false,
  error,
  onCancel,
}) => {
  const [name, setName] = useState(robot.name);
  const [ip, setIp] = useState(robot.ip);
  const [port, setPort] = useState(robot.port.toString());
  const [token, setToken] = useState(robot.token || '');
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
      const updatedRobot: RobotConnection = {
        ...robot,
        name: name.trim(),
        ip: ip.trim(),
        port: parseInt(port, 10),
        token: token.trim() || undefined,
      };
      await onSave(updatedRobot);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update robot';
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = error || formError;

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
          className="mt-1 block w-full px-2 border border-main-400 dark:border-main-600 shadow-sm 
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
            className="mt-1 block w-full px-2 border border-main-400 dark:border-main-600 shadow-sm 
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
            className="mt-1 block w-full px-2 border border-main-400 dark:border-main-600 shadow-sm 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                       bg-main-100 text-main-900 dark:bg-main-700 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
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
            className="mt-1 block w-full px-2 border border-main-400 dark:border-main-600 shadow-sm 
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
        <Button
          onClick={() => {}}
          className="flex-1 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isSubmitting}
          title="Save changes"
        >
          <span>
            {isLoading || isSubmitting ? 'Saving...' : 'Save Changes'}
          </span>
        </Button>

        <Button
          onClick={onCancel}
          className="font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          active={false}
          disabled={isLoading || isSubmitting}
          title="Cancel"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
