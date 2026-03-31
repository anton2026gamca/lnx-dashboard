/**
 * Robot connection form component
 */

'use client';

import React, { useState } from 'react';
import { useRobot } from '@/context/RobotContext';
import { RobotConnection } from '@/types/robot';
import { validateIP, validatePort } from '@/lib/robotUtils'

interface RobotConnectionFormProps {
  onConnect: (robot: RobotConnection) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onCancel?: () => void;
}

export const RobotConnectionForm: React.FC<RobotConnectionFormProps> = ({
  onConnect,
  isLoading = false,
  error,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('192.168.1.100');
  const [port, setPort] = useState('8000');
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

    // Basic IP validation
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

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const robot: RobotConnection = useRobot().createNewRobotConnection(name.trim(), ip.trim(), parseInt(port, 10));
      await onConnect(robot);
      setName('');
      setIp('192.168.1.100');
      setPort('8000');
    } catch (err) {
      // Error is handled by parent component
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
          className="mt-1 block w-full px-2 border border-main-400 dark:border-main-600 rounded-md shadow-sm 
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
            className="mt-1 block w-full px-2 border border-main-400 dark:border-main-600 rounded-md shadow-sm 
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
            className="mt-1 block w-full px-2 border border-main-400 dark:border-main-600 rounded-md shadow-sm 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                       bg-main-100 text-main-900 dark:bg-main-700 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {displayError && (
        <div className="p-1 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">{displayError}</p>
        </div>
      )}

      <div className={`flex gap-2 ${displayError ? '' : 'pt-1'}`}>
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="flex-1 p-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || isSubmitting ? 'Connecting...' : 'Connect'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
            className="px-4 p-1 bg-main-300 dark:bg-main-700 hover:bg-main-400 dark:hover:bg-main-600
                       text-main-900 dark:text-white font-medium rounded-md
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
