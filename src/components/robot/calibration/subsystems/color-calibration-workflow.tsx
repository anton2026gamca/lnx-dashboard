/**
 * Color Calibration Workflow Component
 * Combines region selection, range editing, and HSV preview
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CameraRegionDrawer } from '../camera-region-drawer';
import { HSVPicker } from '@/components/ui/HSV-picker';
import { DrawRegion, HSVRange } from '@/types/calibration';
import { Eye, EyeOff } from 'lucide-react';

interface ColorCalibrationWorkflowProps {
  regions: DrawRegion[];
  onRegionAdded: (region: DrawRegion) => void;
  onRegionChanged: (index: number, region: DrawRegion | null) => void;
  onClear: () => void;
  onApply: () => Promise<void>;
  onCancel: () => void;
  title: string;
  loading?: boolean;
  error?: string | null;
}

export const ColorCalibrationWorkflow: React.FC<ColorCalibrationWorkflowProps> = ({
  regions,
  onRegionAdded,
  onRegionChanged,
  onClear,
  onApply,
  onCancel,
  title,
  loading = false,
  error = null,
}) => {
  const [step, setStep] = useState<'regions' | 'preview'>('regions');
  const [disabledRegionsStep2, setDisabledRegionsStep2] = useState<Array<number>>([]);

  const handleRegionAdded = (region: DrawRegion) => {
    onRegionAdded(region);
  };

  const handleRegionChanged = (index: number, newRegion: DrawRegion | null) => {
    console.log('Region changed:', { index, newRegion });
    onRegionChanged(index, newRegion);
  };

  const handleClear = () => {
    onClear();
  };

  const handleAddManualRegion = () => {
    const manualRegion: DrawRegion = {
      id: `manual-${Date.now()}`,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hsv: {
        h_min: 0,
        h_max: 179,
        s_min: 0,
        s_max: 255,
        v_min: 0,
        v_max: 255,
      },
      canvas: { x: 0, y: 0, width: 0, height: 0 },
    };
    onRegionAdded(manualRegion);
  };

  const handleApplyPreview = async () => {
    await onApply();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-main-900 dark:text-white">{title}</h3>

      {step === 'regions' ? (
        <div className="flex flex-col gap-2">
          <CameraRegionDrawer
            onRegionAdded={handleRegionAdded}
            onRegionChanged={handleRegionChanged}
            onClear={handleClear}
            regions={regions}
          />

          <div className="flex gap-1">
            <Button
              onClick={handleAddManualRegion}
              className="flex-1 text-xs"
            >
              + Add Manual Region
            </Button>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-200 px-2 py-1 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-1 pt-2 border-t border-main-300 dark:border-main-800">
            <Button
              onClick={() => setStep('preview')}
              disabled={regions.length === 0}
              className="flex-1 text-xs"
            >
              Next: Preview
            </Button>
            <Button onClick={onCancel} className="flex-1 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2 rounded">
            <HSVPicker
              label="HSV Ranges"
              otherRegions={regions.map((r) => r.hsv).filter((h, idx) => h !== undefined && !disabledRegionsStep2.includes(idx)) as HSVRange[]}
              showOnlyOtherRegions
            />
          </div>

          <div className="bg-main-100 dark:bg-main-950 border border-main-300 dark:border-main-800 p-2 rounded text-xs">
            <p className="font-bold text-main-700 dark:text-main-300 mb-1">
              Regions: ({regions.length - disabledRegionsStep2.length} / {regions.length})
            </p>
            <div className="text-main-600 dark:text-main-400">
              {regions.map((r, idx) => {
                const enabled = !disabledRegionsStep2.includes(idx);
                const toggle = () => {
                  if (enabled) {
                    setDisabledRegionsStep2((prev) => [...prev, idx]);
                  } else {
                    setDisabledRegionsStep2((prev) => prev.filter(i => i !== idx));
                  }
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={toggle}
                    className="focus:outline-none flex items-center gap-2 w-full hover:bg-main-200 dark:hover:bg-main-800 p-0.5 cursor-pointer"
                  >
                    {enabled ? (
                      <Eye size={14} className="text-white" />
                    ) : (
                      <EyeOff size={14} />
                    )}
                    <span className={enabled ? 'text-white' : ''}>Region {idx + 1}{r.id.includes('manual-') ? '' : `: ${r.width} * ${r.height} px`}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-200 px-2 py-1 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-1 pt-2 border-t border-main-300 dark:border-main-800">
            <Button
              onClick={() => setStep('regions')}
              className="flex-1 text-xs"
            >
              ← Back
            </Button>
            <Button
              onClick={handleApplyPreview}
              disabled={loading}
              className="flex-1 text-xs"
            >
              {loading ? 'Applying...' : 'Apply & Close'}
            </Button>
            <Button onClick={onCancel} className="flex-1 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
