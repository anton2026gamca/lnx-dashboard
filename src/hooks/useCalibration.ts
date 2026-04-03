/**
 * Custom hooks for calibration interactions
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { robotClient } from '@/lib/robotAPIClient';
import { useRobot } from '@/context/RobotContext';
import { LineCalibrationStatus, GoalDistanceCalibrationStatus } from '@/types/calibration';

/**
 * Hook for line sensor calibration
 */
export const useLineCalibration = () => {
  const { connectionState } = useRobot();
  const [phase, setPhase] = useState<1 | 2>(1);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<LineCalibrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPhase = useCallback(async (phaseNum: 1 | 2) => {
    if (!connectionState.isConnected) return;

    try {
      setLoading(true);
      setError(null);
      setPhase(phaseNum);
      setIsActive(true);
      await robotClient.startLineCalibration(phaseNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start calibration');
      setIsActive(false);
    } finally {
      setLoading(false);
    }
  }, [connectionState.isConnected]);

  const stop = useCallback(async () => {
    if (!connectionState.isConnected) return;

    try {
      setLoading(true);
      const result = await robotClient.stopLineCalibration();
      setIsActive(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop calibration');
    } finally {
      setLoading(false);
    }
  }, [connectionState.isConnected]);

  const cancel = useCallback(async () => {
    if (!connectionState.isConnected) return;

    try {
      await robotClient.cancelLineCalibration();
      setIsActive(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel calibration');
    }
  }, [connectionState.isConnected]);

  const getStatus = useCallback(async () => {
    if (!connectionState.isConnected) return;

    try {
      const result = await robotClient.getLineCalibrationStatus();
      if (result) {
        setStatus(result as any);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get status');
    }
  }, [connectionState.isConnected]);

  useEffect(() => {
    if (!connectionState.isConnected || !isActive) return;

    const handleStatus = (data: any) => {
      if (data) {
        setStatus(data);
      }
    };

    robotClient.on('line_calibration_status', handleStatus);

    return () => {
      robotClient.off('line_calibration_status', handleStatus);
    };
  }, [connectionState.isConnected, isActive]);

  return {
    phase,
    isActive,
    status,
    loading,
    error,
    startPhase,
    stop,
    cancel,
    getStatus,
  };
};

/**
 * Hook for goal distance calibration
 */
export const useGoalDistanceCalibration = () => {
  const { connectionState } = useRobot();
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<GoalDistanceCalibrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (initialDistance: number, lineDistance: number) => {
    if (!connectionState.isConnected) return;

    try {
      setLoading(true);
      setError(null);
      setIsActive(true);
      await robotClient.startGoalDistanceCalibration(initialDistance, lineDistance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start calibration');
      setIsActive(false);
    } finally {
      setLoading(false);
    }
  }, [connectionState.isConnected]);

  const stop = useCallback(async () => {
    if (!connectionState.isConnected) return;

    try {
      setLoading(true);
      const result = await robotClient.stopGoalDistanceCalibration();
      setIsActive(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop calibration');
    } finally {
      setLoading(false);
    }
  }, [connectionState.isConnected]);

  const cancel = useCallback(async () => {
    if (!connectionState.isConnected) return;

    try {
      await robotClient.cancelGoalDistanceCalibration();
      setIsActive(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel calibration');
    }
  }, [connectionState.isConnected]);

  useEffect(() => {
    if (!connectionState.isConnected || !isActive) return;

    const handleStatus = (data: any) => {
      if (data) {
        setStatus(data);
      }
    };

    robotClient.on('goal_distance_calibration_status', handleStatus);

    return () => {
      robotClient.off('goal_distance_calibration_status', handleStatus);
    };
  }, [connectionState.isConnected, isActive]);

  return {
    isActive,
    status,
    loading,
    error,
    start,
    stop,
    cancel,
  };
};
