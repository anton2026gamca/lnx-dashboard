/**
 * Custom hooks for robot interactions
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { robotClient } from '@/lib/robotAPIClient';
import type { VideoCamera } from '@/lib/robotAPIClient';
import { useRobot } from '@/context/RobotContext';
import { SensorData, RobotMode, LogEntry, LogsBatch, PositionEstimate, MotorSettings, AutonomousSettings, GoalDetectionData, BluetoothState, BluetoothMessage, BluetoothPairableDevice, ProfilingReport, ProfilingStatus } from '@/types/robot';

/**
 * Hook to fetch sensor data periodically
 */
export const useSensorData = (interval: number = 200) => {
  const { connectionState } = useRobot();
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastActiveRobotId, setLastActiveRobotId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await robotClient.getSensorData();
      setSensorData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sensor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connectionState.activeRobotId && lastActiveRobotId !== connectionState.activeRobotId) {
      setSensorData(null);
      setLastActiveRobotId(connectionState.activeRobotId);
      return;
    }

    if (!connectionState.isConnected) {
      if (sensorData !== null) {
        setSensorData(null);
      }
      setLastActiveRobotId(null);
      return;
    }

    fetchData();

    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [connectionState.isConnected, connectionState.activeRobotId, lastActiveRobotId, interval]);

  return { sensorData, loading, error };
};

export const useGoalDetection = (interval: number = 200) => {
  const { connectionState } = useRobot();
  const [goalDetection, setGoalDetection] = useState<GoalDetectionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastActiveRobotId, setLastActiveRobotId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await robotClient.getGoalDetection();
      setGoalDetection(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goal detection data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (connectionState.activeRobotId && lastActiveRobotId !== connectionState.activeRobotId) {
      setGoalDetection(null);
      setLastActiveRobotId(connectionState.activeRobotId);
      return;
    }

    if (!connectionState.isConnected) {
      if (goalDetection !== null) {
        setGoalDetection(null);
      }
      setLastActiveRobotId(null);
      return;
    }
    
    fetchData();

    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [connectionState.isConnected, connectionState.activeRobotId, lastActiveRobotId, interval]);
  
  return { goalDetection, loading, error, fetchData };
};

