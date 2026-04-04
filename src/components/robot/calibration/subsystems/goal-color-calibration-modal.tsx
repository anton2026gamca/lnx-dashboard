/**
 * Goal Color Calibration Modal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { robotClient } from '@/lib/robotAPIClient';
import { HSVPicker } from '../HSV-picker';
import { CameraRegionDrawer } from '../camera-region-drawer';
import { DrawRegion, HSVRange, ColorCalibration } from '@/types/calibration';

// Enable/disable different methods
const USE_INTERACTIVE_METHOD = true;
const USE_MANUAL_METHOD = true;

interface GoalColorCalibrationModalProps {
  onClose: () => void;
}

export const GoalColorCalibrationModal: React.FC<GoalColorCalibrationModalProps> = ({ onClose }) => {
  const [selectedColor, setSelectedColor] = useState<'yellow' | 'blue' | null>(null);
  const [regions, setRegions] = useState<{ yellow: DrawRegion[]; blue: DrawRegion[] }>({
    yellow: [],
    blue: [],
  });
  const [hsv, setHsv] = useState<{
    yellow: Partial<HSVRange>;
    blue: Partial<HSVRange>;
  }>({
    yellow: {},
    blue: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentValues = async () => {
      try {
        const goalSettings = await robotClient.getGoalSettings();
        if (goalSettings?.calibration) {
          const cal = goalSettings.calibration;
          if (cal.yellow?.lower && cal.yellow?.upper) {
            setHsv((prev) => ({
              ...prev,
              yellow: {
                h_min: cal.yellow!.lower![0],
                h_max: cal.yellow!.upper![0],
                s_min: cal.yellow!.lower![1],
                s_max: cal.yellow!.upper![1],
                v_min: cal.yellow!.lower![2],
                v_max: cal.yellow!.upper![2],
              },
            }));
          }
          if (cal.blue?.lower && cal.blue?.upper) {
            setHsv((prev) => ({
              ...prev,
              blue: {
                h_min: cal.blue!.lower![0],
                h_max: cal.blue!.upper![0],
                s_min: cal.blue!.lower![1],
                s_max: cal.blue!.upper![1],
                v_min: cal.blue!.lower![2],
                v_max: cal.blue!.upper![2],
              },
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load current values:', err);
      }
    };

    loadCurrentValues();
  }, []);

  const handleRegionAdded = (region: DrawRegion) => {
    if (!selectedColor) return;

    setRegions((prev) => ({
      ...prev,
      [selectedColor]: [...prev[selectedColor], region],
    }));

    const allRegions = [...regions[selectedColor], region];
    const merged = mergeHsvRegions(allRegions);
    setHsv((prev) => ({
      ...prev,
      [selectedColor]: merged,
    }));
  };

  const handleRegionChanged = (index: number, newRegion: DrawRegion) => {
    if (!selectedColor) return;
    
    setRegions((prev) => {
      const updatedRegions = [...prev[selectedColor]];
      updatedRegions[index] = newRegion;
      return {
        ...prev,
        [selectedColor]: updatedRegions,
      };
    });
    
    const allRegions = [...regions[selectedColor].slice(0, index), newRegion, ...regions[selectedColor].slice(index + 1)];
    const merged = mergeHsvRegions(allRegions);
    setHsv((prev) => ({
      ...prev,
      [selectedColor]: merged,
    }));
  }

  const handleClearRegions = () => {
    if (!selectedColor) return;

    setRegions((prev) => ({
      ...prev,
      [selectedColor]: [],
    }));

    setHsv((prev) => ({
      ...prev,
      [selectedColor]: {},
    }));
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

      const yellowCal: ColorCalibration | null =
        hsv.yellow.h_min !== undefined && hsv.yellow.h_max !== undefined
          ? {
              lower: [
                hsv.yellow.h_min,
                hsv.yellow.s_min ?? 0,
                hsv.yellow.v_min ?? 0,
              ] as [number, number, number],
              upper: [
                hsv.yellow.h_max,
                hsv.yellow.s_max ?? 255,
                hsv.yellow.v_max ?? 255,
              ] as [number, number, number],
            }
          : null;

      const blueCal: ColorCalibration | null =
        hsv.blue.h_min !== undefined && hsv.blue.h_max !== undefined
          ? {
              lower: [
                hsv.blue.h_min,
                hsv.blue.s_min ?? 0,
                hsv.blue.v_min ?? 0,
              ] as [number, number, number],
              upper: [
                hsv.blue.h_max,
                hsv.blue.s_max ?? 255,
                hsv.blue.v_max ?? 255,
              ] as [number, number, number],
            }
          : null;

      await robotClient.setGoalSettings({
        calibration: {
          yellow: yellowCal || undefined,
          blue: blueCal || undefined,
        },
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply settings');
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
              className="w-full text-xs"
            >
              Calibrate Yellow
            </Button>
            <Button
              onClick={() => setSelectedColor('blue')}
              className="w-full text-xs"
            >
              Calibrate Blue
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-main-900 dark:text-white capitalize">
              {selectedColor} Goal Calibration
            </h3>
            <button
              onClick={() => setSelectedColor(null)}
              className="text-main-600 dark:text-main-400 hover:text-main-900 dark:hover:text-white font-bold"
            >
              ← Back
            </button>
          </div>

          {USE_INTERACTIVE_METHOD && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400">
                1. Interactive Method: Draw Region
              </h4>
              <CameraRegionDrawer
                onRegionAdded={handleRegionAdded}
                onRegionChanged={handleRegionChanged}
                onClear={handleClearRegions}
                regions={regions[selectedColor]}
              />
            </div>
          )}

          {USE_MANUAL_METHOD && (
            <div className="space-y-2 border-t pt-2 border-main-300 dark:border-main-700">
              <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400">
                2. Manual Method: HSV Range
              </h4>
              <HSVPicker
                value={hsv[selectedColor]}
                onChange={(value) => {
                  setHsv((prev) => ({
                    ...prev,
                    [selectedColor!]: value,
                  }));
                }}
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
      )}
    </div>
  );
};
