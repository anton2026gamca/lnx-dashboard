/**
 * Ball Color Calibration Modal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { robotClient } from '@/lib/robotAPIClient';
import { ColorCalibrationWorkflow } from './color-calibration-workflow';
import { DrawRegion } from '@/types/calibration';

interface BallColorCalibrationModalProps {
  onClose: () => void;
}

export const BallColorCalibrationModal: React.FC<BallColorCalibrationModalProps> = ({ onClose }) => {
  const [regions, setRegions] = useState<DrawRegion[]>([]);
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

      await robotClient.setBallCalibration(ranges);

      setRegions([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply settings');
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
    />
  );
};
