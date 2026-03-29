/**
 * Robot dashboard with sensor visualization and controls
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRobot } from '@/context/RobotContext';
import { useSensorData, useVideoStream, useFrameDataUrl, useUpdateSubscriptions, useTargetGoal } from '@/hooks/useRobot';
import { formatSensorData } from '@/lib/robotUtils';
import { robotClient } from '@/lib/robotAPIClient';

// ============= Sub-components =============

interface SensorCardProps {
  label: string;
  children?: React.ReactNode;
}

const SensorCard: React.FC<SensorCardProps> = ({ label, children }) => (
  <div className="relative col-span-2 h-full flex flex-col bg-white dark:bg-main-950 p-2 shadow-sm outline-2 dark:outline-main-800 text-sm text-main-950 dark:text-main-400">
    <h3 className="text-xs font-bold text-main-900 dark:text-white uppercase mb-2">{label}</h3>
    <div className="flex-1 flex flex-col justify-center gap-2">
      {children}
    </div>
  </div>
);

interface SensorPropertyProps {
  label: string;
  value: string;
}

const SensorProperty: React.FC<SensorPropertyProps> = ({ label, value }) => (
  <div className="flex-1 flex w-full flex-col items-center justify-center outline-2 outline-dashed dark:outline-main-700 hover:dark:outline-main-600 text-xs py-0.5 px-2">
    {label}
    <div className="text-green-500">{value}</div>
  </div>
)

interface CompassProps {
  heading: number;
}

const Compass: React.FC<CompassProps> = ({ heading }) => (
  <div className="relative w-16 h-16 rounded-full border-2 border-green-500 mx-auto">
    <div
      className="absolute w-0.5 h-6 bg-gradient-to-b from-red-500 to-blue-500 left-1/2 top-1/2 origin-bottom"
      style={{ transform: `translate(-50%, -100%) rotate(${heading}deg)` }}
    />
    <div className="absolute text-xs text-main-500 top-1 left-1/2 transform -translate-x-1/2">N</div>
    <div className="absolute text-xs text-main-500 right-1 top-1/2 transform -translate-y-1/2">E</div>
    <div className="absolute text-xs text-main-500 bottom-1 left-1/2 transform -translate-x-1/2">S</div>
    <div className="absolute text-xs text-main-500 left-1 top-1/2 transform -translate-y-1/2">W</div>
  </div>
);

interface LineSensorsProps {
  labels: string[];
  values: number[];
  detected: boolean[];
}

const LineSensors: React.FC<LineSensorsProps> = ({ labels, values, detected }) => {
  const numSensors = values.length;
  const sensorSize = 20;
  const highlightOutline = 4;
  const radius = 50;
  const center = radius + sensorSize / 2;

  return (
    <div
      className="relative"
      style={{ width: `${center * 2}px`, height: `${center * 2}px` }}
    >
      {values.map((rawValue, i) => {
        const value = rawValue / 1000;
        const angle = (i / numSensors) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const divSize = (sensorSize - highlightOutline / 2);
        const x = center + radius * Math.cos(rad) - divSize / 2;
        const y = center + radius * Math.sin(rad) - divSize / 2;
        const color = `rgb(${51 + 51 * value}, ${102 + 153 * value}, ${102 + 153 * value})`;
        return (
          <div
            key={i}
            className="absolute rounded-full text-xs flex items-center justify-center font-mono text-white"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${divSize}px`,
              height: `${divSize}px`,
              background: color,
              outline: detected[i] ? `${highlightOutline}px solid gold` : `${highlightOutline / 2}px solid ${color}`,
            }}
          >
            {labels[i] || ""}
          </div>
        );
      })}
      {detected.some(d => d) ? (
        <div
          className="absolute flex items-center justify-center bg-yellow-500 rounded-full"
          style={{
            left: `${center - radius / 2.0}px`,
            top: `${center - radius / 2.0}px`,
            width: `${radius}px`,
            height: `${radius}px`,
          }}
        ></div>
      ) : null}
    </div>
  );
};

interface MotorVisualizerProps {
  speeds: number[];
}

const MotorVisualizer: React.FC<MotorVisualizerProps> = ({ speeds }) => {
  if (speeds.length != 4) return null;

  const MOTOR_LOCATIONS = [135, 225, 315, 45]; // degrees
  const locationsRad = MOTOR_LOCATIONS.map((a) => (a * Math.PI) / 180);
  const rotate =
    speeds.reduce((a, b) => a + b, 0) / MOTOR_LOCATIONS.length;
  const corrected = speeds.map((s) => s - rotate);

  let sumCosCos = 0,
    sumSinSin = 0,
    sumCosSpeed = 0,
    sumSinSpeed = 0;
  for (let i = 0; i < MOTOR_LOCATIONS.length; i++) {
    const c = Math.cos(locationsRad[i]);
    const s = Math.sin(locationsRad[i]);
    sumCosCos += c * c;
    sumSinSin += s * s;
    sumCosSpeed += c * corrected[i];
    sumSinSpeed += s * corrected[i];
  }

  const vx = sumCosSpeed / sumCosCos;
  const vy = sumSinSpeed / sumSinSin;
  const moveSpeed = Math.sqrt(vx * vx + vy * vy);
  const moveAngle = (Math.atan2(vy, vx) * 180) / Math.PI;

  return (
    <AngleIndicator angle={moveAngle} enabled={moveSpeed > 0.1} />
  );
};

interface AngleIndicatorProps {
  angle: number;
  enabled: boolean;
}

const AngleIndicator: React.FC<AngleIndicatorProps> = ({ angle, enabled }) => (
  <div className={`relative w-12 h-12 rounded-full border-2 bg-main-800 ${enabled ? 'border-green-500' : 'border-main-500'}`}>
    <div
      className={`absolute w-0.5 h-5 left-1/2 top-1/2 origin-bottom ${
        enabled ? 'bg-green-500' : 'bg-main-600'
      }`}
      style={{
        transform: `translate(-50%, -100%) rotate(${angle}deg)`,
      }}
    />
  </div>
);

interface FieldVisualizerProps {
  robotX: number | null;
  robotY: number | null;
  robotHeading: number | null;
  confidence: string;
  targetGoal: 'yellow' | 'blue' | null;
  irBallAngle: number | null;
  irBallDistance: number | null;
  irBallDetected: boolean;
  camBallAngle: number | null;
  camBallDistance: number | null;
  camBallDetected: boolean;
}

const FieldVisualizer: React.FC<FieldVisualizerProps> = ({
  robotX,
  robotY,
  robotHeading,
  confidence,
  targetGoal,
  irBallAngle,
  irBallDistance,
  irBallDetected,
  camBallAngle,
  camBallDistance,
  camBallDetected,
}) => {
  // Field dimensions from official RoboCup Junior specs (mm)
  const FIELD_WIDTH = 1580;
  const FIELD_HEIGHT = 2190;
  const GOAL_WIDTH = 600;
  const GOAL_AREA_DEPTH = 250;
  const GOAL_AREA_WIDTH = 800;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.12); // pixels per mm
  
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const maxWidth = containerRef.current.clientWidth - 4;
        const maxHeight = containerRef.current.clientHeight - 40;
        const scaleWidth = maxWidth / FIELD_WIDTH;
        const scaleHeight = maxHeight / FIELD_HEIGHT;
        setScale(Math.min(scaleWidth, scaleHeight));
      }
    };
    
    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  const displayWidth = FIELD_WIDTH * scale;
  const displayHeight = FIELD_HEIGHT * scale;
  
  const rotationAngle = targetGoal === 'yellow' ? 180 : 0;
  
  const transformCoordinates = (x: number, y: number, rotation: number) => {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos,
    };
  };
  
  let robotPixelX: number | null = null;
  let robotPixelY: number | null = null;
  
  if (robotX !== null && robotY !== null) {
    const transformed = transformCoordinates(robotX, robotY, rotationAngle);
    robotPixelX = displayWidth / 2 + transformed.x * scale;
    robotPixelY = displayHeight / 2 + transformed.y * scale;
  }
  
  let ballPixelX: number | null = null;
  let ballPixelY: number | null = null;
  let ballSource: 'ir' | 'camera' | null = null;
  
  if (robotX !== null && robotY !== null) {
    if (irBallDetected && irBallAngle !== null && irBallDistance !== null && irBallDistance > 0) {
      const irAngleRad = ((irBallAngle + (robotHeading || 0)) * Math.PI) / 180;
      const ballX = robotX + irBallDistance * Math.cos(irAngleRad);
      const ballY = robotY + irBallDistance * Math.sin(irAngleRad);
      const transformed = transformCoordinates(ballX, ballY, rotationAngle);
      ballPixelX = displayWidth / 2 + transformed.x * scale;
      ballPixelY = displayHeight / 2 + transformed.y * scale;
      ballSource = 'ir';
    } else if (camBallDetected && camBallAngle !== null && camBallDistance !== null && camBallDistance > 0) {
      const camAngleRad = ((camBallAngle + (robotHeading || 0)) * Math.PI) / 180;
      const ballX = robotX + camBallDistance * Math.cos(camAngleRad);
      const ballY = robotY + camBallDistance * Math.sin(camAngleRad);
      const transformed = transformCoordinates(ballX, ballY, rotationAngle);
      ballPixelX = displayWidth / 2 + transformed.x * scale;
      ballPixelY = displayHeight / 2 + transformed.y * scale;
      ballSource = 'camera';
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col gap-2 items-center justify-center break-keep text-xs text-main-600 dark:text-main-400 text-nowrap">
        <SensorProperty label="Target Goal" value={targetGoal ? targetGoal.toUpperCase() : 'N/A'} />
        <SensorProperty label="X (mm)" value={robotX !== null ? robotX.toFixed(0) : '---'} />
        <SensorProperty label="Y (mm)" value={robotY !== null ? robotY.toFixed(0) : '---'} />
      </div>

      <div className="flex flex-col gap-2 items-center w-full h-full" ref={containerRef}>
        <div 
          className="relative bg-green-600 border-2 border-white dark:border-main-600 rounded overflow-hidden flex-1 flex items-center justify-center"
          style={{
            height: `${displayHeight}px`,
            minHeight: '300px',
            aspectRatio: `${displayWidth} / ${displayHeight}`,
          }}
        >
          <svg
            viewBox={`-1 -1 ${displayWidth + 2} ${displayHeight + 2}`}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            {/* Field boundary */}
            <rect
              x={0}
              y={0}
              width={displayWidth}
              height={displayHeight}
              fill="#16a34a"
              stroke="white"
              strokeWidth={2}
            />
            
            {/* Center circle */}
            <circle
              cx={displayWidth / 2}
              cy={displayHeight / 2}
              r={(300 * scale)}
              fill="none"
              stroke="white"
              strokeWidth={1}
            />
            
            {/* Goal areas - top (target when blue) */}
            <rect
              x={(displayWidth - GOAL_AREA_WIDTH * scale) / 2}
              y={0}
              width={GOAL_AREA_WIDTH * scale}
              height={GOAL_AREA_DEPTH * scale}
              fill="none"
              stroke="white"
              strokeWidth={1}
            />
            
            {/* Goal areas - bottom (target when yellow) */}
            <rect
              x={(displayWidth - GOAL_AREA_WIDTH * scale) / 2}
              y={displayHeight - GOAL_AREA_DEPTH * scale}
              width={GOAL_AREA_WIDTH * scale}
              height={GOAL_AREA_DEPTH * scale}
              fill="none"
              stroke="white"
              strokeWidth={1}
            />
            
            {/* Blue goal (top) */}
            <rect
              x={(displayWidth - GOAL_WIDTH * scale) / 2}
              y={0}
              width={GOAL_WIDTH * scale}
              height={5}
              fill="#3b82f6"
              stroke="#1e40af"
              strokeWidth={1}
            />
            
            {/* Yellow goal (bottom) */}
            <rect
              x={(displayWidth - GOAL_WIDTH * scale) / 2}
              y={displayHeight - 5}
              width={GOAL_WIDTH * scale}
              height={5}
              fill="#facc15"
              stroke="#b45309"
              strokeWidth={1}
            />
          </svg>

          {/* Ball position (IR) */}
          {ballSource === 'ir' && ballPixelX !== null && ballPixelY !== null && (
            <div
              className="absolute w-2 h-2 bg-orange-500 rounded-full border border-orange-700 transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${ballPixelX}px`, top: `${ballPixelY}px` }}
              title={`Ball (IR): Distance ${irBallDistance?.toFixed(0)}mm, Angle ${irBallAngle?.toFixed(1)}°`}
            ></div>
          )}
          
          {/* Ball position (Camera) */}
          {ballSource === 'camera' && ballPixelX !== null && ballPixelY !== null && (
            <div
              className="absolute w-2.5 h-2.5 bg-green-400 rounded-full border border-green-600 transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${ballPixelX}px`, top: `${ballPixelY}px` }}
              title={`Ball (Camera): Distance ${camBallDistance?.toFixed(0)}mm, Angle ${camBallAngle?.toFixed(1)}°`}
            ></div>
          )}

          {/* Robot position and orientation */}
          {robotPixelX !== null && robotPixelY !== null ? (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: `${robotPixelX}px`, top: `${robotPixelY}px` }}
            >
              {/* Robot body */}
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 bg-red-500 rounded-full border border-red-700" />
                
                {/* Robot orientation indicator (front/heading) */}
                {robotHeading !== null && (
                  <div
                    className="absolute w-0.5 h-2 bg-white left-1/2 bottom-1/2 origin-bottom"
                    style={{
                      transform: `translateX(-50%) rotate(${robotHeading + rotationAngle}deg)`,
                    }}
                  ></div>
                )}
              </div>
              <div className="text-xs text-white font-mono mt-1 whitespace-nowrap">
                {robotX?.toFixed(0)}, {robotY?.toFixed(0)}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-mono bg-black/70 font-semibold">
              No Position
            </div>
          )}
        </div>
        
        <div className="text-xs text-main-600 dark:text-main-400 space-y-1">
          <div>Confidence: {confidence}</div>
          {robotHeading !== null && <div>Heading: {robotHeading.toFixed(1)}°</div>}
          {ballSource && <div>Ball: {ballSource.toUpperCase()}</div>}
        </div>
      </div>
    </div>
  );
};

