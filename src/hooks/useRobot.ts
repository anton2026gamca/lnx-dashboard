/**
 * Custom hooks for robot interactions
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { robotClient } from '@/lib/robotAPIClient';
import { useRobot } from '@/context/RobotContext';
import { SensorData, RobotMode, LogEntry, LogsBatch, PositionEstimate, MotorSettings, AutonomousSettings, GoalDetectionData, BluetoothState, BluetoothMessage, BluetoothPairableDevice } from '@/types/robot';

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
export const useVideoStream = (enabled: boolean, fps: number = 30, showDetections: boolean = true) => {
  const { connectionState } = useRobot();
  const [frame, setFrame] = useState<Uint8Array | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastActiveRobotId, setLastActiveRobotId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (connectionState.activeRobotId && lastActiveRobotId !== connectionState.activeRobotId) {
      setFrame(null);
      setLastActiveRobotId(connectionState.activeRobotId);
      return;
    }

    if (!connectionState.isConnected) {
      setIsStreaming(false);
      setFrame(null);
      setLastActiveRobotId(null);
      return;
    }

    try {
      if (!enabled) {
        setIsStreaming(false);
        return;
      }

      const unsubscribe = robotClient.subscribeVideo(
        (frameData: Uint8Array) => {
          setFrame(frameData);
        },
        fps,
        showDetections,
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
  }, [connectionState.isConnected, connectionState.activeRobotId, lastActiveRobotId, enabled, fps, showDetections, refreshKey]);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  }

  return { frame, isStreaming, refresh };
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
    return runAction(() => robotClient.bluetoothConnectOtherRobot(macAddress, activeRobotId));
  }, [activeRobotId, runAction]);

  const disconnectFromRobot = useCallback(async (macAddress?: string) => {
    if (!activeRobotId) return false;
    return runAction(() => robotClient.bluetoothDisconnectOtherRobot(macAddress, activeRobotId));
  }, [activeRobotId, runAction]);

  const pairDevice = useCallback(async (device: { mac_address: string; name: string; hostname?: string; ip_address?: string }) => {
    if (!activeRobotId) return false;
    return runAction(async () => (await robotClient.bluetoothPairDevice(device, activeRobotId)) !== null);
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

  const setDiscoverable = useCallback(async (durationSeconds?: number) => {
    if (!activeRobotId) return false;
    return runAction(() => robotClient.setBluetoothDiscoverable(durationSeconds, activeRobotId));
  }, [activeRobotId, runAction]);

  const setNotDiscoverable = useCallback(async () => {
    if (!activeRobotId) return false;
    return runAction(() => robotClient.setBluetoothNotDiscoverable(activeRobotId));
  }, [activeRobotId, runAction]);

  const sendMessage = useCallback(async (messageType: string, content: string, macAddress?: string) => {
    if (!activeRobotId) return false;
    return runAction(() => robotClient.bluetoothSendMessage(messageType, content, macAddress, activeRobotId));
  }, [activeRobotId, runAction]);

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
    setDiscoverable,
    setNotDiscoverable,
    sendMessage,
    getMessages,
  };
};

