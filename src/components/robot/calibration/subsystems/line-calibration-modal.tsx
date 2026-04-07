/**
 * Line Sensor Calibration Modal
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLineCalibration } from '@/hooks/useCalibration';
import { robotClient } from '@/lib/robotAPIClient';
import { ManualMovementComponent, ModeComponent, SettingsComponent } from '../../dashboard/control-panel';

interface LineCalibrationModalProps {
  onClose: () => void;
}

type Phase = 'phase1' | 'phase2' | 'manual' | null;

export const LineCalibrationModal: React.FC<LineCalibrationModalProps> = ({ onClose }) => {
  const { startPhase, stop, cancel, status } = useLineCalibration();
  const [currentPhase, setCurrentPhase] = useState<Phase>(null);
  const [thresholds, setThresholds] = useState<number[][]>([]);
  const [enabledSensors, setEnabledSensors] = useState<boolean[]>([]);
  const [manualData, setManualData] = useState<{
    current_thresholds?: number[][];
    phase1_min?: number[];
    phase1_max?: number[];
    phase2_min?: number[];
    phase2_max?: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenVisualization, setFullscreenVisualization] = useState(false);

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
        setCurrentPhase('phase2');
        await startPhase(2);
      } else {
        setCurrentPhase('manual');
        await loadManualAdjustmentData();
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
        const currentThresholds = status.current_thresholds || [];
        setThresholds(currentThresholds);
        setEnabledSensors(new Array(currentThresholds.length).fill(true));
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

      const finalThresholds = thresholds.map((threshold, idx) => {
        if (enabledSensors[idx]) {
          return threshold;
        } else {
          return [0, 1000];
        }
      });

      await robotClient.setLineThresholds(finalThresholds);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply thresholds');
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = () => {
    const rows: string[] = [];
    
    const headers = ['Sensor', 'Enabled', 'Min', 'Max', 'Phase 1 Min', 'Phase 1 Max'];
    if (manualData?.phase2_min) headers.push('Phase 2 Min');
    if (manualData?.phase2_max) headers.push('Phase 2 Max');
    rows.push(headers.join(','));
    
    (manualData?.current_thresholds || thresholds || []).forEach((threshold, idx) => {
      const row = [
        idx,
        enabledSensors[idx] ? 'Yes' : 'No',
        threshold[0],
        threshold[1],
        manualData?.phase1_min?.[idx] ?? '',
        manualData?.phase1_max?.[idx] ?? '',
      ];
      if (manualData?.phase2_min) row.push(manualData.phase2_min[idx] ?? '');
      if (manualData?.phase2_max) row.push(manualData.phase2_max[idx] ?? '');
      rows.push(row.join(','));
    });
    
    return rows.join('\n');
  };

  const handleExportCSV = () => {
    try {
      const csv = generateCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `line-calibration-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
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

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      if (lines.length < 2) {
        setError('CSV file must have headers and at least one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const sensorIdx = headers.indexOf('Sensor');
      const minIdx = headers.indexOf('Min');
      const maxIdx = headers.indexOf('Max');
      const enabledIdx = headers.indexOf('Enabled');

      if (sensorIdx === -1 || minIdx === -1 || maxIdx === -1) {
        setError('CSV must contain Sensor, Min, and Max columns');
        return;
      }

      const newThresholds: number[][] = [];
      const newEnabledSensors: boolean[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < Math.max(sensorIdx, minIdx, maxIdx) + 1) {
          continue;
        }

        const min = parseInt(values[minIdx]);
        const max = parseInt(values[maxIdx]);
        const enabled = enabledIdx !== -1 ? values[enabledIdx].toLowerCase() === 'yes' : true;

        if (!isNaN(min) && !isNaN(max)) {
          newThresholds.push([min, max]);
          newEnabledSensors.push(enabled);
        }
      }

      if (newThresholds.length === 0) {
        setError('No valid data rows found in CSV');
        return;
      }

      setThresholds(newThresholds);
      setEnabledSensors(newEnabledSensors);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <ModeComponent hideAutonomous />
        <SettingsComponent hideAutonomous hideTabBar />
        <ManualMovementComponent compact />
      </div>

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

          <div className="text-xs text-main-600 dark:text-main-400 mb-2">
            Disabled sensors will be sent as 0-1000 range to the API.
          </div>

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
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-main-900 dark:text-white">
              Manual Threshold Adjustment
            </h4>
            <Button
              onClick={() => setFullscreenVisualization(!fullscreenVisualization)}
              className="text-xs"
            >
              {fullscreenVisualization ? 'Show Table' : 'Full Visualization'}
            </Button>
          </div>

          {fullscreenVisualization ? (
            <div className="space-y-2">
              {thresholds.map((threshold, idx) => {
                const min = threshold[0];
                const max = threshold[1];
                const p1Min = manualData?.phase1_min?.[idx] ?? null;
                const p1Max = manualData?.phase1_max?.[idx] ?? null;
                const p2Min = manualData?.phase2_min?.[idx] ?? null;
                const p2Max = manualData?.phase2_max?.[idx] ?? null;
                
                const range = 1000;
                const p1MinPercent = p1Min !== null ? (p1Min / range) * 100 : 0;
                const p1MaxPercent = p1Max !== null ? (p1Max / range) * 100 : 0;
                const p2MinPercent = p2Min !== null ? (p2Min / range) * 100 : 0;
                const p2MaxPercent = p2Max !== null ? (p2Max / range) * 100 : 0;
                const minPercent = (min / range) * 100;
                const maxPercent = (max / range) * 100;
                
                return (
                  <div key={idx} className="space-y-1 flex items-center gap-2">
                    <div className="text-xs font-semibold text-main-900 dark:text-white min-w-5">{idx}</div>
                    <div className="relative flex-1 h-14 bg-main-100 dark:bg-main-800 border border-main-300 dark:border-main-600 rounded overflow-hidden">
                      {p1Min !== null && p1Max !== null && (
                        <div
                          className="absolute top-1 h-3 px-1 bg-blue-200 dark:bg-blue-900 opacity-50 border-l-2 border-r-2 border-blue-500 dark:border-blue-400 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-100"
                          style={{
                            left: `${p1MinPercent}%`,
                            right: `${100 - p1MaxPercent}%`,
                          }}
                          title={`Phase 1: ${p1Min}-${p1Max}`}
                        >
                          {p1MaxPercent - p1MinPercent > 7 && (
                            <>
                              <span>{p1Min}</span>
                              <span>{p1Max}</span>
                            </>
                          )}
                        </div>
                      )}
                      {p2Min !== null && p2Max !== null && (
                        <div
                          className="absolute top-5 h-3 px-1 bg-green-200 dark:bg-green-900 opacity-50 border-l-2 border-r-2 border-green-500 dark:border-green-400 flex items-center justify-between text-xs font-bold text-green-900 dark:text-green-100"
                          style={{
                            left: `${p2MinPercent}%`,
                            right: `${100 - p2MaxPercent}%`,
                          }}
                          title={`Phase 2: ${p2Min}-${p2Max}`}
                        >
                          {p2MaxPercent - p2MinPercent > 7 && (
                            <>
                              <span>{p2Min}</span>
                              <span>{p2Max}</span>
                            </>
                          )}
                        </div>
                      )}
                      <div
                        className="absolute top-9 h-3 px-1 bg-orange-300 dark:bg-orange-700 border-l-2 border-r-2 border-orange-600 dark:border-orange-500 flex items-center justify-between text-xs font-bold text-orange-900 dark:text-orange-100"
                        style={{
                          left: `${minPercent}%`,
                          right: `${100 - maxPercent}%`,
                        }}
                        title={`Current: ${min}-${max}`}
                      >
                        {maxPercent - minPercent > 7 && (
                          <>
                            <span>{min}</span>
                            <span>{max}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2 overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-main-300 dark:bg-main-800">
                  <th className="px-2 py-2 text-left border border-main-400 dark:border-main-700 w-0">Sensor</th>
                  <th className="px-2 py-2 border border-main-400 dark:border-main-700 w-0">Enabled</th>
                  <th className="px-2 py-2 border border-main-400 dark:border-main-700">Min</th>
                  <th className="px-2 py-2 border border-main-400 dark:border-main-700">Max</th>
                  <th className="px-2 py-2 border border-main-400 dark:border-main-700">Visualization</th>
                  <th className="px-2 py-2 border border-main-400 dark:border-main-700">Phase 1 Min</th>
                  <th className="px-2 py-2 border border-main-400 dark:border-main-700">Phase 1 Max</th>
                  {manualData?.phase2_min && <th className="px-2 py-2 border border-main-400 dark:border-main-700">Phase 2 Min</th>}
                  {manualData?.phase2_max && <th className="px-2 py-2 border border-main-400 dark:border-main-700">Phase 2 Max</th>}
                </tr>
              </thead>
              <tbody>
                {thresholds.map((threshold, idx) => (
                  <tr key={idx} className={`hover:bg-main-200 dark:hover:bg-main-700 ${
                    enabledSensors[idx]
                      ? 'bg-main-100 dark:bg-main-800'
                      : 'bg-main-50 dark:bg-main-900 opacity-60'
                  }`}>
                    <td className="px-2 py-2 border border-main-300 dark:border-main-700 font-semibold">{idx}</td>
                    <td className="px-2 py-2 border border-main-300 dark:border-main-700 text-center">
                      <input
                        type="checkbox"
                        checked={enabledSensors[idx]}
                        onChange={(e) => {
                          const newEnabled = [...enabledSensors];
                          newEnabled[idx] = e.target.checked;
                          setEnabledSensors(newEnabled);
                        }}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-2 border border-main-300 dark:border-main-700">
                      <input
                        type="number"
                        value={threshold[0]}
                        onChange={(e) => {
                          const newThresholds = [...thresholds];
                          newThresholds[idx] = [parseInt(e.target.value) || 0, threshold[1]];
                        }}
                        disabled={!enabledSensors[idx]}
                        className="w-16 p-1 w-full bg-main-50 dark:bg-main-900 border border-main-300 dark:border-main-600 rounded text-center disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-2 py-2 border border-main-300 dark:border-main-700">
                      <input
                        type="number"
                        value={threshold[1]}
                        onChange={(e) => {
                          const newThresholds = [...thresholds];
                          newThresholds[idx] = [threshold[0], parseInt(e.target.value) || 0];
                          setThresholds(newThresholds);
                        }}
                        disabled={!enabledSensors[idx]}
                        className="w-16 p-1 w-full bg-main-50 dark:bg-main-900 border border-main-300 dark:border-main-600 rounded text-center disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-2 py-2 border border-main-300 dark:border-main-700">
                      <div className="relative w-full h-8 bg-main-100 dark:bg-main-800 border border-main-300 dark:border-main-600 rounded overflow-hidden">
                        {(() => {
                          const min = threshold[0];
                          const max = threshold[1];
                          const p1Min = manualData?.phase1_min?.[idx] ?? null;
                          const p1Max = manualData?.phase1_max?.[idx] ?? null;
                          const p2Min = manualData?.phase2_min?.[idx] ?? null;
                          const p2Max = manualData?.phase2_max?.[idx] ?? null;
                          const range = 1000;
                          const p1MinPercent = p1Min !== null ? (p1Min / range) * 100 : 0;
                          const p1MaxPercent = p1Max !== null ? (p1Max / range) * 100 : 0;
                          const p2MinPercent = p2Min !== null ? (p2Min / range) * 100 : 0;
                          const p2MaxPercent = p2Max !== null ? (p2Max / range) * 100 : 0;
                          const minPercent = (min / range) * 100;
                          const maxPercent = (max / range) * 100;
                          
                          return (
                            <>
                              {p1Min !== null && p1Max !== null && (
                                <div
                                  className="absolute top-0 h-2 bg-blue-200 dark:bg-blue-900 opacity-40 border-l border-r border-blue-500 dark:border-blue-400"
                                  style={{
                                    left: `${p1MinPercent}%`,
                                    right: `${100 - p1MaxPercent}%`,
                                  }}
                                  title={`P1: ${p1Min}-${p1Max}`}
                                />
                              )}
                              {p2Min !== null && p2Max !== null && (
                                <div
                                  className="absolute top-3 h-2 bg-green-200 dark:bg-green-900 opacity-40 border-l border-r border-green-500 dark:border-green-400"
                                  style={{
                                    left: `${p2MinPercent}%`,
                                    right: `${100 - p2MaxPercent}%`,
                                  }}
                                  title={`P2: ${p2Min}-${p2Max}`}
                                />
                              )}
                              <div
                                className="absolute top-6 h-2 bg-orange-300 dark:bg-orange-700 border-l border-r border-orange-600 dark:border-orange-500"
                                style={{
                                  left: `${minPercent}%`,
                                  right: `${100 - maxPercent}%`,
                                }}
                                title={`Current: ${min}-${max}`}
                              />
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-2 border border-main-300 dark:border-main-700 text-center text-main-700 dark:text-main-300">{manualData?.phase1_min?.[idx] ?? '-'}</td>
                    <td className="px-2 py-2 border border-main-300 dark:border-main-700 text-center text-main-700 dark:text-main-300">{manualData?.phase1_max?.[idx] ?? '-'}</td>
                    {manualData?.phase2_min && <td className="px-2 py-2 border border-main-300 dark:border-main-700 text-center text-main-700 dark:text-main-300">{manualData.phase2_min[idx] ?? '-'}</td>}
                    {manualData?.phase2_max && <td className="px-2 py-2 border border-main-300 dark:border-main-700 text-center text-main-700 dark:text-main-300">{manualData.phase2_max[idx] ?? '-'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          <div className="flex gap-1">
            <Button
              onClick={handleApplyManual}
              disabled={loading}
              className="flex-1 text-xs"
            >
              {loading ? 'Applying...' : 'Apply & Close'}
            </Button>
            <Button
              onClick={handleExportCSV}
              className="flex-1 text-xs"
            >
              Export CSV
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              disabled={loading}
              className="hidden"
            />
            <Button
              disabled={loading}
              className="flex-1 text-xs cursor-pointer"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
            >
              Import CSV
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