interface LogPanelProps {
  logs: any[];
}

const parseLogMessage = (message: string): { text: string; color: string } => {
  const cleanText = message.replace(/\x1b\[[0-9;]*m/g, '');
  
  let color = 'text-white';
  
  if (message.includes('\x1b[1;31m') || message.includes('\x1b[91m')) {
    color = 'text-red-500';
  } else if (message.includes('\x1b[1;32m') || message.includes('\x1b[92m')) {
    color = 'text-green-500';
  } else if (message.includes('\x1b[1;33m') || message.includes('\x1b[93m')) {
    color = 'text-yellow-500';
  } else if (message.includes('\x1b[1;34m') || message.includes('\x1b[94m')) {
    color = 'text-blue-500';
  } else if (message.includes('\x1b[1;35m') || message.includes('\x1b[95m')) {
    color = 'text-purple-500';
  } else if (message.includes('\x1b[1;36m') || message.includes('\x1b[96m')) {
    color = 'text-cyan-500';
  } else if (message.includes('\x1b[1;37m') || message.includes('\x1b[97m')) {
    color = 'text-white';
  } else if (message.includes('\x1b[30m') || message.includes('\x1b[90m')) {
    color = 'text-gray-500';
  }
  
  return { text: cleanText, color };
};

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const levelColorMap: Record<string, string> = {
    debug: 'text-main-600',
    info: 'text-blue-400',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    critical: 'text-red-700',
  };
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-main-950 rounded">
      <div className="text-xs font-bold text-white uppercase px-2 py-1 border-b border-main-800 flex-shrink-0">
        Logs ({logs.length})
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 p-2"
      >
        {logs.map((log, idx) => {
          const { text, color } = parseLogMessage(log.message || '');
          const timestamp = log.time ? new Date(log.time).toLocaleTimeString() : '';
          const level = (log.level || 'info') as string;
          const levelColor = levelColorMap[level] || 'text-main-400';
          
          return (
            <div key={idx} className="flex gap-2">
              <span className="text-main-700 flex-shrink-0 w-20">{timestamp}</span>
              <span className={`flex-shrink-0 w-12 ${levelColor}`}>
                [{level.toUpperCase().slice(0, 3)}]
              </span>
              <span className={`flex-1 break-words ${color}`}>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface RunningStateVisualizerProps {
  running: boolean;
  btModuleEnabled: boolean;
  btModuleState: boolean;
  switchState: boolean;
}

const RunningStateVisualizer: React.FC<RunningStateVisualizerProps> = ({
  running,
  btModuleEnabled,
  btModuleState,
  switchState,
}) => {
  const StatusIndicator: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
    <div className="flex items-center gap-1 text-xs">
      <div className={`w-3 h-3 rounded-full mr-1 ${active ? 'bg-green-500' : 'bg-main-600'}`} />
      <span className={active ? 'text-green-500' : 'text-main-500'}>{label}</span>
    </div>
  );

  return (
    <div className="space-y-1 text-xs font-mono">
      <div className={`flex items-center gap-2 p-1 ${running ? 'bg-green-900 text-green-200' : 'bg-main-800 text-main-500'}`}>
        <span className="font-bold">RUNNING:</span>
        <span>{running ? 'ENABLED' : 'DISABLED'}</span>
      </div>
      
      <div className="space-y-1 pl-2 border-main-700">
        <StatusIndicator label="BT Module Enabled" active={btModuleEnabled} />
        <StatusIndicator label="BT Module State" active={btModuleState} />
        <StatusIndicator label="Switch State" active={switchState} />
      </div>
    </div>
  );
};

// ============= Main Dashboard =============

export const RobotDashboard: React.FC = () => {
  const { connectionState, disconnectFromRobot } = useRobot();
  const { sensorData } = useSensorData();
  const { frame } = useVideoStream(15, true);
  const frameUrl = useFrameDataUrl(frame);
  const { logsUpdates } = useUpdateSubscriptions();
  const { targetGoal } = useTargetGoal();

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

  const formattedSensors = sensorData ? formatSensorData(sensorData) : null;

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
          <button
            onClick={disconnectFromRobot}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors whitespace-nowrap"
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center h-full gap-3 p-2">
        {/* Left */}
        <div className="flex-6 h-full flex flex-col items-center justify-center gap-3">
          {/* Video Controls & Stream */}
          <div className="flex-none w-full bg-white dark:bg-main-950 outline-solid outline-2 dark:outline-main-900 overflow-hidden">
            <div className="bg-white dark:bg-main-950 p-1 flex gap-2 items-center">
              <button
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`px-1 text-sm font-medium transition-colors flex-1 outline-2 max-h-4 flex items-center justify-center ${
                  videoEnabled
                    ? 'bg-lime-600 hover:bg-lime-700 text-white outline-lime-600 hover:dark:outline-lime-700'
                    : 'bg-main-900 hover:bg-main-800 text-white dark:outline-main-800'
                }`}
              >
                Video: {videoEnabled ? 'ON' : 'OFF'}
              </button>

              <span className="text-sm text-main-500 dark:text-main-400 ml-3 max-h-4 flex items-center">FPS:</span>
              {[5, 15, 30, 60].map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={`px-1 text-sm font-medium transition-colors flex-1 outline-2 max-h-4 flex items-center justify-center ${
                    fps === f
                      ? 'bg-yellow-600 text-main-900 outline-yellow-600'
                      : 'bg-main-900 hover:bg-main-800 text-white dark:outline-main-800'
                  }`}
                >
                  {f}
                </button>
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
            {/* Compass */}
            <SensorCard label="Compass">
              <div className="flex-1 flex flex-col justify-center">
                <Compass
                  heading={formattedSensors?.compass?.heading
                    ? parseFloat(formattedSensors.compass.heading.toString())
                    : 0}
                />
              </div>
              <div className="flex items-center gap-3 m-1">
                <SensorProperty
                  label="Heading"
                  value={formattedSensors?.compass?.heading || "---"}
                />
                <SensorProperty
                  label="Pitch"
                  value={formattedSensors?.compass?.pitch || "---"}
                />
                <SensorProperty
                  label="Roll"
                  value={formattedSensors?.compass?.roll || "---"}
                />
              </div>
              <button
                className="absolute top-2 right-2 px-1 text-xs outline-2 dark:outline-main-700 hover:dark:outline-main-600"
                onClick={robotClient.resetCompass}
              >
                Reset
              </button>
            </SensorCard>

            {/* Line Sensors */}
            <SensorCard label="Line Sensors (12)">
              <div className="flex-1 flex items-center justify-center">
                <LineSensors
                  labels={(formattedSensors?.line.raw || []).map((v: number) => v / 1000)}
                  values={sensorData?.line?.raw || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
                  detected={formattedSensors?.line.detected || []}
                />
              </div>
            </SensorCard>

            {/* Goal Detection */}
            <SensorCard label="Goal Detection">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-main-600 dark:text-main-400">Detected:</span>
                  <div className={`px-2 font-bold ${
                    formattedSensors?.goal.detected 
                      ? 'bg-green-600 text-white' 
                      : 'bg-main-700 text-main-400'
                  }`}>
                    {formattedSensors?.goal.detected ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="flex justify-between pt-1 border-t border-main-700">
                  <span className="text-main-600 dark:text-main-400">Alignment:</span>
                  <span className="font-mono text-green-500">{formattedSensors?.goal.alignment || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-main-600 dark:text-main-400">Center X:</span>
                  <span className="font-mono text-green-500">{formattedSensors?.goal.center_x || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-main-600 dark:text-main-400">Area:</span>
                  <span className="font-mono text-green-500">{formattedSensors?.goal.area || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-main-600 dark:text-main-400">Height:</span>
                  <span className="font-mono text-green-500">{formattedSensors?.goal.height || 'N/A'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-main-700">
                  <span className="text-main-600 dark:text-main-400">Distance:</span>
                  <span className="font-mono text-blue-500">{formattedSensors?.goal.distance || 'N/A'}</span>
                </div>
              </div>
            </SensorCard>

            {/* Ball Detection */}
            <SensorCard label="Ball Detection">
              <div className="flex gap-2 h-full">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-0.5">
                    <SensorProperty label="IR Angle" value={formattedSensors?.ir_ball.angle || '---'} />
                    <SensorProperty label="IR Dist" value={formattedSensors?.ir_ball.distance || '---'} />
                  </div>
                  <div className="flex-1 flex items-center justify-center p-1 w-full outline-2 outline-dashed dark:outline-main-600 hover:dark:outline-main-500">
                    <AngleIndicator
                    angle={formattedSensors?.ir_ball.angle ? parseFloat(formattedSensors?.ir_ball.angle.toString()) : 0}
                    enabled={formattedSensors?.ir_ball.detected || false}
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-0.5">
                    <SensorProperty label="Cam Angle" value={formattedSensors?.cam_ball.angle || '---'} />
                    <SensorProperty label="Cam Dist" value={formattedSensors?.cam_ball.distance || '---'} />
                  </div>
                  <div className="flex-1 flex items-center justify-center p-1 w-full outline-2 outline-dashed dark:outline-main-600 hover:dark:outline-main-500">
                    <AngleIndicator
                      angle={formattedSensors?.cam_ball.angle ? parseFloat(formattedSensors?.cam_ball.angle.toString()) : 0}
                      enabled={formattedSensors?.cam_ball.detected || false}
                    />
                  </div>
                </div>
              </div>
            </SensorCard>

            {/* Motors */}
            <SensorCard label="Motors">
              <div className="relative grid grid-cols-2 gap-y-2 gap-x-12">
                {[0, 1, 2, 3].map((i) => (
                  <SensorProperty
                    key={i}
                    label={`M${i}`}
                    value={formattedSensors?.motors[i]?.toString() || '0'}
                  />
                ))}
                <div className="flex items-center justify-center absolute inset-0 pointer-events-none">
                  <div className="outline-2 outline-dashed dark:outline-main-500 hover:dark:outline-main-400 bg-white dark:bg-main-950 pointer-events-auto p-2">
                    <MotorVisualizer speeds={Object.values(formattedSensors?.motors || [0, 0, 0, 0]).map(Number)} />
                  </div>
                </div>
              </div>
            </SensorCard>

            {/* Position Estimate */}
            <div className="col-span-2 row-span-2">
              <SensorCard label="Position">
                <FieldVisualizer 
                  robotX={sensorData?.position_estimate?.x_mm || null}
                  robotY={sensorData?.position_estimate?.y_mm || null}
                  robotHeading={formattedSensors?.compass?.heading ? parseFloat(formattedSensors.compass.heading.toString()) : null}
                  confidence={formattedSensors?.position.confidence || '0%'}
                  targetGoal={targetGoal}
                  irBallAngle={formattedSensors?.ir_ball.angle ? parseFloat(formattedSensors.ir_ball.angle.toString()) : null}
                  irBallDistance={formattedSensors?.ir_ball.distance ? parseFloat(formattedSensors.ir_ball.distance.toString()) : null}
                  irBallDetected={formattedSensors?.ir_ball.detected || false}
                  camBallAngle={formattedSensors?.cam_ball.angle ? parseFloat(formattedSensors.cam_ball.angle.toString()) : null}
                  camBallDistance={formattedSensors?.cam_ball.distance ? parseFloat(formattedSensors.cam_ball.distance.toString()) : null}
                  camBallDetected={formattedSensors?.cam_ball.detected || false}
                />
              </SensorCard>
            </div>

            {/* Running State */}
            <SensorCard label="Hardware Enabled State">
              <RunningStateVisualizer 
                running={formattedSensors?.running_state.running || false}
                btModuleEnabled={formattedSensors?.running_state.bt_module_enabled || false}
                btModuleState={formattedSensors?.running_state.bt_module_state || false}
                switchState={formattedSensors?.running_state.switch_state || false}
              />
            </SensorCard>
          </div>

          {/* Control */}
          <div className="flex-1 w-full bg-white dark:bg-main-950 outline-solid outline-2 dark:outline-main-900 overflow-hidden p-1">

          </div>
        </div>
      </div>
    </div>
  );
};
