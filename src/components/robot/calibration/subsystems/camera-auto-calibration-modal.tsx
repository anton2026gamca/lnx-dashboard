/**
 * Camera Auto Calibration Modal
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { robotClient, SingleVideoCamera } from '@/lib/robotAPIClient';

interface CameraAutoCalibrationModalProps {
  onClose: () => void;
}

export const CameraAutoCalibrationModal: React.FC<CameraAutoCalibrationModalProps> = ({ onClose }) => {
  const [camera, setCamera] = useState<SingleVideoCamera>('front');
  const [settleTimeS, setSettleTimeS] = useState('2.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    camera?: SingleVideoCamera;
    result?: {
      color_gains: [number, number];
      exposure_time: number | null;
      analogue_gain: number | null;
      settle_time_s: number;
    };
  } | null>(null);

  const handleRunAutoCalibration = async () => {
    const settle = Number(settleTimeS);
    if (Number.isNaN(settle) || settle <= 0) {
      setError('Settle time must be a positive number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const response = await robotClient.cameraAutoCalibration(camera, settle);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run camera auto calibration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-main-900 dark:text-white">
        Camera Auto Calibration
      </h3>

      <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 p-2 text-xs text-blue-900 dark:text-blue-200">
        Temporarily enables AWB/AE to adapt to current lighting, then locks learned values and copy them to other cameras.
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-main-900 dark:text-white">
          Reference Camera
        </label>
        <div className="grid grid-cols-2 gap-1">
          <Button onClick={() => setCamera('front')} active={camera === 'front'} className="text-xs">Front</Button>
          <Button onClick={() => setCamera('back')} active={camera === 'back'} className="text-xs">Back</Button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-main-900 dark:text-white">
          Settle Time (s)
        </label>
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={settleTimeS}
          onChange={(e) => setSettleTimeS(e.target.value)}
          className="w-full px-1 py-0.5 bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 text-main-900 dark:text-white text-xs"
        />
      </div>

      {result?.result && (
        <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2 text-xs space-y-2">
          <div>
            <p className="font-bold text-main-900 dark:text-white">Front</p>
            <p>Color gains: {result.result.color_gains?.[0] ?? '--'}, {result.result.color_gains?.[1] ?? '--'}</p>
            <p>Exposure time: {result.result.exposure_time ?? '--'} µs</p>
            <p>Analogue gain: {result.result.analogue_gain ?? '--'}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-200 px-2 py-1 text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-1 pt-2 border-t border-main-300 dark:border-main-800">
        <Button
          onClick={handleRunAutoCalibration}
          disabled={loading}
          className="flex-1 text-xs"
        >
          {loading ? 'Calibrating...' : 'Run Auto Calibration'}
        </Button>
      </div>
    </div>
  );
};

