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

export type RobotMode = 'idle' | 'manual' | 'autonomous';

export interface RobotState {
  mode: RobotMode;
  sensorData?: SensorData;
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
    detected: boolean[];
    thresholds: number[][];
  };
  motors?: number[];
  kicker?: boolean;
  running_state?: {
    running: boolean;
    bt_module_enabled: boolean;
    bt_module_state: boolean;
    switch_state: boolean;
  };
  goal_detection?: {
    detected: boolean;
    alignment: number;
    center_x: number | null;
    area: number;
    distance_mm: number | null;
    height_pixels: number | null;
  };
  position_estimate?: {
    x_mm: number | null;
    y_mm: number | null;
    confidence: number;
  };
  timestamp?: number;
}

export interface FormattedSensorData {
  compass: {
    heading: string;
    pitch: string;
    roll: string;
  };
  ir_ball: {
    angle: string;
    distance: string;
    detected: boolean;
  };
  camera_ball: {
    detected: string;
    angle: string;
    distance: string;
  };
  line: {
    detected: string[];
    raw: string[];
    thresholds: string[];
  };
  motors: string[];
  goal: {
    detected: boolean;
    alignment: string;
    center_x: string;
    area: string;
    distance: string;
    height: string;
  };
  position: {
    x: string;
    y: string;
    confidence: string;
  };
  running_state: {
    running: boolean;
    bt_module_enabled: boolean;
    bt_module_state: boolean;
    switch_state: boolean;
  };
}

export interface MotorSettings {
  rotation_correction_enabled?: boolean;
  line_avoiding_enabled?: boolean;
  position_based_speed_enabled?: boolean;
  camera_ball_usage_enabled?: boolean;
}

export interface GoalSettings {
  goal_color?: 'yellow' | 'blue';
  calibration?: {
    yellow?: {
      lower?: [number, number, number];
      upper?: [number, number, number];
    };
    blue?: {
      lower?: [number, number, number];
      upper?: [number, number, number];
    };
  };
}

export interface AutonomousSettings {
  state_machine?: string | null;
  always_face_goal_enabled?: boolean;
}

export interface LogEntry {
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  logger: string;
  time: number;
}

export interface LogsBatch {
  logs?: LogEntry[];
  last_id?: number;
}

export interface DetectedObject {
  object_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  color: [number, number, number];
}

