/**
 * Robot API client using Socket.IO
 */

import io, { Socket } from 'socket.io-client';
import { RobotConnection, RobotMode, SensorData, MotorSettings, GoalSettings, AutonomousSettings, LogEntry, LogsBatch, DetectedObject } from '@/types/robot';

export class RobotAPIClient {
  private socket: Socket | null = null;
  private robot: RobotConnection | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  /**
   * Connect to a robot
   */
  async connect(robot: RobotConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `http://${robot.ip}:${robot.port}`;
        
        this.socket = io(url, {
          reconnection: true,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: this.maxReconnectAttempts,
          transports: ['websocket', 'polling'],
        });

        this.robot = robot;

        this.socket.on('connect', () => {
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          reject(new Error(`Connection error: ${error.message}`));
        });

        this.socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from robot:', reason);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the robot
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.robot = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current robot connection info
   */
  getRobot(): RobotConnection | null {
    return this.robot;
  }

  // ============ Query Methods ============

  /**
   * Get sensor data
   */
  async getSensorData(): Promise<SensorData> {
    return this._emit('get_sensor_data', {});
  }

  /**
   * Get current robot mode
   */
  async getMode(): Promise<RobotMode> {
    const response = await this._emit('get_mode', {});
    return response.mode as RobotMode;
  }

  /**
   * Get logs
   */
  async getLogs(since: number = 0): Promise<LogsBatch> {
    return this._emit('get_logs', { since });
  }

  /**
   * Get motor settings
   */
  async getMotorSettings(): Promise<MotorSettings> {
    return this._emit('get_motor_settings', {});
  }

  /**
   * Get goal settings
   */
  async getGoalSettings(): Promise<GoalSettings> {
    return this._emit('get_goal_settings', {});
  }

  /**
   * Get autonomous mode settings
   */
  async getAutonomousSettings(): Promise<AutonomousSettings> {
    const response = await this._emit('get_autonomous_settings', {});
    return response.current_state_machine || null;
  }

  /**
   * Get all available state machines
   */
  async getAllStateMachines(): Promise<string[]> {
    const response = await this._emit('get_all_state_machines', {});
    return response.state_machines || [];
  }

  /**
   * Get detected objects
   */
  async getDetections(): Promise<DetectedObject[]> {
    const response = await this._emit('get_detections', {});
    return response.detections || [];
  }

  // ============ Control Methods ============

  /**
   * Set robot mode
   */
  async setMode(mode: RobotMode): Promise<void> {
    await this._emit('set_mode', { mode });
  }

  /**
   * Set manual control
   */
  async setManualControl(
    moveAngle: number,
    moveSpeed: number,
    rotate: number,
  ): Promise<void> {
    await this._emit('set_manual_control', {
      move: { angle: moveAngle, speed: moveSpeed },
      rotate: rotate,
    });
  }

  /**
   * Set motor settings
   */
  async setMotorSettings(settings: MotorSettings): Promise<void> {
    await this._emit('set_motor_settings', settings);
  }

  /**
   * Set goal settings
   */
  async setGoalSettings(settings: GoalSettings): Promise<void> {
    await this._emit('set_goal_settings', settings);
  }

  /**
   * Set autonomous mode settings
   */
  async setAutonomousSettings(settings: AutonomousSettings): Promise<void> {
    await this._emit('set_autonomous_settings', { settings });
  }

  /**
   * Reset compass
   */
  async resetCompass(): Promise<void> {
    await this._emit('reset_compass', {});
  }

  // ============ Calibration Methods ============

  /**
   * Start line sensor calibration
   * @param phase - Calibration phase (1 or 2)
   */
  async startLineCalibration(phase: number = 1): Promise<void> {
    await this._emit('start_line_calibration', { phase });
  }

  /**
   * Stop line sensor calibration and get thresholds
   */
  async stopLineCalibration(): Promise<{
    phase: number;
    thresholds: number[][];
    min_values: number[];
    max_values: number[];
    can_start_phase2: boolean;
  }> {
    return this._emit('stop_line_calibration', {});
  }

  /**
   * Cancel line sensor calibration
   */
  async cancelLineCalibration(): Promise<void> {
    await this._emit('cancel_line_calibration', {});
  }

  /**
   * Get line calibration status
   */
  async getLineCalibrationStatus(): Promise<{
    phase: number;
    min_values: number[];
    max_values: number[];
  }> {
    return this._emit('get_line_calibration_status', {});
  }

  /**
   * Calibrate ball detection distance
   * @param knownDistanceMm - Known distance in millimeters
   */
  async calibrateBallDistance(knownDistanceMm: number): Promise<{ calibration_constant: number }> {
    return this._emit('camera_ball_distance_calibration', { known_distance_mm: knownDistanceMm });
  }

  /**
   * Get ball calibration data
   */
  async getBallCalibration(): Promise<{
    calibration_constant: number;
    distance_offset: number;
  }> {
    return this._emit('get_ball_calibration', {});
  }

  /**
   * Start goal distance calibration
   * @param initialDistance - Initial distance in mm (default 200)
   * @param lineDistance - Line distance in mm (default 200)
   */
  async startGoalDistanceCalibration(
    initialDistance: number = 200,
    lineDistance: number = 200,
  ): Promise<void> {
    await this._emit('start_goal_distance_calibration', {
      initial_distance: initialDistance,
      line_distance: lineDistance,
    });
  }

  /**
   * Stop goal distance calibration
   */
  async stopGoalDistanceCalibration(): Promise<{
    focal_length?: number;
    message?: string;
  }> {
    return this._emit('stop_goal_distance_calibration', {});
  }

  /**
   * Cancel goal distance calibration
   */
  async cancelGoalDistanceCalibration(): Promise<void> {
    await this._emit('cancel_goal_distance_calibration', {});
  }

  /**
   * Get goal distance calibration status
   */
  async getGoalDistanceCalibrationStatus(): Promise<{
    calibrating: boolean;
    distance_offset: number;
  }> {
    return this._emit('get_goal_distance_calibration_status', {});
  }

  /**
   * Get goal focal length
   */
  async getGoalFocalLength(): Promise<{ focal_length: number }> {
    return this._emit('get_goal_focal_length', {});
  }

  /**
   * Set goal focal length
   * @param focalLength - Focal length value
   */
  async setGoalFocalLength(focalLength: number): Promise<void> {
    await this._emit('set_goal_focal_length', { focal_length: focalLength });
  }

  /**
   * Compute HSV values from image regions
   * @param regions - Array of regions with x, y, width, height
   */
  async computeHsvFromRegions(
    regions: Array<{ x: number; y: number; width: number; height: number }>,
  ): Promise<{
    h_min: number;
    h_max: number;
    s_min: number;
    s_max: number;
    v_min: number;
    v_max: number;
  }> {
    return this._emit('compute_hsv_from_regions', { regions });
  }

  // ============ Video Streaming ============

  /**
   * Subscribe to video frames
   */
  subscribeVideo(
    onFrame: (frame: Uint8Array) => void,
    fps: number = 30,
    showDetections: boolean = true,
  ): () => void {
    if (!this.socket) {
      throw new Error('Not connected to robot');
    }

    const handleFrame = (frame: Buffer | Uint8Array) => {
      onFrame(new Uint8Array(frame));
    };

    this.socket.on('video_frame', handleFrame);
    this.socket.emit('subscribe_video', { fps, show_detections: showDetections });

    // Return unsubscribe function
    return () => {
      this.socket?.off('video_frame', handleFrame);
      this.socket?.emit('unsubscribe_video', {});
    };
  }

  /**
   * Listen to real-time events
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // ============ Private Methods ============

  private _emit(event: string, data: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Not connected to robot'));
        return;
      }

      this.socket.emit(event, data, (response: any) => {
        if (response?.status === 'error') {
          reject(new Error(response.error || 'Unknown error'));
        } else {
          resolve(response || {});
        }
      });
    });
  }
}

// Export singleton instance
export const robotClient = new RobotAPIClient();
