'use client';

import { useEffect, useRef, useState } from "react";
import { SensorCard, SensorProperty } from "./sensor-card";
import { FormattedSensorData, PositionEstimate, SensorData } from "@/types/robot";


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
        const maxHeight = containerRef.current.clientHeight - 4;
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
  
  let robotPixelX: number | null = null;
  let robotPixelY: number | null = null;
  
  if (robotX !== null && robotY !== null) {
    robotPixelX = displayWidth / 2 + robotX * scale;
    robotPixelY = robotY * scale;
  }
  
  let ballCamX: number | null = null;
  let ballCamY: number | null = null;
  let ballIRAngle: number | null = null;

  if (robotX !== null && robotY !== null) {
    if (irBallDetected && irBallAngle !== null && irBallDistance !== null && irBallDistance > 0) {
      ballIRAngle = -90 + irBallAngle + (robotHeading || 0);
    }
    if (camBallDetected && camBallAngle !== null && camBallDistance !== null && camBallDistance > 0) {
      const camAngleRad = (-90 + camBallAngle + (robotHeading || 0)) / 180 * Math.PI;
      const ballX = robotX + camBallDistance * Math.cos(camAngleRad);
      const ballY = robotY + camBallDistance * Math.sin(camAngleRad);
      ballCamX = displayWidth / 2 + ballX * scale;
      ballCamY = ballY * scale;
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col gap-2 items-center justify-center break-keep text-nowrap">
        <SensorProperty label="X (mm)"     inline={true} value={robotX !== null ? robotX.toFixed(0) : '---'} />
        <SensorProperty label="Y (mm)"     inline={true} value={robotY !== null ? robotY.toFixed(0) : '---'} />
        <SensorProperty label="Confidence" inline={true} value={confidence !== null && confidence !== undefined ? confidence : '---'} />
      </div>

      <div className="flex flex-col gap-2 items-center w-full h-full" ref={containerRef}>
        <div 
          className="relative bg-green-600 border-2 border-main-100 dark:border-main-600 rounded overflow-hidden flex-1 flex items-center justify-center"
          style={{
            height: `${displayHeight}px`,
            minHeight: '250px',
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
            
            {/* Goal areas - top */}
            <rect
              x={(displayWidth - GOAL_AREA_WIDTH * scale) / 2}
              y={0}
              width={GOAL_AREA_WIDTH * scale}
              height={GOAL_AREA_DEPTH * scale}
              fill="none"
              stroke="white"
              strokeWidth={1}
            />
            
            {/* Goal areas - bottom */}
            <rect
              x={(displayWidth - GOAL_AREA_WIDTH * scale) / 2}
              y={displayHeight - GOAL_AREA_DEPTH * scale}
              width={GOAL_AREA_WIDTH * scale}
              height={GOAL_AREA_DEPTH * scale}
              fill="none"
              stroke="white"
              strokeWidth={1}
            />
            
            {/* Blue goal */}
            <rect
              x={(displayWidth - GOAL_WIDTH * scale) / 2}
              y={targetGoal === 'blue' ? 0 : displayHeight - 5}
              width={GOAL_WIDTH * scale}
              height={5}
              fill="#3b82f6"
              stroke="#1e40af"
              strokeWidth={1}
            />
            
            {/* Yellow goal (bottom) */}
            <rect
              x={(displayWidth - GOAL_WIDTH * scale) / 2}
              y={targetGoal === 'yellow' ? 0 : displayHeight - 5}
              width={GOAL_WIDTH * scale}
              height={5}
              fill="#facc15"
              stroke="#b45309"
              strokeWidth={1}
            />
          </svg>

          {/* Ball IR Arrow (visualize angle only) */}
          {ballIRAngle !== null && robotPixelX !== null && robotPixelY !== null && (
            <svg
              className="absolute z-10 pointer-events-none"
              style={{ left: 0, top: 0, width: '100%', height: '100%' }}
            >
              {(() => {
                const angleRad = (ballIRAngle * Math.PI) / 180;
                const arrowLength = 50;
                const endX = robotPixelX + arrowLength * Math.cos(angleRad);
                const endY = robotPixelY + arrowLength * Math.sin(angleRad);
                return (
                  <>
                    {/* Arrow line (fixed length, only shows angle) */}
                    <line
                      x1={robotPixelX}
                      y1={robotPixelY}
                      x2={endX}
                      y2={endY}
                      stroke="#f97316" // orange-500
                      strokeWidth={2}
                      markerEnd="url(#arrowhead)"
                    />
                    {/* Arrowhead marker definition */}
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="8"
                        markerHeight="8"
                        refX="6"
                        refY="4"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <polygon points="0,0 8,4 0,8" fill="#f97316" />
                      </marker>
                    </defs>
                  </>
                );
              })()}
            </svg>
          )}
          
          {/* Ball position (Camera) */}
          {ballCamX !== null && ballCamY !== null && (
            <div
              className="absolute w-2.5 h-2.5 bg-orange-400 rounded-full border border-orange-600 transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${ballCamX}px`, top: `${ballCamY}px` }}
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
                <div
                  className="absolute w-0.5 h-2 bg-white left-1/2 bottom-1/2 origin-bottom"
                  style={{
                    transform: `translateX(-50%) rotate(${robotHeading}deg)`,
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-mono bg-black/70 font-semibold">
              No Position
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export const FieldCard: React.FC<{ data: SensorData | null, fdata: FormattedSensorData, targetGoal: 'yellow' | 'blue' | null, position: PositionEstimate | null, className?: string}> = ({ data, fdata, targetGoal, position, className }) => (
  <SensorCard label="Position" className={className}>
    <FieldVisualizer 
      robotX={position?.x_mm || null}
      robotY={position?.y_mm || null}
      robotHeading={data?.compass?.heading || null}
      confidence={`${position?.confidence.toFixed(1) || 0}%`}
      targetGoal={targetGoal}
      irBallAngle={fdata?.ir_ball.angle ? parseFloat(fdata.ir_ball.angle.toString()) : null}
      irBallDistance={fdata?.ir_ball.distance ? parseFloat(fdata.ir_ball.distance.toString()) : null}
      irBallDetected={fdata.ir_ball.detected}
      camBallAngle={fdata?.camera_ball.angle ? parseFloat(fdata.camera_ball.angle.toString()) : null}
      camBallDistance={fdata?.camera_ball.distance ? parseFloat(fdata.camera_ball.distance.toString()) : null}
      camBallDetected={data?.camera_ball?.detected || false}
    />
  </SensorCard>
);
