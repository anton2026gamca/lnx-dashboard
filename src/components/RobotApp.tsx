/**
 * Main app component
 */

'use client';

import React from 'react';
import { useRobot } from '@/context/RobotContext';
import { RobotConnectionScreen } from '@/components/RobotConnectionScreen';
import { RobotDashboard } from '@/components/RobotDashboard';

export const RobotApp: React.FC = () => {
  const { connectionState } = useRobot();

  return connectionState.isConnected ? <RobotDashboard /> : <RobotConnectionScreen />;
};
