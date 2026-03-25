/**
 * Robot connection types and interfaces
 */

export interface RobotConnection {
  id: string;
  name: string;
  ip: string;
  port: number;
  createdAt: number;
  lastConnected?: number;
}

export interface RobotConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectedRobot: RobotConnection | null;
}

export interface SensorData {
  compass?: {
    heading: number;
    pitch: number;
    roll: number;
  };
  ir?: {
    angle: number;
    distance: number;
    sensors: number[];
    status: string;
  };
  camera_ball?: {
    angle: number | null;
    distance: number | null;
    detected: boolean | null;
  };
  line?: {
    raw: number[];
    detected: boolean;
    thresholds: number[][];
  };
  motors?: {
    left: number;
    right: number;
  };
  kicker?: {
    charged: boolean;
    ready: boolean;
  };
  running_state?: {
    running: boolean;
    bt_module_enabled: boolean;
    bt_module_state: boolean;
    switch_state: boolean;
  };
  timestamp?: number;
}

export type RobotMode = 'idle' | 'manual' | 'autonomous';

export interface RobotState {
  mode: RobotMode;
  sensorData?: SensorData;
}
