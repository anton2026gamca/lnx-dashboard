/**
 * Goal Color Calibration Modal
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { robotClient } from '@/lib/robotAPIClient';
import { ColorCalibrationWorkflow } from './color-calibration-workflow';
import { DrawRegion } from '@/types/calibration';
import type { VideoCamera } from '@/lib/robotAPIClient';

interface GoalColorCalibrationModalProps {
  onClose: () => void;
}

export const GoalColorCalibrationModal: React.FC<GoalColorCalibrationModalProps> = ({ onClose }) => {
  const [selectedColor, setSelectedColor] = useState<'yellow' | 'blue' | null>(null);
  const [camera, setCamera] = useState<VideoCamera>('front');
  const [regions, setRegions] = useState<{ yellow: DrawRegion[]; blue: DrawRegion[] }>({
    yellow: [],
    blue: [],
  });
  const [loading, setLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const handleRegionAdded = (region: DrawRegion) => {
    if (!selectedColor) return;
    setRegions((prev) => ({
      ...prev,
      [selectedColor]: [...prev[selectedColor], region],
    }));
  };

  const handleRegionChanged = (index: number, newRegion: DrawRegion | null) => {
    if (!selectedColor) return;
    
    setRegions((prev) => {
      const updatedRegions = [...prev[selectedColor]];
      if (newRegion === null) {
        updatedRegions.splice(index, 1);
      } else {
        updatedRegions[index] = newRegion;
      }
      return {
        ...prev,
        [selectedColor]: updatedRegions,
      };
    });
  };

  const handleClearRegions = () => {
    if (!selectedColor) return;
    setRegions((prev) => ({
      ...prev,
      [selectedColor]: [],
    }));
  };

  const handleWorkflowApply = async () => {
    try {
      setWorkflowError(null);
      setLoading(true);
      const color = selectedColor!;

      const colorRanges = regions[color].map((region) => ({
        lower: [region.hsv!.h_min, region.hsv!.s_min, region.hsv!.v_min] as [number, number, number],
        upper: [region.hsv!.h_max, region.hsv!.s_max, region.hsv!.v_max] as [number, number, number],
      }));

      await robotClient.setGoalColorCalibration(
        camera,
        color === 'yellow' ? colorRanges : undefined,
        color === 'blue' ? colorRanges : undefined,
      );

      setSelectedColor(null);
      setRegions({ yellow: [], blue: [] });
      onClose();
    } catch (err) {
      setWorkflowError(err instanceof Error ? err.message : 'Failed to apply settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCurrentCalibration = async () => {
    if (!selectedColor) {
      return;
    }

    try {
      setWorkflowError(null);
      setLoading(true);

      const calibration = await robotClient.getGoalColorCalibration(camera);
      if (!calibration) {
        setRegions((prev) => ({ ...prev, [selectedColor]: [] }));
        return;
      }

      const extractedRanges =
        calibration.camera === 'both'
          ? [
              ...(calibration.front?.[`${selectedColor}_ranges`] ?? []),
              ...(calibration.back?.[`${selectedColor}_ranges`] ?? []),
            ]
          : calibration[`${selectedColor}_ranges`];

      const uniqueRanges = Array.from(new Map(
        extractedRanges.map((range) => [JSON.stringify(range), range]),
      ).values());

      setRegions((prev) => ({
        ...prev,
        [selectedColor]: uniqueRanges.map((range, index) => ({
          id: `current-${selectedColor}-${camera}-${index}`,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          hsv: {
            h_min: range.lower[0],
            s_min: range.lower[1],
            v_min: range.lower[2],
            h_max: range.upper[0],
            s_max: range.upper[1],
            v_max: range.upper[2],
          },
          originalHsv: {
            h_min: range.lower[0],
            s_min: range.lower[1],
            v_min: range.lower[2],
            h_max: range.upper[0],
            s_max: range.upper[1],
            v_max: range.upper[2],
          },
        })),
      }));
    } catch (err) {
      setWorkflowError(err instanceof Error ? err.message : 'Failed to load current calibration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {selectedColor === null ? (
        <div className="space-y-2">
          <p className="text-xs text-main-600 dark:text-main-400">
            Select a goal color to calibrate:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setSelectedColor('yellow')}
              className="w-full text-xs bg-yellow-500 hover:bg-yellow-400 dark:bg-yellow-500 dark:hover:bg-yellow-600"
            >
              Calibrate Yellow
            </Button>
            <Button
              onClick={() => setSelectedColor('blue')}
              className="w-full text-xs bg-blue-500 hover:bg-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Calibrate Blue
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 relative">
          <button
            onClick={() => setSelectedColor(null)}
            className="text-main-600 dark:text-main-400 hover:text-main-900 dark:hover:text-white font-bold text-sm absolute top-0 right-0"
          >
            ← Back
          </button>
          <ColorCalibrationWorkflow
            regions={regions[selectedColor]}
            onRegionAdded={handleRegionAdded}
            onRegionChanged={handleRegionChanged}
            onClear={handleClearRegions}
            onApply={handleWorkflowApply}
            onCancel={() => setSelectedColor(null)}
            title={`${selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)} Goal Calibration`}
            loading={loading}
            error={workflowError}
            camera={camera}
            onCameraChange={setCamera}
            onLoadCurrentCalibration={handleLoadCurrentCalibration}
          />
        </div>
      )}
    </div>
  );
};
