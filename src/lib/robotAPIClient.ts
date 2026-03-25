/**
 * Robot API client using Socket.IO
 */

import io, { Socket } from 'socket.io-client';
import { RobotConnection, SensorData, RobotState, RobotMode } from '@/types/robot';

export class RobotAPIClient {
  private socket: Socket | null = null;
  private robot: RobotConnection | null = null;
  private reconnectAttempts = 0;
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
          this.reconnectAttempts = 0;
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
   * Get motor settings
   */
  async getMotorSettings(): Promise<Record<string, boolean>> {
    return this._emit('get_motor_settings', {});
  }

  /**
   * Get goal settings
   */
  async getGoalSettings(): Promise<any> {
    return this._emit('get_goal_settings', {});
  }

  /**
   * Get logs
   */
  async getLogs(since: number = 0): Promise<any> {
    return this._emit('get_logs', { since });
  }

  /**
   * Get all available state machines
   */
  async getAllStateMachines(): Promise<string[]> {
    const response = await this._emit('get_all_state_machines', {});
    return response.state_machines || [];
  }

  /**
   * Get current state machine
   */
  async getStateMachine(): Promise<string | null> {
    const response = await this._emit('get_state_machine', {});
    return response.current_state_machine || null;
  }

  /**
   * Get detected objects
   */
  async getDetections(): Promise<any[]> {
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
  async setMotorSettings(settings: Record<string, boolean>): Promise<void> {
    await this._emit('set_motor_settings', settings);
  }

  /**
   * Set goal settings
   */
  async setGoalSettings(settings: any): Promise<void> {
    await this._emit('set_goal_settings', settings);
  }

  /**
   * Set state machine
   */
  async setStateMachine(name: string): Promise<void> {
    await this._emit('set_state_machine', { name });
  }

  /**
   * Reset compass
   */
  async resetCompass(): Promise<void> {
    await this._emit('reset_compass', {});
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
