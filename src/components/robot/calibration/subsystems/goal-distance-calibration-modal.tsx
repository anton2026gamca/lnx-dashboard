/**
 * Goal Distance Calibration Modal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGoalDistanceCalibration } from '@/hooks/useCalibration';
import { useVideoStream, useFrameDataUrl } from '@/hooks/useRobot';
import { useRobotMode } from '@/hooks/useRobot';
import { ModeComponent } from '@/components/robot/dashboard/control-panel/mode-component';
import { ManualMovementComponent, SettingsComponent } from '../../dashboard/control-panel';
import { robotClient } from '@/lib/robotAPIClient';

interface GoalDistanceCalibrationModalProps {
  onClose: () => void;
}

export const GoalDistanceCalibrationModal: React.FC<GoalDistanceCalibrationModalProps> = ({
  onClose,
}) => {
  const { start, stop, cancel, isActive, status, loading, error } = useGoalDistanceCalibration();
  const [initialDistance, setInitialDistance] = useState('200');
  const [lineDistance, setLineDistance] = useState('200');
  const [calibrationStarted, setCalibrationStarted] = useState(false);
  const [focalLength, setFocalLength] = useState('');
  const [settingFocalLength, setSettingFocalLength] = useState(false);
  const [focalLengthError, setFocalLengthError] = useState('');
  const [focalLengthSuccess, setFocalLengthSuccess] = useState('');

  const { frame } = useVideoStream(true, 15, true);
  const frameUrl = useFrameDataUrl(frame);

  const handleStartCalibration = async () => {
    const initDist = parseInt(initialDistance);
    const lineDist = parseInt(lineDistance);

    if (isNaN(initDist) || isNaN(lineDist) || initDist <= 0 || lineDist <= 0) {
      return;
    }

    try {
      await start(initDist, lineDist);
      setCalibrationStarted(true);
    } catch (err) {
      console.error('Failed to start calibration:', err);
    }
  };

  const handleStopCalibration = async () => {
    try {
      const result = await stop();
      if (result) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to stop calibration:', err);
    }
  };

  const handleCancel = async () => {
    try {
      await cancel();
      setCalibrationStarted(false);
    } catch (err) {
      console.error('Failed to cancel calibration:', err);
    }
  };

  const handleSetFocalLength = async () => {
    const focalLengthValue = parseFloat(focalLength);

    if (isNaN(focalLengthValue) || focalLengthValue <= 0) {
      setFocalLengthError('Please enter a valid focal length value');
      setFocalLengthSuccess('');
      return;
    }

    setSettingFocalLength(true);
    setFocalLengthError('');
    setFocalLengthSuccess('');

    try {
      await robotClient.setGoalFocalLength(focalLengthValue);
      setFocalLengthSuccess(`Focal length set to ${focalLengthValue}`);
      setFocalLength('');
    } catch (err) {
      console.error('Failed to set focal length:', err);
      setFocalLengthError(`Failed to set focal length: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSettingFocalLength(false);
    }
  };


  const getInstructionText = (): string => {
    if (!calibrationStarted || !isActive) {
      return 'Enter distances and click Start Calibration';
    }

    if (!status?.initial_height_pixels || status.initial_height_pixels === 0) {
      return 'Point the camera at the enemy goal to begin.';
    }

    if (status.phase === 'driving' && (!status.line_height_pixels || status.line_height_pixels === 0)) {
      return 'Drive toward the enemy goal until line is detected.';
    }

    if (status.line_height_pixels && status.line_height_pixels > 0) {
      return 'Line detected! Click Stop & Calculate to finish.';
    }

    return 'Calibration in progress...';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-main-900 dark:text-white">
        Goal Distance Calibration
      </h3>

      {!calibrationStarted && (
        <div className="space-y-3">
          <div className="border-t border-main-300 dark:border-main-800"></div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Enter focal length"
                value={focalLength}
                onChange={(e) => setFocalLength(e.target.value)}
                className="flex-1 px-1 py-0.5 bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 text-main-900 dark:text-white text-xs"
              />
              <Button
                onClick={handleSetFocalLength}
                disabled={settingFocalLength || !focalLength}
                className="text-xs"
              >
                {settingFocalLength ? 'Setting...' : 'Set'}
              </Button>
            </div>
            {focalLengthError && (
              <p className="text-xs text-red-600 dark:text-red-400">{focalLengthError}</p>
            )}
            {focalLengthSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400">{focalLengthSuccess}</p>
            )}
          </div>

          <div className="border-t border-main-300 dark:border-main-800"></div>

          <div className="space-y-2">
            <ModeComponent />
            <SettingsComponent hideAutonomous hideTabBar />
            <ManualMovementComponent compact />
          </div>

          <div className="border-t border-main-300 dark:border-main-800"></div>

          <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 p-2 text-xs text-blue-900 dark:text-blue-200">
            <p className="font-bold text-main-900 dark:text-white mb-1">Instruction:</p>
            <p className="text-main-700 dark:text-main-300">{getInstructionText()}</p>

            {status && (
              <div className="mt-2 space-y-1 text-xs">
                <p>
                  <span className="font-bold">Initial Height:</span> {`${status.initial_height_pixels} px` || 'not detected'}
                </p>
                <p>
                  <span className="font-bold">Line Height:</span> {`${status.line_height_pixels} px` || 'not detected'}
                </p>
                <p>
                  <span className="font-bold">Phase:</span> {status.phase}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-main-900 dark:text-white mb-1">
                Initial Distance (mm)
              </label>
              <input
                type="number"
                min="1"
                value={initialDistance}
                onChange={(e) => setInitialDistance(e.target.value)}
                className="w-full px-1 py-0.5 bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 text-main-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-main-900 dark:text-white mb-1">
                Line Distance (mm)
              </label>
              <input
                type="number"
                min="1"
                value={lineDistance}
                onChange={(e) => setLineDistance(e.target.value)}
                className="w-full px-1 py-0.5 bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 text-main-900 dark:text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}

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

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-200 px-1 py-1 text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-1">
        {!calibrationStarted ? (
          <>
            <Button
              onClick={handleStartCalibration}
              disabled={loading}
              className="flex-1 text-xs"
            >
              {loading ? 'Starting...' : 'Start Calibration'}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleStopCalibration}
              disabled={loading}
              className="flex-1 text-xs"
            >
              {loading ? 'Stopping...' : 'Stop & Calculate'}
            </Button>
            <Button onClick={handleCancel} className="flex-1 text-xs">
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
