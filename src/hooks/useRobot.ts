/**
 * Custom hooks for robot interactions
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { robotClient } from '@/lib/robotAPIClient';
import { useRobot } from '@/context/RobotContext';
import { SensorData, RobotMode, LogEntry, DetectedObject, LogsBatch } from '@/types/robot';

/**
 * Hook to fetch sensor data periodically
 */
export const useSensorData = (interval: number = 500) => {
  const { connectionState } = useRobot();
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await robotClient.getSensorData();
      setSensorData(data);
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
  
    const unsubscribe = robotClient.subscribeImportantSensorDataChange((data: SensorData) => setSensorData(data));

    const timer = setInterval(fetchData, interval);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [connectionState.isConnected, interval]);

  return { sensorData, loading, error };
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
      console.log('Fetched mode:', currentMode);
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
export const useVideoStream = (fps: number = 30, showDetections: boolean = true) => {
  const { connectionState } = useRobot();
  const [frame, setFrame] = useState<Uint8Array | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!connectionState.isConnected) {
      setIsStreaming(false);
      return;
    }

    try {
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
  }, [connectionState.isConnected, fps, showDetections]);

  return { frame, isStreaming };
};

/**
 * Hook to convert frame buffer to data URL for image display
 */
export const useFrameDataUrl = (frame: Uint8Array | null) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!frame) {
      setDataUrl(null);
      return;
    }

    const blob = new Blob([new Uint8Array(frame)], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    setDataUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [frame]);  return dataUrl;
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

  useEffect(() => {
    if (!connectionState.isConnected) {
      setLogs([]);
      return;
    }
    
    const fetchLogs = async () => {
      try {
        const logBatch = await robotClient.getLogs();
        if (logBatch) {
          setLogs(logBatch?.logs || []);
        }
      }
      catch (err) {
        console.error('Failed to fetch logs:', err);
        setLogs([]);
      }
    }

    fetchLogs();
    
    const unsubscribe = robotClient.subscribeNewLogs((data: LogsBatch) => {
      setLogs(prev => [...prev, ...(data.logs || [])]);
    });
    
    return () => {
      unsubscribe();
      setLogs([]);
    }
  }
  , [connectionState.isConnected]);

  return logs;
}

