/**
 * Robot dashboard with sensor visualization and controls
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRobot } from '@/context/RobotContext';
import { useSensorData, useVideoStream, useFrameDataUrl, useLogs, useTargetGoal } from '@/hooks/useRobot';
import { formatSensorData } from '@/lib/robotUtils';
import { CompassCard } from './sensor-cards/compass-card';
import { LineSensorsCard } from './sensor-cards/line-sensors-card';
import { GoalDetectionCard } from './sensor-cards/goal-detection-card';
import { BallDetectionCard } from './sensor-cards/ball-detection-card';
import { MotorsCard } from './sensor-cards/motors-card';
import { FieldCard } from './sensor-cards/field-card';
import { HardwareStateCard } from './sensor-cards/hardware-state-card';
import { LogPanel } from './logs-panel';
import { ControlPanel } from '@/components/control-panel';

// ============= Main Dashboard =============

export const RobotDashboard: React.FC = () => {
  const { connectionState, disconnectFromRobot } = useRobot();
  const { sensorData } = useSensorData();
  const { frame } = useVideoStream(15, true);
  const frameUrl = useFrameDataUrl(frame);
  const logs = useLogs();

  const [fps, setFps] = useState(5);
  const [videoEnabled, setVideoEnabled] = useState(true);

  if (!connectionState.isConnected) {
    return (
      <div className="p-4 text-center">
        <p className="text-main-400">Not connected to any robot</p>
      </div>
    );
  }

  const robot = connectionState.connectedRobot;
  if (!robot) return null;

  const formattedSensors = formatSensorData(sensorData);

  const { targetGoal } = useTargetGoal();

  return (
    <div className="h-screen bg-white dark:bg-black flex flex-col max-h-screen">
      {/* Header */}
      <div className="flex-none p-2">
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold text-main-900 dark:text-white">
              {robot.name}
            </h1>
            <p className="text-xs text-main-600 dark:text-main-400">
              {robot.ip}:{robot.port}
            </p>
          </div>
          <Button onClick={disconnectFromRobot} className="bg-red-500 hover:bg-red-800 text-white">Disconnect</Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-3 p-2 overflow-y-auto">
        {/* Left */}
        <div className="flex-6 h-full flex flex-col items-center justify-center gap-3">
          {/* Video Controls & Stream */}
          <div className="flex-none w-full bg-white dark:bg-main-950 outline-solid outline-2 dark:outline-main-900 overflow-hidden">
            <div className="bg-white dark:bg-main-950 p-1 flex gap-2 items-center">
              <Button
                onClick={() => setVideoEnabled(!videoEnabled)}
                activeClass={`${videoEnabled ? 'bg-lime-600' : 'bg-main-900'} hover:${videoEnabled ? 'bg-lime-700' : 'bg-main-800'} text-white`}
                active={true}
                className="px-1 text-sm font-medium flex-1 max-h-4"
              >{`Video: ${videoEnabled ? 'ON' : 'OFF'}`}</Button>

              <span className="text-sm text-main-500 dark:text-main-400 ml-3 max-h-4 flex items-center">FPS:</span>
              {[5, 15, 30, 60].map((f) => (
                <Button
                  key={f}
                  onClick={() => setFps(f)}
                  activeClass='bg-yellow-500 hover:bg-yellow-600 text-black'
                  active={fps === f}
                  className="px-1 text-sm font-medium flex-1 max-h-4"
                >{f.toString()}</Button>
              ))}
            </div>

            {videoEnabled && frameUrl ? (
              <div className="bg-black shadow-sm aspect-video">
                <img
                  src={frameUrl}
                  alt="Camera Feed"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center aspect-video">
                <p className="text-main-400">Video Disabled</p>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="flex-1 w-full outline-solid outline-2 dark:outline-main-900 overflow-y-auto">
            <LogPanel logs={logs} />
          </div>
        </div>
        
        {/* Right */}
        <div className="flex-4 h-full flex flex-col items-center justify-center gap-3">
          {/* Sensors */}
          <div className="flex-none w-full grid grid-cols-2 lg:grid-cols-4 gap-2 bg-white dark:bg-main-950 outline-solid outline-2 dark:outline-main-900 overflow-hidden p-2">
            <CompassCard fdata={formattedSensors} />
            <LineSensorsCard data={sensorData} fdata={formattedSensors} />
            <GoalDetectionCard fdata={formattedSensors} targetGoal={targetGoal} />
            <BallDetectionCard data={sensorData} fdata={formattedSensors} />
            <MotorsCard fdata={formattedSensors} />
            <FieldCard className='col-span-2 row-span-2' data={sensorData} fdata={formattedSensors} targetGoal={targetGoal} />
            <HardwareStateCard fdata={formattedSensors} />
          </div>

          {/* Control Panel */}
          <div className="flex-1 w-full bg-white dark:bg-main-950 outline-solid outline-2 dark:outline-main-900 p-2">
            <div className="flex flex-col h-full gap-2 overflow-y-auto">
              <ControlPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