export const usePositionEstimate = (interval: number = 100) => {
  const { connectionState } = useRobot();
  const [position, setPosition] = useState<PositionEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastActiveRobotId, setLastActiveRobotId] = useState<string | null>(null);

  const fetchPosition = async () => {
    try {
      setLoading(true);
      const data = await robotClient.getPositionEstimate();
      setPosition(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch position estimate');
      setPosition(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (connectionState.activeRobotId && lastActiveRobotId !== connectionState.activeRobotId) {
      setPosition(null);
      setLastActiveRobotId(connectionState.activeRobotId);
      return;
    }

    if (!connectionState.isConnected) {
      setPosition(null);
      setLastActiveRobotId(null);
      return;
    }
    
    fetchPosition();
    
    const timer = setInterval(fetchPosition, interval);
    return () => clearInterval(timer);
  }, [connectionState.isConnected, connectionState.activeRobotId, lastActiveRobotId, interval]);
  
  return { position, loading, error };
};

/**
 * Hook to manage robot mode
 */
export const useRobotMode = () => {
  const { connectionState } = useRobot();
  const [mode, setMode] = useState<RobotMode>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMode = useCallback(async () => {
    try {
      const currentMode = await robotClient.getMode();
      if (currentMode === null) {
        return;
      }
      setMode(currentMode);
      // console.log('Fetched mode:', currentMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mode');
    }
  }, []);

  const changeMode = useCallback(
    async (newMode: RobotMode) => {
      if (!connectionState.isConnected) return;

      try {
        setLoading(true);
        setError(null);
        await robotClient.setMode(newMode);
        setMode(newMode);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to change mode');
      } finally {
        setLoading(false);
      }
    },
    [connectionState.isConnected],
  );

  useEffect(() => {
    if (!connectionState.isConnected) return;

    fetchMode();

    const unsubscribe = robotClient.subscribeModeChange((mode: RobotMode) => setMode(mode));
    return () => unsubscribe();
  }, [connectionState.isConnected, connectionState.activeRobotId, fetchMode]);

  return { mode, loading, error, changeMode, fetchMode };
};

/**
 * Hook to fetch target goal with real-time sync
 */
export const useTargetGoal = () => {
  const { connectionState } = useRobot();
  const [targetGoal, setTargetGoal] = useState<'yellow' | 'blue' | null>(null);

  const fetchTargetGoal = useCallback(async () => {
    if (!connectionState.isConnected) {
      setTargetGoal(null);
      return;
    }
    
    try {
      const goal = await robotClient.getGoalSettings();
      setTargetGoal(goal?.goal_color || null);
    }
    catch (err) {
      console.error('Failed to fetch target goal:', err);
      setTargetGoal(null);
    }
  }, [connectionState.isConnected]);

  useEffect(() => {
    if (!connectionState.isConnected) return;

    fetchTargetGoal();

    const unsubscribe = robotClient.subscribeGoalColorChange((goal: 'yellow' | 'blue') => setTargetGoal(goal));
    
    return () => unsubscribe();
  }, [connectionState.isConnected, connectionState.activeRobotId, fetchTargetGoal]);
  
  return { targetGoal, refresh: fetchTargetGoal };
};

/**
 * Hook for video streaming
 */
export const useVideoStream = (
  enabled: boolean,
  fps: number = 30,
  showDetections: boolean = true,
  camera: VideoCamera = 'front',
) => {
  const { connectionState } = useRobot();
  const [frontFrame, setFrontFrame] = useState<Uint8Array | null>(null);
  const [backFrame, setBackFrame] = useState<Uint8Array | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastActiveRobotId, setLastActiveRobotId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (connectionState.activeRobotId && lastActiveRobotId !== connectionState.activeRobotId) {
      setFrontFrame(null);
      setBackFrame(null);
      setLastActiveRobotId(connectionState.activeRobotId);
      return;
    }

    if (!connectionState.isConnected) {
      setIsStreaming(false);
      setFrontFrame(null);
      setBackFrame(null);
      setLastActiveRobotId(null);
      return;
    }

    try {
      if (!enabled) {
        setIsStreaming(false);
        return;
      }

      const unsubscribe = robotClient.subscribeVideo(
        (frameData: Uint8Array, sourceCamera: 'front' | 'back') => {
          if (sourceCamera === 'front') {
            setFrontFrame(frameData);
            if (camera === 'front') {
              setBackFrame(null);
            }
            return;
          }

          setBackFrame(frameData);
          if (camera === 'back') {
            setFrontFrame(null);
          }
        },
        fps,
        showDetections,
        camera,
      );

      setIsStreaming(true);

      return () => {
        unsubscribe();
        setIsStreaming(false);
      };
    } catch (err) {
      console.error('Failed to subscribe to video:', err);
      setIsStreaming(false);
    }
  }, [connectionState.isConnected, connectionState.activeRobotId, lastActiveRobotId, enabled, fps, showDetections, camera, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const frame = camera === 'back' ? backFrame : frontFrame;
  return { frame, frontFrame, backFrame, isStreaming, refresh };
};

/**
 * Hook to convert frame buffer to data URL for image display
 * Uses base64 encoding to create persistent URLs that won't be revoked
 */
export const useFrameDataUrl = (frame: Uint8Array | null) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!frame) {
      setDataUrl('');
      return;
    }

    try {
      const binary = String.fromCharCode.apply(null, Array.from(frame));
      const base64 = btoa(binary);
      const persistentUrl = `data:image/jpeg;base64,${base64}`;
      setDataUrl(persistentUrl);
    } catch (err) {
      console.error('Failed to convert frame to data URL:', err);
    }
  }, [frame]);

  return dataUrl;
};

