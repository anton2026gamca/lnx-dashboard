/**
 * Robot API client using Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import { RobotConnection, RobotMode, SensorData, MotorSettings, GoalSettings, AutonomousSettings, LogsBatch, DetectedObject, PositionEstimate, GoalDetectionData, BluetoothState, BluetoothDevice, OtherRobotInfo, BluetoothMessage, BluetoothPairableDevice } from '@/types/robot';

export class RobotAPIClient {
  private socket: Socket | null = null;
  private robot: RobotConnection | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private robotConnections: Map<string, { socket: Socket; robot: RobotConnection }> = new Map();
  private subscriptionHandlers: Map<string, Map<string, (...args: unknown[]) => void>> = new Map();

  /**
   * Connect to a robot
   */
  async connect(robot: RobotConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const existingConnection = this.robotConnections.get(robot.id);
        if (existingConnection?.socket.connected) {
          this.socket = existingConnection.socket;
          this.robot = existingConnection.robot;
          resolve();
          return;
        }

        if (existingConnection) {
          existingConnection.socket.disconnect();
          this.robotConnections.delete(robot.id);
        }

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
          const connection = this.robotConnections.get(robot.id);
          if (connection?.socket === socket) {
            this.robotConnections.delete(robot.id);
          }
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
   * Get all currently connected robots
   */
  getConnectedRobots(): RobotConnection[] {
    return Array.from(this.robotConnections.values()).map((connection) => connection.robot);
  }

  /**
   * Get a specific robot's connection info
   */
  getRobotConnection(robotId: string): RobotConnection | null {
    return this.robotConnections.get(robotId)?.robot ?? null;
  }

  private getConnection(robotId?: string): { socket: Socket; robot: RobotConnection } | null {
    if (robotId) {
      return this.robotConnections.get(robotId) ?? null;
    }
    if (this.robot?.id) {
      const activeConnection = this.robotConnections.get(this.robot.id);
      if (activeConnection) {
        return activeConnection;
      }
    }
    if (this.socket && this.robot) {
      return { socket: this.socket, robot: this.robot };
    }
    return null;
  }

  // ============ Query Methods ============

  /**
   * Get sensor data
   */
  async getSensorData(robotId?: string): Promise<SensorData | null> {
    return this._emit('get_sensor_data', {}, robotId);
  }

  /**
    * Get goal detection data
    */
  async getGoalDetection(robotId?: string): Promise<GoalDetectionData | null> {
    return this._emit('get_goal_detection', {}, robotId);
  }

  /**
    * Get position estimate
    */
  async getPositionEstimate(robotId?: string): Promise<PositionEstimate | null> {
    return this._emit('get_position_estimate', {}, robotId);
  }

  /**
   * Get current robot mode
   */
  async getMode(robotId?: string): Promise<RobotMode | null> {
    const response = await this._emit<{ mode?: RobotMode }>('get_mode', {}, robotId);
    if (!response?.mode) {
      return null;
    }
    return response.mode as RobotMode;
  }

  /**
   * Get logs
   */
  async getLogs(since: number = 0, robotId?: string): Promise<LogsBatch | null> {
    return this._emit('get_logs', { since }, robotId);
  }

  /**
   * Get motor settings
   */
  async getMotorSettings(robotId?: string): Promise<MotorSettings | null> {
    return this._emit('get_motor_settings', {}, robotId);
  }

  /**
   * Get goal settings
   */
  async getGoalSettings(robotId?: string): Promise<GoalSettings | null> {
    return this._emit('get_goal_settings', {}, robotId);
  }

  /**
   * Get autonomous mode settings
   */
  async getAutonomousSettings(robotId?: string): Promise<AutonomousSettings | null> {
    const response = await this._emit('get_autonomous_state', {}, robotId);
    return response || null;
  }

  /**
   * Get all available state machines
   */
  async getAllStateMachines(robotId?: string): Promise<string[]> {
    const response = await this._emit<{ state_machines?: string[] }>('get_all_state_machines', {}, robotId);
    return response?.state_machines || [];
  }

  /**
   * Get detected objects
   */
  async getDetections(robotId?: string): Promise<DetectedObject[]> {
    const response = await this._emit<{ detections?: DetectedObject[] }>('get_detections', {}, robotId);
    return response?.detections || [];
  }

  // ============ Bluetooth Methods ============

  async getBluetoothState(robotId?: string): Promise<BluetoothState | null> {
    const response = await this._emit<{
      process_alive?: boolean;
      local_device?: BluetoothState['local_device'];
      connected_devices?: BluetoothDevice[];
      paired_devices?: BluetoothDevice[];
      other_robot?: OtherRobotInfo;
    }>('get_bluetooth_state', {}, robotId);
    if (!response) {
      return null;
    }
    return {
      process_alive: Boolean(response.process_alive),
      local_device: response.local_device || {},
      connected_devices: Array.isArray(response.connected_devices) ? response.connected_devices : [],
      paired_devices: Array.isArray(response.paired_devices) ? response.paired_devices : [],
      other_robot: response.other_robot || {},
    };
  }

  async setOtherRobot(
    data: ({ clear: true } | ({ mac_address: string } & Partial<Omit<OtherRobotInfo, 'mac_address'>>)),
    robotId?: string,
  ): Promise<OtherRobotInfo | null> {
    const response = await this._emit<{ other_robot?: OtherRobotInfo }>('set_other_robot', data, robotId);
    return response?.other_robot ?? null;
  }

  async bluetoothConnectOtherRobot(macAddress?: string, robotId?: string): Promise<boolean> {
    const response = await this._emit<{ status?: 'ok' | 'error' }>('bluetooth_connect_other_robot', macAddress ? { mac_address: macAddress } : {}, robotId);
    return response?.status === 'ok';
  }

  async bluetoothDisconnectOtherRobot(macAddress?: string, robotId?: string): Promise<boolean> {
    const response = await this._emit<{ status?: 'ok' | 'error' }>('bluetooth_disconnect_other_robot', macAddress ? { mac_address: macAddress } : {}, robotId);
    return response?.status === 'ok';
  }

  async bluetoothSendMessage(messageType: string, content: string, macAddress?: string, robotId?: string): Promise<boolean> {
    const response = await this._emit<{ status?: 'ok' | 'error' }>('bluetooth_send_message', {
      ...(macAddress ? { mac_address: macAddress } : {}),
      message_type: messageType,
      content,
    }, robotId);
    return response?.status === 'ok';
  }

  async getBluetoothMessages(
    options: { clear?: boolean; limit?: number } = {},
    robotId?: string,
  ): Promise<{ received: BluetoothMessage[]; sent: BluetoothMessage[] } | null> {
    const response = await this._emit<{ received?: BluetoothMessage[]; sent?: BluetoothMessage[] }>('get_bluetooth_messages', options, robotId);
    if (!response) {
      return null;
    }
    return {
      received: Array.isArray(response.received) ? response.received : [],
      sent: Array.isArray(response.sent) ? response.sent : [],
    };
  }

  async bluetoothPairDevice(
    device: { mac_address: string; name: string; hostname?: string; ip_address?: string },
    robotId?: string,
  ): Promise<BluetoothDevice[] | null> {
    const response = await this._emit<{ paired_devices?: BluetoothDevice[] }>('bluetooth_pair_device', device, robotId);
    return Array.isArray(response?.paired_devices) ? response.paired_devices : null;
  }

  async bluetoothUnpairDevice(macAddress: string, robotId?: string): Promise<BluetoothDevice[] | null> {
    const response = await this._emit<{ paired_devices?: BluetoothDevice[] }>('bluetooth_unpair_device', { mac_address: macAddress }, robotId);
    return Array.isArray(response?.paired_devices) ? response.paired_devices : null;
  }

  async bluetoothListPairableDevices(
    options: { timeout_seconds?: number } = {},
    robotId?: string,
  ): Promise<BluetoothPairableDevice[]> {
    const response = await this._emit<{
      devices?: BluetoothPairableDevice[];
      result?: {
        data?: {
          devices?: BluetoothPairableDevice[];
        };
      };
    }>('bluetooth_list_pairable_devices', options, robotId);

    const direct = response?.devices;
    if (Array.isArray(direct)) {
      return direct;
    }

    const nested = response?.result?.data?.devices;
    return Array.isArray(nested) ? nested : [];
  }

  async setBluetoothDiscoverable(durationSeconds?: number, robotId?: string): Promise<boolean> {
    const payload = typeof durationSeconds === 'number' ? { duration_seconds: durationSeconds } : {};
    const response = await this._emit<{ status?: 'ok' | 'error' }>('set_bluetooth_discoverable', payload, robotId);
    return response?.status === 'ok';
  }

  async setBluetoothNotDiscoverable(robotId?: string): Promise<boolean> {
    const response = await this._emit<{ status?: 'ok' | 'error' }>('set_bluetooth_not_discoverable', {}, robotId);
    return response?.status === 'ok';
  }

  // ============ Control Methods ============

  /**
   * Set robot mode
   */
  async setMode(mode: RobotMode, robotId?: string): Promise<void> {
    await this._emit('set_mode', { mode }, robotId);
  }

  /**
   * Set manual control
   */
  async setManualControl(
    moveAngle: number,
    moveSpeed: number,
    rotate: number,
    robotId?: string,
  ): Promise<void> {
    await this._emit('set_manual_control', {
      move: { angle: moveAngle, speed: moveSpeed },
      rotate: rotate,
    }, robotId);
  }

  /**
   * Set motor settings
   */
  async setMotorSettings(settings: MotorSettings, robotId?: string): Promise<void> {
    await this._emit('set_motor_settings', settings, robotId);
  }

  /**
   * Set goal settings
   */
  async setGoalSettings(settings: GoalSettings, robotId?: string): Promise<void> {
    await this._emit('set_goal_settings', settings, robotId);
  }

  /**
   * Set autonomous mode settings
   */
  async setAutonomousSettings(settings: AutonomousSettings, robotId?: string): Promise<void> {
    await this._emit('set_autonomous_state', { ...settings }, robotId);
  }

  /**
   * Reset compass
   */
  async resetCompass(robotId?: string): Promise<void> {
    await this._emit('reset_compass', {}, robotId);
  }

  // ============ Calibration Methods ============

  /**
   * Start line sensor calibration
   * @param phase - Calibration phase (1 or 2)
   */
  async startLineCalibration(phase: number = 1, robotId?: string): Promise<void> {
    await this._emit('start_line_calibration', { phase }, robotId);
  }

  /**
   * Stop line sensor calibration and get thresholds
   */
  async stopLineCalibration(robotId?: string): Promise<{
    phase: number;
    thresholds: number[][];
    min_values: number[];
    max_values: number[];
    can_start_phase2: boolean;
  } | null> {
    return this._emit('stop_line_calibration', {}, robotId);
  }

  /**
   * Cancel line sensor calibration
   */
  async cancelLineCalibration(robotId?: string): Promise<void> {
    await this._emit('cancel_line_calibration', {}, robotId);
  }

  /**
   * Get line calibration status with all detailed information
   */
  async getLineCalibrationStatus(robotId?: string): Promise<{
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
    return this._emit('get_line_calibration_status', {}, robotId);
  }

  /**
   * Calibrate ball detection distance
   * @param knownDistanceMm - Known distance in millimeters
   */
  async calibrateBallDistance(knownDistanceMm: number, robotId?: string): Promise<{ calibration_constant: number } | null> {
    return this._emit('camera_ball_distance_calibration', { known_distance_mm: knownDistanceMm }, robotId);
  }

  /**
   * Start goal distance calibration
   * @param initialDistance - Initial distance in mm (default 200)
   * @param lineDistance - Line distance in mm (default 200)
   */
  async startGoalDistanceCalibration(
    initialDistance: number = 200,
    lineDistance: number = 200,
    robotId?: string,
  ): Promise<void> {
    await this._emit('start_goal_distance_calibration', {
      initial_distance: initialDistance,
      line_distance: lineDistance,
    }, robotId);
  }

  /**
   * Stop goal distance calibration
   */
  async stopGoalDistanceCalibration(robotId?: string): Promise<{
    focal_length?: number;
    message?: string;
  } | null> {
    return this._emit('stop_goal_distance_calibration', {}, robotId);
  }

  /**
   * Cancel goal distance calibration
   */
  async cancelGoalDistanceCalibration(robotId?: string): Promise<void> {
    await this._emit('cancel_goal_distance_calibration', {}, robotId);
  }

  /**
   * Get goal distance calibration status
   */
  async getGoalDistanceCalibrationStatus(robotId?: string): Promise<{
    calibrating: boolean;
    distance_offset: number;
  } | null> {
    return this._emit('get_goal_distance_calibration_status', {}, robotId);
  }

  /**
   * Get goal focal length
   */
  async getGoalFocalLength(robotId?: string): Promise<{ focal_length: number } | null> {
    return this._emit('get_goal_focal_length', {}, robotId);
  }

  /**
   * Set goal focal length
   * @param focalLength - Focal length value
   */
  async setGoalFocalLength(focalLength: number, robotId?: string): Promise<void> {
    await this._emit('set_goal_focal_length', { focal_length_pixels: focalLength }, robotId);
  }

  /**
   * Compute HSV values from image regions
   * @param regions - Array of regions with x, y, width, height
   */
  async computeHsvFromRegions(
    regions: Array<{x: number; y: number; width: number; height: number}>,
    robotId?: string,
  ): Promise<{
    lower: [number, number, number];
    upper: [number, number, number];
  } | null> {
    return this._emit('compute_hsv_from_regions', { regions }, robotId);
  }

  /**
   * Set line sensor thresholds
   */
  async setLineThresholds(thresholds: number[][], robotId?: string): Promise<void> {
    await this._emit('set_line_thresholds', { thresholds }, robotId);
  }

  /**
   * Set ball color calibration with ranges
   */
  async setBallCalibration(
    ranges: Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }>,
    robotId?: string,
  ): Promise<void> {
    await this._emit('set_ball_calibration', { ranges }, robotId);
  }

  /**
   * Get ball color calibration
   */
  async getBallColorCalibration(robotId?: string): Promise<{
    ranges: Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }>;
  } | null> {
    return this._emit('get_ball_calibration', {}, robotId);
  }

  /**
   * Add a new HSV range for ball color detection
   */
  async addBallColorRange(
    lower: [number, number, number],
    upper: [number, number, number],
    robotId?: string,
  ): Promise<
    Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }> | null
  > {
    const response = await this._emit<{
      ranges?: Array<{
        lower: [number, number, number];
        upper: [number, number, number];
      }>;
    }>('add_ball_color_range', { lower, upper }, robotId);
    return response?.ranges || null;
  }

  /**
   * Remove a ball color range by index
   */
  async removeBallColorRange(index: number, robotId?: string): Promise<
    Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }> | null
  > {
    const response = await this._emit<{
      ranges?: Array<{
        lower: [number, number, number];
        upper: [number, number, number];
      }>;
    }>('remove_ball_color_range', { index }, robotId);
    return response?.ranges || null;
  }

  /**
   * Add a new HSV range for goal color detection
   */
  async addGoalColorRange(
    goalColor: 'yellow' | 'blue',
    lower: [number, number, number],
    upper: [number, number, number],
    robotId?: string,
  ): Promise<
    Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }> | null
  > {
    const response = await this._emit<{
      ranges?: Array<{
        lower: [number, number, number];
        upper: [number, number, number];
      }>;
    }>('add_goal_color_range', {
      goal_color: goalColor,
      lower,
      upper,
    }, robotId);
    return response?.ranges || null;
  }

  /**
   * Remove a goal color range by index
   */
  async removeGoalColorRange(
    goalColor: 'yellow' | 'blue',
    index: number,
    robotId?: string,
  ): Promise<
    Array<{
      lower: [number, number, number];
      upper: [number, number, number];
    }> | null
  > {
    const response = await this._emit<{
      ranges?: Array<{
        lower: [number, number, number];
        upper: [number, number, number];
      }>;
    }>('remove_goal_color_range', {
      goal_color: goalColor,
      index,
    }, robotId);
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
  private subscribeUpdate<T>(eventName: string, subscribeKey: string, callback: (data: T) => void, robotId?: string): () => void {
    const connection = this.getConnection(robotId);
    if (!connection) {
      throw new Error('Not connected to robot');
    }

    const { socket, robot } = connection;
    const effectiveRobotId = robot.id;

    const handler = (data: unknown) => {
      callback(data as T);
    };

    if (!this.subscriptionHandlers.has(effectiveRobotId)) {
      this.subscriptionHandlers.set(effectiveRobotId, new Map());
    }
    const robotHandlers = this.subscriptionHandlers.get(effectiveRobotId)!;
    robotHandlers.set(eventName, handler);

    socket.on(eventName, handler);
    socket.emit('subscribe_updates', { updates: { [subscribeKey]: true } });

    return () => {
      socket.off(eventName, handler);
      socket.emit('subscribe_updates', { updates: { [subscribeKey]: false } });
      const handlers = this.subscriptionHandlers.get(effectiveRobotId);
      if (handlers) {
        handlers.delete(eventName);
      }
    };
  }


  subscribeModeChange(callback: (mode: RobotMode) => void, robotId?: string): () => void {
    return this.subscribeUpdate<{ mode: RobotMode }>(
      'mode_changed',
      'mode_changed',
      (data) => {
        if (data?.mode) {
          callback(data.mode);
        }
      },
      robotId,
    );
  }

  subscribeGoalColorChange(callback: (goalColor: 'yellow' | 'blue') => void, robotId?: string): () => void {
    return this.subscribeUpdate<{ goal_color: 'yellow' | 'blue' }>(
      'goal_color_changed',
      'goal_color_changed',
      (data) => {
        if (data?.goal_color) {
          callback(data.goal_color);
        }
      },
      robotId,
    );
  }

  subscribeImportantSensorDataChange(callback: (data: SensorData) => void, robotId?: string): () => void {
    return this.subscribeUpdate<SensorData>(
      'important_sensor_data_change',
      'important_sensor_data_change',
      (data) => {
        if (data) {
          callback(data);
        }
      },
      robotId,
    );
  }

  subscribeNewLogs(callback: (logs: LogsBatch) => void, robotId?: string): () => void {
    return this.subscribeUpdate<LogsBatch>(
      'new_logs',
      'new_logs',
      (data) => {
        if (data) {
          callback(data);
        }
      },
      robotId,
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
    robotId?: string,
  ): () => void {
    const connection = this.getConnection(robotId);
    if (!connection) {
      throw new Error('Not connected to robot');
    }

    const { socket, robot } = connection;
    const effectiveRobotId = robot.id;

    const handleFrame = (frame: unknown) => {
      let arr;
      if (frame instanceof Uint8Array) {
        arr = frame;
      } else if (frame instanceof ArrayBuffer) {
        arr = new Uint8Array(frame);
      } else if (frame && frame instanceof Buffer) {
        arr = new Uint8Array(frame);
      } else {
        console.warn('Unknown frame type', frame);
        return;
      }
      onFrame(arr);
    };

    if (!this.subscriptionHandlers.has(effectiveRobotId)) {
      this.subscriptionHandlers.set(effectiveRobotId, new Map());
    }
    const robotHandlers = this.subscriptionHandlers.get(effectiveRobotId)!;
    robotHandlers.set('video_frame', handleFrame);

    socket.on('video_frame', handleFrame);
    socket.emit('subscribe_video', { fps, show_detections: showDetections });

    return () => {
      socket.off('video_frame', handleFrame);
      socket.emit('unsubscribe_video', {});
      const handlers = this.subscriptionHandlers.get(effectiveRobotId);
      if (handlers) {
        handlers.delete('video_frame');
      }
    };
  }

  /**
   * Listen to real-time events
   */
  on(event: string, callback: (...args: unknown[]) => void, robotId?: string): void {
    const connection = this.getConnection(robotId);
    if (connection) {
      connection.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (...args: unknown[]) => void, robotId?: string): void {
    const connection = this.getConnection(robotId);
    if (connection) {
      connection.socket.off(event, callback);
    }
  }

  // ============ Private Methods ============

  private _emit<T = unknown>(event: string, data: unknown = {}, robotId?: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const connection = this.getConnection(robotId);
      if (!connection || !connection.socket.connected) {
        resolve(null);
        return;
      }

      connection.socket.emit(event, data, (response: unknown) => {
        const typedResponse = response as ({ status?: string; error?: string } & T) | null;
        if (typedResponse?.status === 'error') {
          reject(new Error(typedResponse.error || 'Unknown error'));
        } else {
          resolve((response === undefined || response === null) ? null : (response as T));
        }
      });
    });
  }
}

// Export singleton instance
export const robotClient = new RobotAPIClient();
