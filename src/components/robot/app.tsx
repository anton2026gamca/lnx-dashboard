/**
 * Main app component
 */

'use client';

import React, { useState } from 'react';
import { useRobot } from '@/context/RobotContext';
import { RobotConnectionScreen } from '@/components/robot/connection-screen/connection-screen';
import { RobotDashboard } from '@/components/robot/dashboard/dashboard';

export const RobotApp: React.FC = () => {
  const { connectionState } = useRobot();
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  return (
    <>
      {(connectionState.isConnected) && (
        <RobotDashboard onAddRobot={() => setShowConnectionModal(true)} />
      )}
      {(!connectionState.isConnected || showConnectionModal) && (
        <RobotConnectionScreen
          isOverlay={connectionState.isConnected}
          onClose={connectionState.isConnected ? () => setShowConnectionModal(false) : undefined}
        />
      )}
    </>
  );
};
