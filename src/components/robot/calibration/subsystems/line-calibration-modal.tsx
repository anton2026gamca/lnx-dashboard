/**
 * Line Sensor Calibration Modal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLineCalibration } from '@/hooks/useCalibration';
import { robotClient } from '@/lib/robotAPIClient';
import { ManualMovementComponent, ModeComponent } from '../../dashboard/control-panel';

interface LineCalibrationModalProps {
  onClose: () => void;
}

type Phase = 'phase1' | 'phase2' | 'manual' | null;

export const LineCalibrationModal: React.FC<LineCalibrationModalProps> = ({ onClose }) => {
  const { startPhase, stop, cancel, status } = useLineCalibration();
  const [currentPhase, setCurrentPhase] = useState<Phase>(null);
  const [thresholds, setThresholds] = useState<number[][]>([]);
  const [manualData, setManualData] = useState<{
    current_thresholds?: number[][];
    phase1_min?: number[];
    phase1_max?: number[];
    phase2_min?: number[];
    phase2_max?: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartPhase = async (phase: 1 | 2) => {
    setLoading(true);
    setError(null);
    await startPhase(phase);
    setCurrentPhase(phase === 1 ? 'phase1' : 'phase2');
    setLoading(false);
  };

  const handleStopPhase = async () => {
    setLoading(true);
    const result = await stop();
    if (result) {
      setThresholds(result.thresholds || []);
      if (result.can_start_phase2 && currentPhase === 'phase1') {
        setError(null);
        // Can continue to phase 2 or skip to manual
      } else {
        setCurrentPhase('manual');
        loadManualAdjustmentData();
      }
    }
    setLoading(false);
  };

  const handleOpenManualDirectly = async () => {
    setCurrentPhase('manual');
    await loadManualAdjustmentData();
  };

  const loadManualAdjustmentData = async () => {
    try {
      const status = await robotClient.getLineCalibrationStatus();
      if (status) {
        setManualData({
          current_thresholds: status.current_thresholds || [],
          phase1_min: status.phase1_min,
          phase1_max: status.phase1_max,
          phase2_min: status.phase2_min,
          phase2_max: status.phase2_max,
        });
        setThresholds(status.current_thresholds || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calibration data');
    }
  };

  const handleApplyManual = async () => {
    try {
      setLoading(true);
      setError(null);

      if (thresholds.length === 0) {
        setError('No thresholds to apply');
        return;
      }

      await robotClient.setLineThresholds(thresholds);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply thresholds');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      await cancel();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <ModeComponent />
      <ManualMovementComponent compact />

      {currentPhase === null && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Button
              onClick={() => handleStartPhase(1)}
              disabled={loading}
              className="w-full text-xs"
            >
              {loading ? 'Starting...' : 'Start Phase 1 (Field)'}
            </Button>

            <Button
              onClick={handleOpenManualDirectly}
              className="w-full text-xs"
            >
              Open Manual Adjustment
            </Button>
          </div>
        </div>
      )}

      {currentPhase === 'phase1' && (
        <div className="space-y-3">
          <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 p-2 text-xs text-blue-900 dark:text-blue-200">
            <p className="font-bold">Phase 1: Field Calibration</p>
            <p>Drive the robot around the field to record min/max sensor values.</p>
          </div>

          {status && (
            <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2 space-y-1">
              <p className="text-xs font-bold text-main-900 dark:text-white">Live Status:</p>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {status.calibration_min?.map((minVal, i) => (
                  <div key={i} className="bg-main-100 dark:bg-main-800 p-1">
                    <p className="font-bold">S{i}</p>
                    <p>{minVal}-{status.calibration_max?.[i] || '?'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-1">
            <Button
              onClick={handleStopPhase}
              disabled={loading}
              className="flex-1 text-xs"
            >
              {loading ? 'Stopping...' : 'Apply & Continue'}
            </Button>
            <Button
              onClick={handleCancel}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {currentPhase === 'phase2' && (
        <div className="space-y-3">
          <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 p-2 text-xs text-blue-900 dark:text-blue-200">
            <p className="font-bold">Phase 2: Line Verification</p>
            <p>Drive across lines to refine sensor thresholds.</p>
          </div>

          {status && (
            <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2 space-y-1">
              <p className="text-xs font-bold text-main-900 dark:text-white">Live Status:</p>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {status.calibration_min?.map((minVal, i) => (
                  <div key={i} className="bg-main-100 dark:bg-main-800 p-1">
                    <p className="font-bold">S{i}</p>
                    <p>{minVal}-{status.calibration_max?.[i] || '?'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-1">
            <Button
              onClick={handleStopPhase}
              disabled={loading}
              className="flex-1 text-xs"
            >
              {loading ? 'Stopping...' : 'Apply & Continue'}
            </Button>
            <Button
              onClick={handleCancel}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {currentPhase === 'manual' && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-main-900 dark:text-white">
            Manual Threshold Adjustment
          </h4>

          <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2 overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-main-300 dark:bg-main-800">
                  <th className="px-1 py-1 text-left">Sensor</th>
                  <th className="px-1 py-1">Min</th>
                  <th className="px-1 py-1">Max</th>
                  <th className="px-1 py-1">P1 Min</th>
                  <th className="px-1 py-1">P1 Max</th>
                  {manualData?.phase2_min && <th className="px-1 py-1">P2 Min</th>}
                  {manualData?.phase2_max && <th className="px-1 py-1">P2 Max</th>}
                </tr>
              </thead>
              <tbody>
                {(manualData?.current_thresholds || thresholds || []).map((threshold, idx) => (
                  <tr key={idx} className="border-t border-main-300 dark:border-main-700">
                    <td className="px-1 py-1">{idx}</td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={threshold[0]}
                        onChange={(e) => {
                          const newThresholds = [...(thresholds || manualData?.current_thresholds || [])];
                          newThresholds[idx] = [parseInt(e.target.value), threshold[1]];
                          setThresholds(newThresholds);
                        }}
                        className="w-12 px-1 bg-main-100 dark:bg-main-800 border border-main-300 dark:border-main-700"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={threshold[1]}
                        onChange={(e) => {
                          const newThresholds = [...(thresholds || manualData?.current_thresholds || [])];
                          newThresholds[idx] = [threshold[0], parseInt(e.target.value)];
                          setThresholds(newThresholds);
                        }}
                        className="w-12 px-1 bg-main-100 dark:bg-main-800 border border-main-300 dark:border-main-700"
                      />
                    </td>
                    <td className="px-1 py-1">{manualData?.phase1_min?.[idx]}</td>
                    <td className="px-1 py-1">{manualData?.phase1_max?.[idx]}</td>
                    {manualData?.phase2_min && <td className="px-1 py-1">{manualData.phase2_min[idx]}</td>}
                    {manualData?.phase2_max && <td className="px-1 py-1">{manualData.phase2_max[idx]}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-1">
            <Button
              onClick={handleApplyManual}
              disabled={loading}
              className="flex-1 text-xs"
            >
              {loading ? 'Applying...' : 'Apply & Close'}
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-200 px-2 py-1 text-xs">
          {error}
        </div>
      )}
    </div>
  );
};
