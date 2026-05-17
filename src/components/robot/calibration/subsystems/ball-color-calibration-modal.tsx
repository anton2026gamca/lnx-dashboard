/**
 * Ball Color Calibration Modal
 */

'use client';

import React, { useState } from 'react';
import { robotClient } from '@/lib/robotAPIClient';
import { ColorCalibrationWorkflow } from './color-calibration-workflow';
import { DrawRegion } from '@/types/calibration';
import type { VideoCamera } from '@/lib/robotAPIClient';

interface BallColorCalibrationModalProps {
  onClose: () => void;
}

export const BallColorCalibrationModal: React.FC<BallColorCalibrationModalProps> = ({ onClose }) => {
  const [regions, setRegions] = useState<DrawRegion[]>([]);
  const [camera, setCamera] = useState<VideoCamera>('front');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegionAdded = (region: DrawRegion) => {
    setRegions((prev) => [...prev, region]);
  };

  const handleRegionChanged = (index: number, updatedRegion: DrawRegion | null) => {
    setRegions((prev) => {
      const updated = [...prev];
      if (updatedRegion === null) {
        updated.splice(index, 1);
      } else {
        updated[index] = updatedRegion;
      }
      return updated;
    });
  };

  const handleClearRegions = () => {
    setRegions([]);
  };

  const handleWorkflowApply = async () => {
    try {
      setError(null);
      setLoading(true);

      const ranges = regions.map((r) => ({
        lower: [r.hsv?.h_min, r.hsv?.s_min, r.hsv?.v_min] as [number, number, number],
        upper: [r.hsv?.h_max, r.hsv?.s_max, r.hsv?.v_max] as [number, number, number],
      }));

      await robotClient.setBallCalibration(ranges, undefined, camera);

      setRegions([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCurrentCalibration = async () => {
    try {
      setError(null);
      setLoading(true);

      const calibration = await robotClient.getBallColorCalibration(camera);
      if (!calibration) {
        setRegions([]);
        return;
      }

      const ranges =
        calibration.camera === 'both'
          ? [...(calibration.front?.ranges ?? []), ...(calibration.back?.ranges ?? [])]
          : calibration.ranges;

      const uniqueRanges = Array.from(new Map(
        ranges.map((range) => [JSON.stringify(range), range]),
      ).values());

      setRegions(uniqueRanges.map((range, index) => ({
        id: `current-${camera}-${index}`,
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
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load current calibration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ColorCalibrationWorkflow
      regions={regions}
      onRegionAdded={handleRegionAdded}
      onRegionChanged={handleRegionChanged}
      onClear={handleClearRegions}
      onApply={handleWorkflowApply}
      onCancel={onClose}
      title="Orange Ball Color Calibration"
      loading={loading}
      error={error}
      camera={camera}
      onCameraChange={setCamera}
      onLoadCurrentCalibration={handleLoadCurrentCalibration}
    />
  );
};
