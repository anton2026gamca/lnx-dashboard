/**
 * Robot dashboard with sensor visualization and controls
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useRobot } from '@/context/RobotContext';
import { useSensorData, useVideoStream, useFrameDataUrl, useUpdateSubscriptions, useTargetGoal, useRobotMode } from '@/hooks/useRobot';
import { formatSensorData } from '@/lib/robotUtils';
import { robotClient } from '@/lib/robotAPIClient';
import { CompassCard } from './sensor-cards/compass-card';
import { LineSensorsCard } from './sensor-cards/line-sensors-card';
import { GoalDetectionCard } from './sensor-cards/goal-detection-card';
import { BallDetectionCard } from './sensor-cards/ball-detection-card';
import { MotorsCard } from './sensor-cards/motors-card';
import { FieldCard } from './sensor-cards/field-card';
import { HardwareStateCard } from './sensor-cards/hardware-state-card';
import { LogPanel } from './logs-panel';

// ============= Main Dashboard =============

export const RobotDashboard: React.FC = () => {
  const { connectionState, disconnectFromRobot } = useRobot();
  const { sensorData } = useSensorData();
  const { frame } = useVideoStream(15, true);
  const frameUrl = useFrameDataUrl(frame);
  const { logsUpdates } = useUpdateSubscriptions();
  const { targetGoal, refresh: refreshTargetGoal } = useTargetGoal();
  const { mode, changeMode } = useRobotMode();

  const [fps, setFps] = useState(5);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [keyPressed, setKeyPressed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (mode !== 'manual') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        setKeyPressed(prev => new Set(prev).add(key));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        const newSet = new Set(keyPressed);
        newSet.delete(key);
        setKeyPressed(newSet);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, keyPressed]);

  useEffect(() => {
    if (mode !== 'manual' || keyPressed.size === 0) return;

    let angle = 0;
    let speed = 0;
    let rotate = 0;

    if (keyPressed.has('w')) speed = 100;
    if (keyPressed.has('s')) speed = -100;
    if (keyPressed.has('a')) angle = 90;
    if (keyPressed.has('d')) angle = -90;
    if (keyPressed.has('arrowleft')) rotate = 50;
    if (keyPressed.has('arrowright')) rotate = -50;

    robotClient.setManualControl(angle, speed, rotate).catch(err => {
      console.error('Failed to send manual control:', err);
    });
  }, [keyPressed, mode]);

  const setGoalColor = async (color: 'yellow' | 'blue') => {
    try {
      await robotClient.setGoalSettings({ goal_color: color });
      await refreshTargetGoal();
    } catch (err) {
      console.error(`Failed to set goal color to ${color}:`, err);
    }
  };

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

  return (
    <div className="h-screen bg-white dark:bg-black flex flex-col">
      {/* Header */}
      <div className="p-2">
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

      <div className="flex items-center justify-center h-full gap-3 p-2">
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
          <div className="flex-1 w-full outline-solid outline-2 dark:outline-main-900 overflow-hidden">
            <LogPanel logs={logsUpdates} />
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

          {/* Control */}
          <div className="flex-1 w-full bg-white dark:bg-main-950 outline-solid outline-2 dark:outline-main-900 overflow-hidden p-2">
            <div className="flex flex-col h-full gap-2">
              <div className="bg-main-900 p-2">
                <h3 className="text-xs font-bold text-white uppercase mb-2">Mode</h3>
                <div className="grid grid-cols-3 gap-1">
                  <Button activeClass='bg-blue-500 hover:bg-blue-500 text-white' active={mode === 'idle'}       onClick={() => changeMode('idle')      }>Idle</Button>
                  <Button activeClass='bg-blue-500 hover:bg-blue-500 text-white' active={mode === 'autonomous'} onClick={() => changeMode('autonomous')}>Autonomous</Button>
                  <Button activeClass='bg-blue-500 hover:bg-blue-500 text-white' active={mode === 'manual'}     onClick={() => changeMode('manual')    }>Manual</Button>
                </div>
              </div>
              <div className="bg-main-900 p-2">
                <h3 className="text-xs font-bold text-white uppercase mb-2">Target Goal</h3>
                <div className="grid grid-cols-2 gap-1">
                  <Button activeClass='bg-yellow-500 hover:bg-yellow-500 text-black' active={targetGoal === 'yellow'} onClick={() => setGoalColor('yellow')}>Yellow</Button>
                  <Button activeClass='bg-blue-500   hover:bg-blue-500   text-white' active={targetGoal === 'blue'}   onClick={() => setGoalColor('blue')  }>Blue</Button>
                </div>
              </div>
              <div className="bg-main-900 p-2">
                <h3 className="text-xs font-bold text-white uppercase mb-2">Settings</h3>
                <div className="grid grid-cols-2 gap-1">
                  <Button onClick={() => {}}>Motor Settings</Button>
                  <Button onClick={() => {}}>Autonomous Settings</Button>
                </div>
              </div>
              <div className="bg-main-900 p-2">
                <Button onClick={() => {}} className="w-full" title="Open calibration menu">Calibration Menu</Button>
              </div>
              {mode === 'manual' && (
                <div className="bg-main-950 border-2 border-green-700 p-2 flex-1 flex flex-col items-center justify-center p-5">
                  <div className="text-xs font-bold text-green-200 uppercase mb-2">Manual Control Active</div>
                  <div className="text-xs text-green-300 space-y-1 font-mono">
                    <div>W/S - Forward/Backward</div>
                    <div>A/D - Strafe Left/Right</div>
                    <div>← / → - Rotate</div>
                  </div>
                </div>
              )}
              {mode !== 'manual' && (
                <div className="bg-main-950 border-2 border-main-800 p-2 flex-1 flex items-center justify-center text-center p-5">
                  <div className="text-xs text-main-500">Switch to <span className="font-bold text-yellow-400">Manual Mode</span> to use keyboard controls</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