/**
 * Hook for manual control
 */
export const useManualControl = () => {
  const { connectionState } = useRobot();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendControl = useCallback(
    async (moveAngle: number, moveSpeed: number, rotate: number) => {
      if (!connectionState.isConnected) return;

      try {
        setIsLoading(true);
        setError(null);
        await robotClient.setManualControl(moveAngle, moveSpeed, rotate);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send control');
      } finally {
        setIsLoading(false);
      }
    },
    [connectionState.isConnected],
  );

  return { sendControl, isLoading, error };
};

/**
  * Hook to fetch logs with real-time updates
  */
export const useLogs = () => {
  const { connectionState } = useRobot();
  const [logsByRobotId, setLogsByRobotId] = useState<Record<string, LogEntry[]>>({});
    
  const fetchLogs = async () => {
    try {
      const logBatch = await robotClient.getLogs();
      if (logBatch) {
        return logBatch?.logs || [];
      }
    }
    catch (err) {
      console.error('Failed to fetch logs:', err);
      return [];
    }
  }

  useEffect(() => {
    if (!connectionState.isConnected || !connectionState.activeRobotId) {
      return;
    }
    
    const unsubscribe = robotClient.subscribeNewLogs((data: LogsBatch) => {
      setLogsByRobotId(prev => {
        const robotId = connectionState.activeRobotId!;
        const currentLogs = prev[robotId] || [];
        return {
          ...prev,
          [robotId]: [...currentLogs, ...(data.logs || [])]
        };
      });
    });
    
    return () => {
      unsubscribe();
    }
  }, [connectionState.isConnected, connectionState.activeRobotId]);

  const logs = connectionState.activeRobotId ? logsByRobotId[connectionState.activeRobotId] || [] : [];

  const setLogs = (newLogs: LogEntry[]) => {
    if (connectionState.activeRobotId) {
      setLogsByRobotId(prev => ({
        ...prev,
        [connectionState.activeRobotId!]: newLogs
      }));
    }
  };

  return { logs, setLogs, fetchLogs };
}

