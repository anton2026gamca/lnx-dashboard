/**
 * Robot connection storage utilities
 */

import { RobotConnection } from '@/types/robot';

const STORAGE_KEY = 'lnx_robot_connections';
const MAX_SAVED_ROBOTS = 20;

export const robotStorage = {
  /**
   * Get all saved robot connections
   */
  getAllConnections(): RobotConnection[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load robot connections:', error);
      return [];
    }
  },

  /**
   * Get a specific robot connection by ID
   */
  getConnection(id: string): RobotConnection | null {
    const connections = this.getAllConnections();
    return connections.find(conn => conn.id === id) || null;
  },

  /**
   * Save a robot connection
   */
  saveConnection(connection: RobotConnection): RobotConnection {
    const connections = this.getAllConnections();
    const existingIndex = connections.findIndex(c => c.id === connection.id);

    if (existingIndex >= 0) {
      connections[existingIndex] = {
        ...connections[existingIndex],
        ...connection,
      };
    } else {
      if (connections.length >= MAX_SAVED_ROBOTS) {
        // Remove oldest connection
        connections.sort((a, b) => (a.lastConnected || 0) - (b.lastConnected || 0));
        connections.shift();
      }
      connections.push(connection);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
    return connection;
  },

  /**
   * Update last connected time
   */
  updateLastConnected(id: string): void {
    const connection = this.getConnection(id);
    if (connection) {
      this.saveConnection({
        ...connection,
        lastConnected: Date.now(),
      });
    }
  },

  /**
   * Delete a robot connection
   */
  deleteConnection(id: string): void {
    const connections = this.getAllConnections();
    const filtered = connections.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Generate a new robot ID
   */
  generateId(): string {
    return `robot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};
