/**
 * Color Calibration Workflow Component
 * Combines region selection, range editing, and HSV preview
 */

'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CameraRegionDrawer } from '../camera-region-drawer';
import { HSVPicker } from '@/components/ui/HSV-picker';
import { DrawRegion, HSVRange } from '@/types/calibration';
import { Eye, EyeOff, Download, Upload } from 'lucide-react';
import { ManualMovementComponent, ModeComponent, SettingsComponent } from '../../dashboard/control-panel';

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

// Helper functions for CSV export/import
function regionsToCSV(regions: DrawRegion[]): string {
  if (regions.length === 0) return 'id,x,y,width,height,h_min,h_max,s_min,s_max,v_min,v_max';
  
  const headers = ['id', 'x', 'y', 'width', 'height', 'h_min', 'h_max', 's_min', 's_max', 'v_min', 'v_max'];
  const rows = regions.map((region) => {
    const hsv = region.hsv || { h_min: 0, h_max: 179, s_min: 0, s_max: 255, v_min: 0, v_max: 255 };
    return [
      `"${region.id}"`,
      region.x,
      region.y,
      region.width,
      region.height,
      hsv.h_min,
      hsv.h_max,
      hsv.s_min,
      hsv.s_max,
      hsv.v_min,
      hsv.v_max,
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

function csvToRegions(csv: string): DrawRegion[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  const regions: DrawRegion[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
    if (values.length < 5) continue;
    
    const region: DrawRegion = {
      id: values[0] || `imported-${Date.now()}-${i}`,
      x: parseInt(values[1]) || 0,
      y: parseInt(values[2]) || 0,
      width: parseInt(values[3]) || 0,
      height: parseInt(values[4]) || 0,
      hsv: {
        h_min: parseInt(values[5]) || 0,
        h_max: parseInt(values[6]) || 179,
        s_min: parseInt(values[7]) || 0,
        s_max: parseInt(values[8]) || 255,
        v_min: parseInt(values[9]) || 0,
        v_max: parseInt(values[10]) || 255,
      },
      canvas: { x: 0, y: 0, width: 0, height: 0 },
    };
    regions.push(region);
  }
  
  return regions;
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
  const [hoveredRegionIdx, setHoveredRegionIdx] = useState<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportCSV = () => {
    const csv = regionsToCSV(regions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calibration-regions-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const importedRegions = csvToRegions(csv);
      
      onClear();
      importedRegions.forEach(region => onRegionAdded(region));
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-main-900 dark:text-white">{title}</h3>

      {step === 'regions' ? (
        <div className="flex flex-col gap-2">
          <ModeComponent hideAutonomous />
          <SettingsComponent hideAutonomous hideTabBar />
          <ManualMovementComponent compact />

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
            <Button
              onClick={handleExportCSV}
              className="flex-1 text-xs"
              title="Export regions to CSV"
            >
              <Download size={14} className="mr-1" />
              Export
            </Button>
            <Button
              onClick={handleImportCSV}
              className="flex-1 text-xs"
              title="Import regions from CSV"
            >
              <Upload size={14} className="mr-1" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
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
              otherRegions={
                hoveredRegionIdx !== undefined && hoveredRegionIdx !== null
                  ? regions[hoveredRegionIdx]?.hsv
                    ? [regions[hoveredRegionIdx].hsv as HSVRange]
                    : []
                  : regions
                      .map((r) => r.hsv)
                      .filter((h, idx) => h !== undefined && !disabledRegionsStep2.includes(idx)) as HSVRange[]
              }
              otherRegionsLabels={
                hoveredRegionIdx !== undefined && hoveredRegionIdx !== null
                  ? [`${hoveredRegionIdx + 1}`]
                  : regions
                      .map((_, idx) => `${idx + 1}`)
                      .filter((_, idx) => !disabledRegionsStep2.includes(idx))
              }
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
                    onMouseEnter={() => setHoveredRegionIdx(idx)}
                    onMouseLeave={() => setHoveredRegionIdx(undefined)}
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
