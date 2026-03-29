/**
 * Robot utilities and helpers
 */

import { robotClient } from '@/lib/robotAPIClient';
import { SensorData } from '@/types/robot';

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
export const formatSensorData = (data: SensorData): Record<string, any> => {
  return {
    compass: data.compass
      ? {
          heading: `${normalizeAngle(data.compass.heading).toFixed(1)}°`,
          pitch: `${normalizeAngle(data.compass.pitch).toFixed(1)}°`,
          roll: `${normalizeAngle(data.compass.roll).toFixed(1)}°`,
        }
      : null,
    ir_ball: data.ir
      ? {
          angle: `${normalizeAngle(data.ir.angle).toFixed(1)}°`,
          distance: `${data.ir.distance.toFixed(0)}mm`,
          detected: data.ir.angle !== null && data.ir.distance !== null && data.ir.angle !== 999 && data.ir.distance !== 0,
        }
      : null,
    camera_ball: data.camera_ball
      ? {
          detected: data.camera_ball.detected ? 'Yes' : 'No',
          angle: data.camera_ball.angle ? `${normalizeAngle(data.camera_ball.angle).toFixed(1)}°` : 'N/A',
          distance: data.camera_ball.distance ? `${data.camera_ball.distance.toFixed(0)}mm` : 'N/A',
        }
      : null,
    line: data.line ? {
      detected: data.line.detected ? 'Yes' : 'No',
      raw: data.line.raw.map((v, _) => `${(v / 1000 * 100).toFixed(0)}`),
      thresholds: data.line.thresholds.map((t, _) => `${t[0]}-${t[1]}`),
    } : null,
    motors: data.motors ? data.motors.map((m, _) => `${(m / 255 * 100).toFixed(0)}%`) : null,
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