export const useProfiling = () => {
  const { connectionState } = useRobot();
  const [statusByRobotId, setStatusByRobotId] = useState<Record<string, ProfilingStatus | null>>({});
  const [reportByRobotId, setReportByRobotId] = useState<Record<string, ProfilingReport | null>>({});
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRobotId = connectionState.activeRobotId || undefined;
  const status = activeRobotId ? statusByRobotId[activeRobotId] || null : null;
  const report = activeRobotId ? reportByRobotId[activeRobotId] || null : null;

  const setStatus = useCallback((robotId: string, nextStatus: ProfilingStatus | null) => {
    setStatusByRobotId(prev => ({ ...prev, [robotId]: nextStatus }));
  }, []);

  const setReport = useCallback((robotId: string, nextReport: ProfilingReport | null) => {
    setReportByRobotId(prev => ({ ...prev, [robotId]: nextReport }));
  }, []);

  const mergeTimelineEvents = useCallback((previousItems: Record<string, unknown>[], nextItems: Record<string, unknown>[]) => {
    const merged: Record<string, unknown>[] = [];
    const seen = new Set<string>();
    [...previousItems, ...nextItems].forEach((item) => {
      const key = JSON.stringify(item);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });
    return merged;
  }, []);

  const mergeReportWithPrevious = useCallback((previousReport: ProfilingReport | null, nextReport: ProfilingReport) => {
    if (!previousReport) {
      return nextReport;
    }
    return {
      metadata: nextReport.metadata,
      processes: {
        ...previousReport.processes,
        ...nextReport.processes,
      },
      functions: {
        by_name: {
          ...previousReport.functions.by_name,
          ...nextReport.functions.by_name,
        },
        sorted_by_total_time: nextReport.functions.sorted_by_total_time.length > 0
          ? nextReport.functions.sorted_by_total_time
          : previousReport.functions.sorted_by_total_time,
      },
      locks: {
        by_name: {
          ...previousReport.locks.by_name,
          ...nextReport.locks.by_name,
        },
        sorted_by_contention: nextReport.locks.sorted_by_contention.length > 0
          ? nextReport.locks.sorted_by_contention
          : previousReport.locks.sorted_by_contention,
      },
      timeline: {
        processes: mergeTimelineEvents(previousReport.timeline.processes, nextReport.timeline.processes),
        functions: mergeTimelineEvents(previousReport.timeline.functions, nextReport.timeline.functions),
        locks: mergeTimelineEvents(previousReport.timeline.locks, nextReport.timeline.locks),
      },
    };
  }, [mergeTimelineEvents]);

  const fetchStatus = useCallback(async () => {
    if (!connectionState.isConnected || !activeRobotId) {
      return null;
    }

    try {
      setLoading(true);
      const nextStatus = await robotClient.getProfilingStatus(activeRobotId);
      setStatus(activeRobotId, nextStatus);
      setError(null);
      return nextStatus;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profiling status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeRobotId, connectionState.isConnected, setStatus]);

  const fetchReport = useCallback(async (includeStackTraces: boolean = false) => {
    if (!connectionState.isConnected || !activeRobotId) {
      return null;
    }

    try {
      setLoading(true);
      const nextReport = await robotClient.getProfilingReport(includeStackTraces, activeRobotId);
      if (nextReport) {
        setReportByRobotId((previous) => {
          const previousReport = previous[activeRobotId] || null;
          return {
            ...previous,
            [activeRobotId]: mergeReportWithPrevious(previousReport, nextReport),
          };
        });
      }
      setError(null);
      return nextReport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profiling report');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeRobotId, connectionState.isConnected, mergeReportWithPrevious]);

  const runControl = useCallback(async (action: () => Promise<void>) => {
    try {
      setWorking(true);
      setError(null);
      await action();
      await fetchStatus();
      await fetchReport(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profiling operation failed');
      return false;
    } finally {
      setWorking(false);
    }
  }, [fetchReport, fetchStatus]);

  const startProfiling = useCallback(async () => {
    if (!activeRobotId) {
      return false;
    }
    setReport(activeRobotId, null);
    return runControl(async () => {
      await robotClient.profilingStart(activeRobotId);
    });
  }, [activeRobotId, runControl, setReport]);

  const stopProfiling = useCallback(async () => {
    if (!activeRobotId) {
      return false;
    }
    return runControl(async () => {
      await robotClient.profilingStop(activeRobotId);
    });
  }, [activeRobotId, runControl, setReport]);

  const clearProfiling = useCallback(async () => {
    if (!activeRobotId) {
      return false;
    }
    setReport(activeRobotId, null);
    return runControl(async () => {
      await robotClient.profilingClear(activeRobotId);
    });
  }, [activeRobotId, runControl]);

  useEffect(() => {
    if (!connectionState.isConnected || !activeRobotId) {
      return;
    }

    void fetchStatus();
    void fetchReport(false);
  }, [activeRobotId, connectionState.isConnected, fetchReport, fetchStatus]);

  return {
    status,
    report,
    loading,
    working,
    error,
    fetchStatus,
    fetchReport,
    startProfiling,
    stopProfiling,
    clearProfiling,
  };
};

/**
  * Hook to manage motor settings
  */
export const useMotorSettings = (interval = 1000) => {
  const { connectionState } = useRobot();
  const [settings, setSettings] = useState<MotorSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connectionState.isConnected) {
      setSettings({});
      return;
    }

    fetchSettings();

    const timer = setInterval(fetchSettings, interval);
    return () => clearInterval(timer);
  }, [connectionState.isConnected, connectionState.activeRobotId, interval]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await robotClient.getMotorSettings();
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof MotorSettings, value: boolean) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      await robotClient.setMotorSettings({[key]: value});
    } catch (err) {
      await fetchSettings();
      setError(err instanceof Error ? 'Failed to update setting: ' + err.message : 'Failed to update setting');
    }
  };

  return { settings, loading, error, updateSetting, fetchSettings };
};

