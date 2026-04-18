/**
 * Robot API client using Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import { RobotConnection, RobotMode, SensorData, MotorSettings, GoalSettings, AutonomousSettings, LogsBatch, DetectedObject, PositionEstimate, GoalDetectionData } from '@/types/robot';

export class RobotAPIClient {
  private socket: Socket | null = null;
  private robot: RobotConnection | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private robotConnections: Map<string, { socket: Socket; robot: RobotConnection }> = new Map();
  private subscriptionHandlers: Map<string, Map<string, Function>> = new Map();

  /**
   * Connect to a robot
   */
  async connect(robot: RobotConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `http://${robot.ip}:${robot.port}`;
        const opts = {
          reconnection: true,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: this.maxReconnectAttempts,
          transports: ['websocket', 'polling'],
          query: {},
        }

        if (robot.token) {
          opts.query = { token: btoa(robot.token) };
        }

        console.log(`Connecting to robot at ${url} with options:`, opts);
        
        const socket = io(url, opts);

        socket.on('connect', () => {
          this.robotConnections.set(robot.id, { socket, robot });
          this.socket = socket;
          this.robot = robot;
          resolve();
        });

        socket.on('connect_error', (error) => {
          reject(new Error(`Connection error: ${error.message}`));
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        socket.on('disconnect', (reason) => {
          console.log('Disconnected from robot:', reason);
          this.robotConnections.delete(robot.id);
          if (this.robot?.id === robot.id) {
            const remaining = Array.from(this.robotConnections.values());
            if (remaining.length > 0) {
              const next = remaining[0];
              this.socket = next.socket;
              this.robot = next.robot;
            } else {
              this.socket = null;
              this.robot = null;
            }
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from a specific robot or all robots
   */
  disconnect(robotId?: string): void {
    if (robotId) {
      const connection = this.robotConnections.get(robotId);
      if (connection) {
        this.subscriptionHandlers.delete(robotId);
        connection.socket.disconnect();
        this.robotConnections.delete(robotId);
        if (this.robot?.id === robotId) {
          const remaining = Array.from(this.robotConnections.values());
          if (remaining.length > 0) {
            const next = remaining[0];
            this.socket = next.socket;
            this.robot = next.robot;
          } else {
            this.socket = null;
            this.robot = null;
          }
        }
      }
    } else {
      this.robotConnections.forEach((connection) => {
        this.subscriptionHandlers.delete(connection.robot.id);
        connection.socket.disconnect();
      });
      this.robotConnections.clear();
      this.subscriptionHandlers.clear();
      this.socket = null;
      this.robot = null;
    }
  }

  /**
   * Set the active robot for operations
   */
  setActiveRobot(robotId: string): boolean {
    const connection = this.robotConnections.get(robotId);
    if (connection) {
      this.socket = connection.socket;
      this.robot = connection.robot;
      return true;
    }
    return false;
  }

  /**
   * Check if connected to any robot
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Check if connected to a specific robot
   */
  isConnectedToRobot(robotId: string): boolean {
    const connection = this.robotConnections.get(robotId);
    return connection?.socket.connected ?? false;
  }

  /**
   * Get current robot connection info
   */
  getRobot(): RobotConnection | null {
    return this.robot;
  }

  /**
   * Get a specific robot's connection info
   */
  getRobotConnection(robotId: string): RobotConnection | null {
    return this.robotConnections.get(robotId)?.robot ?? null;
  }

  // ============ Query Methods ============

  /**
   * Get sensor data
   */
  async getSensorData(): Promise<SensorData | null> {
    return this._emit('get_sensor_data', {});
  }

  /**
    * Get goal detection data
    */
  async getGoalDetection(): Promise<GoalDetectionData | null> {
    return this._emit('get_goal_detection', {});
  }

  /**
    * Get position estimate
    */
  async getPositionEstimate(): Promise<PositionEstimate | null> {
    return this._emit('get_position_estimate', {});
  }

  /**
   * Get current robot mode
   */
  async getMode(): Promise<RobotMode | null> {
    const response = await this._emit('get_mode', {});
    if (!response?.mode) {
      return null;
    }
    return response.mode as RobotMode;
  }

  /**
   * Get logs
   */
  async getLogs(since: number = 0): Promise<LogsBatch | null> {
    return this._emit('get_logs', { since });
  }

  /**
   * Get motor settings
   */
  async getMotorSettings(): Promise<MotorSettings | null> {
    return this._emit('get_motor_settings', {});
  }

  /**
   * Get goal settings
   */
  async getGoalSettings(): Promise<GoalSettings | null> {
    return this._emit('get_goal_settings', {});
  }

  /**
   * Get autonomous mode settings
   */
  async getAutonomousSettings(): Promise<AutonomousSettings | null> {
    const response = await this._emit('get_autonomous_state', {});
    return response || null;
  }

  /**
   * Get all available state machines
   */
  async getAllStateMachines(): Promise<string[]> {
    const response = await this._emit('get_all_state_machines', {});
    return response?.state_machines || [];
  }

  /**
   * Get detected objects
   */
  async getDetections(): Promise<DetectedObject[]> {
    const response = await this._emit('get_detections', {});
    return response?.detections || [];
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
    await this._emit('set_autonomous_state', { ...settings });
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
  } | null> {
    return this._emit('stop_line_calibration', {});
  }

  /**
   * Cancel line sensor calibration
   */
  async cancelLineCalibration(): Promise<void> {
    await this._emit('cancel_line_calibration', {});
  }

  /**
   * Get line calibration status with all detailed information
   */
  async getLineCalibrationStatus(): Promise<{
    active?: boolean;
    phase?: number;
    current_thresholds?: number[][];
    calibration_min?: number[];
    calibration_max?: number[];
    phase1_complete?: boolean;
    phase1_min?: number[];
    phase1_max?: number[];
    phase2_complete?: boolean;
    phase2_min?: number[];
    phase2_max?: number[];
  } | null> {
    return this._emit('get_line_calibration_status', {});
  }

  /**
   * Calibrate ball detection distance
   * @param knownDistanceMm - Known distance in millimeters
   */
  async calibrateBallDistance(knownDistanceMm: number): Promise<{ calibration_constant: number } | null> {
    return this._emit('camera_ball_distance_calibration', { known_distance_mm: knownDistanceMm });
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
  } | null> {
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
  } | null> {
    return this._emit('get_goal_distance_calibration_status', {});
  }

  /**
   * Get goal focal length
   */
  async getGoalFocalLength(): Promise<{ focal_length: number } | null> {
    return this._emit('get_goal_focal_length', {});
  }

  /**
   * Set goal focal length
   * @param focalLength - Focal length value
   */
  async setGoalFocalLength(focalLength: number): Promise<void> {
    await this._emit('set_goal_focal_length', { focal_length_pixels: focalLength });
  }

  /**
   * Compute HSV values from image regions
   * @param regions - Array of regions with x, y, width, height
   */
  async computeHsvFromRegions(
    regions: Array<{x: number; y: number; width: number; height: number}>
  ): Promise<{
    lower: [number, number, number];
    upper: [number, number, number];
  } | null> {
    return this._emit('compute_hsv_from_regions', { regions });
  }

  /**
   * Set line sensor thresholds
   */
  async setLineThresholds(thresholds: number[][]): Promise<void> {
    await this._emit('set_line_thresholds', { thresholds });
  }

  /**
   * Set ball color calibration with ranges
   */
  async setBallCalibration(
    ranges: Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }>
  ): Promise<void> {
    await this._emit('set_ball_calibration', { ranges });
  }

  /**
   * Get ball color calibration
   */
  async getBallColorCalibration(): Promise<{
    ranges: Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }>;
  } | null> {
    return this._emit('get_ball_calibration', {});
  }

  /**
   * Add a new HSV range for ball color detection
   */
  async addBallColorRange(
    lower: [number, number, number],
    upper: [number, number, number]
  ): Promise<
    Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }> | null
  > {
    const response = await this._emit('add_ball_color_range', { lower, upper });
    return response?.ranges || null;
  }

  /**
   * Remove a ball color range by index
   */
  async removeBallColorRange(index: number): Promise<
    Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }> | null
  > {
    const response = await this._emit('remove_ball_color_range', { index });
    return response?.ranges || null;
  }

  /**
   * Add a new HSV range for goal color detection
   */
  async addGoalColorRange(
    goalColor: 'yellow' | 'blue',
    lower: [number, number, number],
    upper: [number, number, number]
  ): Promise<
    Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }> | null
  > {
    const response = await this._emit('add_goal_color_range', {
      goal_color: goalColor,
      lower,
      upper,
    });
    return response?.ranges || null;
  }

  /**
   * Remove a goal color range by index
   */
  async removeGoalColorRange(
    goalColor: 'yellow' | 'blue',
    index: number
  ): Promise<
    Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }> | null
  > {
    const response = await this._emit('remove_goal_color_range', {
      goal_color: goalColor,
      index,
    });
    return response?.ranges || null;
  }

  // ============ Update Subscriptions ============

  /**
   * Generic subscribe update function for socket events.
   * @param eventName The event name to listen for.
   * @param subscribeKey The key to enable/disable in subscribe_updates.
   * @param callback The callback to invoke when event fires.
   * @returns Unsubscribe function.
   */
  private subscribeUpdate<T>(eventName: string, subscribeKey: string, callback: (data: T) => void): () => void {
    if (!this.socket || !this.robot) {
      throw new Error('Not connected to robot');
    }

    const robotId = this.robot.id;
    const socket = this.socket;

    const handler = (data: any) => {
      // console.log(`Received update for ${eventName}:`, data);
      callback(data as T);
    };

    if (!this.subscriptionHandlers.has(robotId)) {
      this.subscriptionHandlers.set(robotId, new Map());
    }
    const robotHandlers = this.subscriptionHandlers.get(robotId)!;
    robotHandlers.set(eventName, handler);

    socket.on(eventName, handler);
    socket.emit('subscribe_updates', { updates: { [subscribeKey]: true } });

    return () => {
      socket.off(eventName, handler);
      socket.emit('subscribe_updates', { updates: { [subscribeKey]: false } });
      const handlers = this.subscriptionHandlers.get(robotId);
      if (handlers) {
        handlers.delete(eventName);
      }
    };
  }

  subscribeModeChange(callback: (mode: RobotMode) => void): () => void {
    return this.subscribeUpdate<{ mode: RobotMode }>(
      'mode_changed',
      'mode_changed',
      (data) => {
        if (data?.mode) {
          callback(data.mode);
        }
      }
    );
  }

  subscribeGoalColorChange(callback: (goalColor: 'yellow' | 'blue') => void): () => void {
    return this.subscribeUpdate<{ goal_color: 'yellow' | 'blue' }>(
      'goal_color_changed',
      'goal_color_changed',
      (data) => {
        if (data?.goal_color) {
          callback(data.goal_color);
        }
      }
    );
  }

  subscribeImportantSensorDataChange(callback: (data: SensorData) => void): () => void {
    return this.subscribeUpdate<SensorData>(
      'important_sensor_data_changed',
      'important_sensor_data_changed',
      (data) => {
        if (data) {
          callback(data);
        }
      }
    );
  }

  subscribeNewLogs(callback: (logs: LogsBatch) => void): () => void {
    return this.subscribeUpdate<LogsBatch>(
      'new_logs',
      'new_logs',
      (data) => {
        if (data) {
          callback(data);
        }
      }
    );
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
    if (!this.socket || !this.robot) {
      throw new Error('Not connected to robot');
    }

    const robotId = this.robot.id;
    const socket = this.socket;

    const handleFrame = (frame: Buffer | Uint8Array) => {
      onFrame(new Uint8Array(frame));
    };

    if (!this.subscriptionHandlers.has(robotId)) {
      this.subscriptionHandlers.set(robotId, new Map());
    }
    const robotHandlers = this.subscriptionHandlers.get(robotId)!;
    robotHandlers.set('video_frame', handleFrame);

    socket.on('video_frame', handleFrame);
    socket.emit('subscribe_video', { fps, show_detections: showDetections });

    return () => {
      socket.off('video_frame', handleFrame);
      socket.emit('unsubscribe_video', {});
      const handlers = this.subscriptionHandlers.get(robotId);
      if (handlers) {
        handlers.delete('video_frame');
      }
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
        resolve(null);
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
