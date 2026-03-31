/**
 * Main app component
 */

'use client';

import React from 'react';
import { useRobot } from '@/context/RobotContext';
import { RobotConnectionScreen } from '@/components/robot/connection-screen/connection-screen';
import { RobotDashboard } from '@/components/robot/dashboard/dashboard';

export const RobotApp: React.FC = () => {
  const { connectionState } = useRobot();

  return connectionState.isConnected ? <RobotDashboard /> : <RobotConnectionScreen />;
};
