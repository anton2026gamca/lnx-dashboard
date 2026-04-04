/**
 * Ball Color Calibration Modal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { robotClient } from '@/lib/robotAPIClient';
import { HSVPicker } from '../HSV-picker';
import { CameraRegionDrawer } from '../camera-region-drawer';
import { DrawRegion, HSVRange, ColorCalibration } from '@/types/calibration';

const USE_INTERACTIVE_METHOD = true;
const USE_MANUAL_METHOD = true;

interface BallColorCalibrationModalProps {
  onClose: () => void;
}

export const BallColorCalibrationModal: React.FC<BallColorCalibrationModalProps> = ({ onClose }) => {
  const [regions, setRegions] = useState<DrawRegion[]>([]);
  const [hsv, setHsv] = useState<Partial<HSVRange>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current values on mount
  useEffect(() => {
    const loadCurrentValues = async () => {
      try {
        const ballCal = await robotClient.getBallColorCalibration();
        if (ballCal?.lower && ballCal?.upper) {
          setHsv({
            h_min: ballCal.lower[0],
            h_max: ballCal.upper[0],
            s_min: ballCal.lower[1],
            s_max: ballCal.upper[1],
            v_min: ballCal.lower[2],
            v_max: ballCal.upper[2],
          });
        }
      } catch (err) {
        console.error('Failed to load current values:', err);
      }
    };

    loadCurrentValues();
  }, []);

  const handleRegionAdded = (region: DrawRegion) => {
    setRegions((prev) => [...prev, region]);

    const allRegions = [...regions, region];
    const merged = mergeHsvRegions(allRegions);
    setHsv(merged);
  };

  const handleRegionChanged = (index: number, updatedRegion: DrawRegion | null) => {
    setRegions((prev) =>
      prev.map((r, i) => (i === index ? (updatedRegion || r) : r))
    );
    
    const allRegions = regions.map((r) =>
      r.id === updatedRegion?.id ? updatedRegion : r
    );
    const merged = mergeHsvRegions(allRegions);
    setHsv(merged);
  }

  const handleClearRegions = () => {
    setRegions([]);
    setHsv({});
  };

  const mergeHsvRegions = (regionList: DrawRegion[]): Partial<HSVRange> => {
    if (regionList.length === 0) return {};

    const hsvValues = regionList
      .map((r) => r.hsv)
      .filter((h) => h !== undefined) as HSVRange[];

    if (hsvValues.length === 0) return {};

    return {
      h_min: Math.min(...hsvValues.map((h) => h.h_min)),
      h_max: Math.max(...hsvValues.map((h) => h.h_max)),
      s_min: Math.min(...hsvValues.map((h) => h.s_min)),
      s_max: Math.max(...hsvValues.map((h) => h.s_max)),
      v_min: Math.min(...hsvValues.map((h) => h.v_min)),
      v_max: Math.max(...hsvValues.map((h) => h.v_max)),
    };
  };

  const handleApply = async () => {
    try {
      setLoading(true);
      setError(null);

      if (
        hsv.h_min === undefined ||
        hsv.h_max === undefined ||
        hsv.s_min === undefined ||
        hsv.s_max === undefined ||
        hsv.v_min === undefined ||
        hsv.v_max === undefined
      ) {
        setError('Please set all HSV values');
        return;
      }

      await robotClient.setBallCalibration(
        [hsv.h_min, hsv.s_min, hsv.v_min] as [number, number, number],
        [hsv.h_max, hsv.s_max, hsv.v_max] as [number, number, number]
      );

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-main-900 dark:text-white">
        Orange Ball Color Calibration
      </h3>

      {USE_INTERACTIVE_METHOD && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-main-900 dark:text-white">
            Interactive Method: Draw Region
          </h4>
          <CameraRegionDrawer
            onRegionAdded={handleRegionAdded}
            onRegionChanged={handleRegionChanged}
            onClear={handleClearRegions}
            regions={regions}
          />
        </div>
      )}

      {USE_MANUAL_METHOD && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-main-900 dark:text-white">
            Manual Method: HSV Range
          </h4>
          <HSVPicker
            value={hsv}
            onChange={setHsv}
            label="Ball HSV Range"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-200 px-2 py-1 text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-1 pt-2 border-t border-main-300 dark:border-main-800">
        <Button
          onClick={handleApply}
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
  );
};
