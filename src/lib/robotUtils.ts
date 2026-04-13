/**
 * Robot utilities and helpers
 */

import { FormattedSensorData, GoalDetectionData, PositionEstimate, SensorData } from '@/types/robot';

/**
 * Validate IP address format
 */
export const validateIP = (ip: string): boolean => {
  if (/^localhost$/.test(ip)) return true;

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;

  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};

/**
 * Validate port number
 */
export const validatePort = (port: number): boolean => {
  return port >= 1 && port <= 65535;
};

/**
 * Format sensor data for display
 */
export const formatSensorData = (data: SensorData | null, goalDetection: GoalDetectionData | null): FormattedSensorData => {
  return {
    compass: data?.compass
      ? {
          heading: `${normalizeAngle(data.compass.heading).toFixed(1)}°`,
          pitch: `${normalizeAngle(data.compass.pitch).toFixed(1)}°`,
          roll: `${normalizeAngle(data.compass.roll).toFixed(1)}°`,
        }
      : { heading: '---', pitch: '---', roll: '---' },
    ir_ball: data?.ir && data.ir.angle !== null && data.ir.distance !== null && data.ir.angle !== 999 && data.ir.distance !== 0
      ? {
          angle: `${normalizeAngle(data.ir.angle).toFixed(1)}°`,
          distance: `${data.ir.distance.toFixed(0)}mm`,
          detected: true,
        }
      : { angle: '---', distance: '---', detected: false },
    camera_ball: data?.camera_ball && data.camera_ball.detected
      ? {
          detected: 'Yes',
          angle: data.camera_ball.angle ? `${normalizeAngle(data.camera_ball.angle).toFixed(1)}°` : 'N/A',
          distance: data.camera_ball.distance ? `${data.camera_ball.distance.toFixed(0)}mm` : 'N/A',
        }
      : { detected: 'No', angle: '---', distance: '---' },
    line: data?.line
      ? {
          detected: data.line.detected.map(d => d ? 'Yes' : 'No'),
          raw: data.line.raw.map((v, _) => `${(v / 1000 * 100).toFixed(0)}`),
          thresholds: data.line.thresholds.map((t, _) => `${t[0]}-${t[1]}`),
        }
      : { detected: new Array(12).fill('No'), raw: new Array(12).fill(''), thresholds: new Array(12).fill('__-__') },
    motors: data?.motors ? data.motors.map((m, _) => `${(m).toFixed(0)}%`) : ['--', '--', '--', '--'],
    goal: goalDetection && goalDetection.goal_detected
      ? {
          detected: true,
          alignment: `${(goalDetection.alignment * 100).toFixed(1)}%`,
          center_x: goalDetection.goal_center_x !== null ? `${goalDetection.goal_center_x.toFixed(0)}px` : '---',
          area: `${goalDetection.goal_area.toFixed(0)}px²`,
          distance: goalDetection.distance_mm !== null ? `${goalDetection.distance_mm.toFixed(0)}mm` : '---',
          height: goalDetection.goal_height_pixels !== null ? `${goalDetection.goal_height_pixels.toFixed(0)}px` : '---',
        }
      : { detected: false, alignment: '---', center_x: '---', area: '0px²', distance: '---', height: '---' },
    running_state: data?.running_state
      ? {
          running: data.running_state.running,
          bt_module_enabled: data.running_state.bt_module_enabled,
          bt_module_state: data.running_state.bt_module_state,
          switch_state: data.running_state.switch_state,
        }
      : { running: false, bt_module_enabled: false, bt_module_state: false, switch_state: false },
  };
};

/**
 * Normalize angle to 0-360 range
 */
export const normalizeAngle = (angle: number): number => {
  let normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
};
