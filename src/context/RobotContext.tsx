/**
 * Robot context for state management
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { RobotConnection, RobotConnectionState } from '@/types/robot';
import { robotStorage } from '@/lib/robotStorage';
import { robotClient } from '@/lib/robotAPIClient';
import { getColorForRobot } from '@/lib/robotColors';

interface RobotContextType {
  // Connection state
  connectionState: RobotConnectionState;
  savedRobots: RobotConnection[];
  
  // Actions
  connectToRobot: (robot: RobotConnection) => Promise<void>;
  disconnectFromRobot: (robotId?: string) => void;
  switchActiveRobot: (robotId: string) => void;
  saveRobot: (robot: RobotConnection) => void;
  deleteSavedRobot: (id: string) => void;
  loadSavedRobots: () => void;
  createNewRobotConnection: (name: string, ip: string, port: number, token?: string, color?: string) => RobotConnection;
}

const RobotContext = createContext<RobotContextType | undefined>(undefined);

export const RobotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<RobotConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    connectedRobot: null,
    connectedRobots: [],
    activeRobotId: null,
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
      
      // Add new robot to the list of connected robots without disconnecting existing ones
      setConnectionState(prev => {
        // Check if robot is already connected
        const alreadyConnected = prev.connectedRobots.some(r => r.id === robot.id);
        const updatedRobots = alreadyConnected ? prev.connectedRobots : [...prev.connectedRobots, robot];
        
        return {
          isConnected: true,
          isConnecting: false,
          error: null,
          connectedRobot: robot,
          connectedRobots: updatedRobots,
          activeRobotId: robot.id,
        };
      });

      loadSavedRobots();
    } catch (error) {
      const errorMessage = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ''}` : `Connection failed: ${JSON.stringify(error)}`;
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [loadSavedRobots]);

  const disconnectFromRobot = useCallback((robotId?: string) => {
    robotClient.disconnect(robotId);
    setConnectionState(prev => {
      if (robotId) {
        const updatedRobots = prev.connectedRobots.filter(r => r.id !== robotId);
        const newActiveId = updatedRobots.length > 0 ? updatedRobots[0].id : null;
        return {
          isConnected: updatedRobots.length > 0,
          isConnecting: false,
          error: null,
          connectedRobot: updatedRobots.length > 0 ? updatedRobots[0] : null,
          connectedRobots: updatedRobots,
          activeRobotId: newActiveId,
        };
      }
      return {
        isConnected: false,
        isConnecting: false,
        error: null,
        connectedRobot: null,
        connectedRobots: [],
        activeRobotId: null,
      };
    });
  }, []);

  const switchActiveRobot = useCallback((robotId: string) => {
    robotClient.setActiveRobot(robotId);
    setConnectionState(prev => {
      const robot = prev.connectedRobots.find(r => r.id === robotId);
      if (!robot) return prev;
      return {
        ...prev,
        connectedRobot: robot,
        activeRobotId: robotId,
      };
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
    (name: string, ip: string, port: number, token?: string, color?: string): RobotConnection => {
      const id = robotStorage.generateId();
      const finalColor = color || getColorForRobot(id);
      return {
        id,
        name,
        ip,
        port,
        createdAt: Date.now(),
        color: finalColor as any,
        ...(token && { token }),
      };
    },
    [],
  );

  const value: RobotContextType = {
    connectionState,
    savedRobots,
    connectToRobot,
    disconnectFromRobot,
    switchActiveRobot,
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
