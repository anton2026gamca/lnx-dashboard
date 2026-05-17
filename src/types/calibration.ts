/**
 * Calibration system types and interfaces
 */

export interface HSVRange {
  h_min: number;
  h_max: number;
  s_min: number;
  s_max: number;
  v_min: number;
  v_max: number;
}

export interface ColorCalibration {
  lower: [number, number, number];
  upper: [number, number, number];
}

export interface GoalColorCalibration {
  yellow?: ColorCalibration;
  blue?: ColorCalibration;
}

export interface BallColorCalibration extends ColorCalibration {}

export interface LineCalibrationStatus {
  active?: boolean;
  phase?: number;
  current_thresholds?: number[][];
  calibration_min?: Array<number | null> | null;
  calibration_max?: Array<number | null> | null;
  phase1_complete?: boolean;
  phase1_min?: Array<number | null> | null;
  phase1_max?: Array<number | null> | null;
  phase2_complete?: boolean;
  phase2_min?: Array<number | null> | null;
  phase2_max?: Array<number | null> | null;
  thresholds?: Array<[number, number]>;
  min_values?: number[];
  max_values?: number[];
}

export interface GoalDistanceCalibrationStatus {
  active: boolean;
  phase: 'waiting' | 'initial' | 'driving';
  initial_height_pixels?: number;
  line_height_pixels?: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface DrawRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hsv?: HSVRange;
  canvas?: Region;
  originalHsv?: HSVRange;
  cameraImage?: string;
}
