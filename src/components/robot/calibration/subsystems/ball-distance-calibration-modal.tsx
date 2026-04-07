/**
 * Camera Ball Distance Calibration Modal
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { robotClient } from '@/lib/robotAPIClient';
import { useVideoStream, useFrameDataUrl } from '@/hooks/useRobot';

interface BallDistanceCalibrationModalProps {
  onClose: () => void;
}

export const BallDistanceCalibrationModal: React.FC<BallDistanceCalibrationModalProps> = ({
  onClose,
}) => {
  const [knownDistance, setKnownDistance] = useState('200');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { frame } = useVideoStream(true, 15, true);
  const frameUrl = useFrameDataUrl(frame);

  const handleCalibrate = async () => {
    const distance = parseInt(knownDistance);

    if (isNaN(distance) || distance <= 0) {
      setError('Please enter a valid distance in millimeters');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await robotClient.calibrateBallDistance(distance);

      if (result) {
        setSuccess(`Calibration successful! Constant: ${result.calibration_constant}`);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calibration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-main-900 dark:text-white">
        Camera Ball Distance Calibration
      </h3>

      <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 p-2 text-xs text-blue-900 dark:text-blue-200">
        <p className="font-bold">Instructions:</p>
        <ol className="list-decimal list-inside space-y-1 mt-1">
          <li>Place the ball at a known distance from the camera</li>
          <li>Ensure the ball is visible in the camera feed below</li>
          <li>Enter the exact distance in millimeters</li>
          <li>Click Calibrate</li>
        </ol>
      </div>

      {frameUrl ? (
        <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2">
          <img
            src={frameUrl}
            alt="Camera Feed"
            className="w-full aspect-video object-contain border border-main-400 dark:border-main-600"
          />
        </div>
      ) : (
        <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2 aspect-video flex items-center justify-center">
          <p className="text-sm text-main-600 dark:text-main-400">Camera feed unavailable</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-bold text-main-900 dark:text-white">
          Known Distance (mm)
        </label>
        <input
          type="number"
          min="1"
          value={knownDistance}
          onChange={(e) => setKnownDistance(e.target.value)}
          placeholder="200"
          className="w-full px-2 py-2 bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 text-main-900 dark:text-white text-xs"
        />
        <p className="text-xs text-main-600 dark:text-main-400">
          Enter the actual distance from the camera to the ball
        </p>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-200 px-2 py-1 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-900 dark:text-green-200 px-2 py-1 text-xs">
          {success}
        </div>
      )}

      <div className="flex gap-1 pt-2 border-t border-main-300 dark:border-main-800">
        <Button
          onClick={handleCalibrate}
          disabled={loading}
          className="flex-1 text-xs"
        >
          {loading ? 'Calibrating...' : 'Calibrate'}
        </Button>
        <Button
          onClick={onClose}
          className="flex-1 text-xs"
        >
          Close
        </Button>
      </div>
    </div>
  );
};
