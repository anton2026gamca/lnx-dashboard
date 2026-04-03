/**
 * Reset Compass Calibration Modal
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { robotClient } from '@/lib/robotAPIClient';

interface ResetCompassModalProps {
  onClose: () => void;
}

export const ResetCompassModal: React.FC<ResetCompassModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetCompass = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await robotClient.resetCompass();
      setSuccess(true);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset compass');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-main-900 dark:text-white">
        Reset Compass
      </h3>

      <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 p-2 text-xs text-yellow-900 dark:text-yellow-200">
        <p className="font-bold">Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 mt-1">
          <li>Place the robot on a level surface</li>
          <li>Position it so the front faces North (or your reference direction)</li>
          <li>Keep the robot still during reset</li>
          <li>Click Reset Compass</li>
        </ol>
      </div>

      <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 p-2 text-xs text-blue-900 dark:text-blue-200">
        <p>
          This will calibrate the compass to use the current orientation as the reference (0°).
        </p>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-200 px-2 py-1 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-900 dark:text-green-200 px-2 py-1 text-xs">
          ✓ Compass reset successfully!
        </div>
      )}

      <div className="flex gap-1 pt-2 border-t border-main-300 dark:border-main-800">
        <Button
          onClick={handleResetCompass}
          disabled={loading || success}
          className="flex-1 text-xs"
        >
          {loading ? 'Resetting...' : success ? 'Success!' : 'Reset Compass'}
        </Button>
        <Button onClick={onClose} className="flex-1 text-xs">
          Close
        </Button>
      </div>
    </div>
  );
};
