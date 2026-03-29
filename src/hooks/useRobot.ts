/**
 * Custom hooks for robot interactions
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { robotClient } from '@/lib/robotAPIClient';
import { useRobot } from '@/context/RobotContext';
import { SensorData, RobotMode } from '@/types/robot';

/**
 * Hook to fetch sensor data periodically
 */
export const useSensorData = (interval: number = 500) => {
  const { connectionState } = useRobot();
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connectionState.isConnected) {
      if (sensorData !== null) {
        setSensorData(null);
      }
      return;
    }

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

    fetchData();
    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
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
    if (!connectionState.isConnected) return;

    try {
      const currentMode = await robotClient.getMode();
      setMode(currentMode);
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
    fetchMode();
  }, [fetchMode]);

  return { mode, loading, error, changeMode, fetchMode };
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

    const blob = new Blob([frame], { type: 'image/jpeg' });
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
