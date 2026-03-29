/**
 * Robot context for state management
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { RobotConnection, RobotConnectionState } from '@/types/robot';
import { robotStorage } from '@/lib/robotStorage';
import { robotClient } from '@/lib/robotAPIClient';

interface RobotContextType {
  // Connection state
  connectionState: RobotConnectionState;
  savedRobots: RobotConnection[];
  
  // Actions
  connectToRobot: (robot: RobotConnection) => Promise<void>;
  disconnectFromRobot: () => void;
  saveRobot: (robot: RobotConnection) => void;
  deleteSavedRobot: (id: string) => void;
  loadSavedRobots: () => void;
  createNewRobotConnection: (name: string, ip: string, port: number) => RobotConnection;
}

const RobotContext = createContext<RobotContextType | undefined>(undefined);

export const RobotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<RobotConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    connectedRobot: null,
  });

  const [savedRobots, setSavedRobots] = useState<RobotConnection[]>([]);

  useEffect(() => {
    loadSavedRobots();
  }, []);

  const loadSavedRobots = useCallback(() => {
    const robots = robotStorage.getAllConnections();
    robots.sort((a, b) => (b.lastConnected || 0) - (a.lastConnected || 0));
    setSavedRobots(robots);
  }, []);

  const connectToRobot = useCallback(async (robot: RobotConnection) => {
    setConnectionState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      await robotClient.connect(robot);
      
      robotStorage.updateLastConnected(robot.id);
      
      setConnectionState({
        isConnected: true,
        isConnecting: false,
        error: null,
        connectedRobot: robot,
      });

      loadSavedRobots();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
        isConnected: false,
        connectedRobot: null,
      }));
      throw error;
    }
  }, [loadSavedRobots]);

  const disconnectFromRobot = useCallback(() => {
    robotClient.disconnect();
    setConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
      connectedRobot: null,
    });
  }, []);

  const saveRobot = useCallback((robot: RobotConnection) => {
    robotStorage.saveConnection(robot);
    loadSavedRobots();
  }, [loadSavedRobots]);

  const deleteSavedRobot = useCallback((id: string) => {
    robotStorage.deleteConnection(id);
    loadSavedRobots();
  }, [loadSavedRobots]);

  const createNewRobotConnection = useCallback(
    (name: string, ip: string, port: number): RobotConnection => {
      return {
        id: robotStorage.generateId(),
        name,
        ip,
        port,
        createdAt: Date.now(),
      };
    },
    [],
  );

  const value: RobotContextType = {
    connectionState,
    savedRobots,
    connectToRobot,
    disconnectFromRobot,
    saveRobot,
    deleteSavedRobot,
    loadSavedRobots,
    createNewRobotConnection,
  };

  return (
    <RobotContext.Provider value={value}>
      {children}
    </RobotContext.Provider>
  );
};

export const useRobot = (): RobotContextType => {
  const context = useContext(RobotContext);
  if (!context) {
    throw new Error('useRobot must be used within RobotProvider');
  }
  return context;
};
