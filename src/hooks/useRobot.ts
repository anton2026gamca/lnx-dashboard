/**
 * Custom hooks for robot interactions
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { robotClient } from '@/lib/robotAPIClient';
import { useRobot } from '@/context/RobotContext';
import { SensorData, RobotMode, LogEntry, LogsBatch, PositionEstimate, MotorSettings, AutonomousSettings, GoalDetectionData } from '@/types/robot';

/**
 * Hook to fetch sensor data periodically
 */
export const useSensorData = (interval: number = 200) => {
  const { connectionState } = useRobot();
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!connectionState.isConnected) {
      if (sensorData !== null) {
        setSensorData(null);
      }
      return;
    }

    fetchData();

    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [connectionState.isConnected, interval]);

  return { sensorData, loading, error };
};

export const useGoalDetection = (interval: number = 200) => {
  const { connectionState } = useRobot();
  const [goalDetection, setGoalDetection] = useState<GoalDetectionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!connectionState.isConnected) {
      if (goalDetection !== null) {
        setGoalDetection(null);
      }
      return;
    }
    
    fetchData();

    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [connectionState.isConnected, interval]);
  
  return { goalDetection, loading, error, fetchData };
};

export const usePositionEstimate = (interval: number = 100) => {
  const { connectionState } = useRobot();
  const [position, setPosition] = useState<PositionEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!connectionState.isConnected) {
      setPosition(null);
      return;
    }
    
    fetchPosition();
    
    const timer = setInterval(fetchPosition, interval);
    return () => clearInterval(timer);
  }, [connectionState.isConnected, interval]);
  
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
  }, [connectionState.isConnected]);

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
  }, [connectionState.isConnected, fetchMode]);

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
  }, [connectionState.isConnected, fetchTargetGoal]);
  
  return { targetGoal, refresh: fetchTargetGoal };
};

/**
 * Hook for video streaming
 */
export const useVideoStream = (enabled: boolean, fps: number = 30, showDetections: boolean = true) => {
  const { connectionState } = useRobot();
  const [frame, setFrame] = useState<Uint8Array | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!connectionState.isConnected) {
      setIsStreaming(false);
      return;
    }

    try {
      if (!enabled) {
        setIsStreaming(false);
        return;
      }

      const unsubscribe = robotClient.subscribeVideo(
        (frameData) => setFrame(frameData),
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
  }, [connectionState.isConnected, enabled, fps, showDetections, refreshKey]);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  }

  return { frame, isStreaming, refresh };
};

/**
 * Hook to convert frame buffer to data URL for image display
 */
export const useFrameDataUrl = (frame: Uint8Array | null) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!frame) {
      setDataUrl('');
      return;
    }

    const blob = new Blob([new Uint8Array(frame)], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    setDataUrl(url);

    return () => URL.revokeObjectURL(url);
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
  const [logs, setLogs] = useState<LogEntry[]>([]);
    
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
    if (!connectionState.isConnected) {
      setLogs([]);
      return;
    }
    
    const unsubscribe = robotClient.subscribeNewLogs((data: LogsBatch) => {
      setLogs(prev => [...prev, ...(data.logs || [])]);
    });
    
    return () => {
      unsubscribe();
      setLogs([]);
    }
  }
  , [connectionState.isConnected]);

  return { logs, setLogs, fetchLogs };
}

/**
  * Hook to manage motor settings
  */
export const useMotorSettings = (interval = 1000) => {
  const [settings, setSettings] = useState<MotorSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();

    const timer = setInterval(fetchSettings, interval);
    return () => clearInterval(timer);
  }, [interval]);

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
  const [settings, setSettings] = useState<AutonomousSettings>({});
  const [stateMachines, setStateMachines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const updateSetting = async (key: keyof AutonomousSettings, value: any) => {
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