/**
  * Hook to manage autonomous settings
  */
export const useAutonomousSettings = () => {
  const { connectionState } = useRobot();
  const [settings, setSettings] = useState<AutonomousSettings>({});
  const [stateMachines, setStateMachines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connectionState.isConnected) {
      setSettings({});
      setStateMachines([]);
      return;
    }

    fetchSettings();
  }, [connectionState.isConnected, connectionState.activeRobotId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [autonomousData, stateMachinesData] = await Promise.all([
        robotClient.getAutonomousSettings(),
        robotClient.getAllStateMachines(),
      ]);

      if (autonomousData) {
        setSettings(autonomousData);
      }
      
      if (stateMachinesData) {
        setStateMachines(stateMachinesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof AutonomousSettings, value: unknown) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      await robotClient.setAutonomousSettings({[key]: value});
    } catch (err) {
      await fetchSettings();
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    }
  };

  return { settings, stateMachines, loading, error, updateSetting };
};

export const useBluetooth = (interval: number = 3000) => {
  const { connectionState } = useRobot();
  const [state, setState] = useState<BluetoothState | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRobotId = connectionState.activeRobotId || undefined;
  const activeRobotIdRef = useRef<string | undefined>(activeRobotId);
  const lastActiveRobotIdRef = useRef<string | undefined>(activeRobotId);

  useEffect(() => {
    activeRobotIdRef.current = activeRobotId;
  }, [activeRobotId]);

  const fetchState = useCallback(async (silent: boolean = false) => {
    const requestRobotId = activeRobotId;
    if (!connectionState.isConnected || !requestRobotId) {
      setState(null);
      return null;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      const data = await robotClient.getBluetoothState(requestRobotId);
      if (activeRobotIdRef.current !== requestRobotId) {
        return null;
      }
      setState(data);
      if (!silent) {
        setError(null);
      }
      return data;
    } catch (err) {
      if (activeRobotIdRef.current !== requestRobotId) {
        return null;
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch Bluetooth state');
      return null;
    } finally {
      if (!silent && activeRobotIdRef.current === requestRobotId) {
        setLoading(false);
      }
    }
  }, [connectionState.isConnected, activeRobotId]);

  useEffect(() => {
    if (lastActiveRobotIdRef.current !== activeRobotId) {
      setState(null);
      setError(null);
      setLoading(false);
      setWorking(false);
      lastActiveRobotIdRef.current = activeRobotId;
    }

    if (!connectionState.isConnected || !activeRobotId) {
      setState(null);
      return;
    }

    fetchState(true);
    const timer = setInterval(() => {
      void fetchState(true);
    }, interval);
    return () => clearInterval(timer);
  }, [connectionState.isConnected, activeRobotId, interval, fetchState]);

  const runAction = useCallback(async (action: () => Promise<boolean | null>) => {
    try {
      setWorking(true);
      setError(null);
      const ok = await action();
      await fetchState(true);
      return ok === true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bluetooth operation failed');
      return false;
    } finally {
      setWorking(false);
    }
  }, [fetchState]);

  const runTask = useCallback(async <T,>(task: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      setWorking(true);
      setError(null);
      return await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bluetooth operation failed');
      return fallback;
    } finally {
      setWorking(false);
    }
  }, []);

  const setOtherRobot = useCallback(async (otherRobot: { mac_address: string; name?: string; hostname?: string; ip_address?: string; note?: string }) => {
    if (!activeRobotId) return false;
    return runAction(async () => (await robotClient.setOtherRobot(otherRobot, activeRobotId)) !== null);
  }, [activeRobotId, runAction]);

  const clearOtherRobot = useCallback(async () => {
    if (!activeRobotId) return false;
    return runAction(async () => (await robotClient.setOtherRobot({ clear: true }, activeRobotId)) !== null);
  }, [activeRobotId, runAction]);

  const connectToRobot = useCallback(async (macAddress?: string) => {
    if (!activeRobotId) return false;
    const result = await robotClient.bluetoothConnectOtherRobot(macAddress, activeRobotId);
    const success = result?.result?.success === true || result?.status === 'ok';
    
    // Run fetchState as an action if successful
    if (success) {
      try {
        setWorking(true);
        await fetchState(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to robot');
        return false;
      } finally {
        setWorking(false);
      }
    }
    return false;
  }, [activeRobotId, fetchState]);

  const disconnectFromRobot = useCallback(async (macAddress?: string) => {
    if (!activeRobotId) return false;
    const result = await robotClient.bluetoothDisconnectOtherRobot(macAddress, activeRobotId);
    const success = result?.result?.success === true || result?.status === 'ok';
    
    // Run fetchState as an action if successful
    if (success) {
      try {
        setWorking(true);
        await fetchState(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to disconnect from robot');
        return false;
      } finally {
        setWorking(false);
      }
    }
    return false;
  }, [activeRobotId, fetchState]);

  const pairDevice = useCallback(async (macAddress: string) => {
    if (!activeRobotId) return false;
    return runAction(async () => (await robotClient.bluetoothPairDevice(macAddress, activeRobotId)) !== null);
  }, [activeRobotId, runAction]);

  const unpairDevice = useCallback(async (macAddress: string) => {
    if (!activeRobotId) return false;
    return runAction(async () => (await robotClient.bluetoothUnpairDevice(macAddress, activeRobotId)) !== null);
  }, [activeRobotId, runAction]);

  const listPairableDevices = useCallback(async (timeoutSeconds?: number): Promise<BluetoothPairableDevice[]> => {
    if (!activeRobotId) return [];
    return runTask(
      () => robotClient.bluetoothListPairableDevices(
        typeof timeoutSeconds === 'number' ? { timeout_seconds: timeoutSeconds } : {},
        activeRobotId,
      ),
      [],
    );
  }, [activeRobotId, runTask]);

  const setBluetoothPairingMode = useCallback(async (enabled: boolean) => {
    if (!activeRobotId) return false;
    const result = await robotClient.setBluetoothPairingMode(enabled, activeRobotId);
    const success = result?.pairing_mode_enabled === enabled;
    
    // Run fetchState as an action if successful
    if (success) {
      try {
        setWorking(true);
        await fetchState(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set pairing mode');
        return false;
      } finally {
        setWorking(false);
      }
    }
    return false;
  }, [activeRobotId, fetchState]);

  const sendMessage = useCallback(async (messageType: string, content: string, macAddress?: string) => {
    if (!activeRobotId) return false;
    const result = await robotClient.bluetoothSendMessage(messageType, content, macAddress, activeRobotId);
    const success = result?.result?.success === true || result?.status === 'ok';
    
    // Run fetchState as an action if successful
    if (success) {
      try {
        setWorking(true);
        await fetchState(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        return false;
      } finally {
        setWorking(false);
      }
    }
    return false;
  }, [activeRobotId, fetchState]);

  const getMessages = useCallback(async (options: { clear?: boolean; limit?: number } = {}): Promise<{ received: BluetoothMessage[]; sent: BluetoothMessage[] }> => {
    if (!activeRobotId) {
      return { received: [], sent: [] };
    }
    return runTask(async () => {
      const messages = await robotClient.getBluetoothMessages(options, activeRobotId);
      return messages ?? { received: [], sent: [] };
    }, { received: [], sent: [] });
  }, [activeRobotId, runTask]);

  return {
    state,
    loading,
    working,
    error,
    refresh: fetchState,
    setOtherRobot,
    clearOtherRobot,
    connectToRobot,
    disconnectFromRobot,
    pairDevice,
    unpairDevice,
    listPairableDevices,
    setBluetoothPairingMode,
    sendMessage,
    getMessages,
  };
};
