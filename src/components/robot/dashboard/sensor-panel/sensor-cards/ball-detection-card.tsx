'use client';

import { FormattedSensorData, SensorData } from "@/types/robot";
import { SensorCard, SensorProperty, AngleIndicator } from "./sensor-card";

export const BallDetectionCard: React.FC<{ data: SensorData | null, fdata: FormattedSensorData }> = ({ data, fdata }) => (
  <SensorCard label="Ball Detection">
    <div className="flex gap-2 h-full">
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="w-full flex flex-col gap-0.5">
          <SensorProperty label="IR Angle" value={fdata.ir_ball.angle} />
          <SensorProperty label="IR Dist" value={fdata.ir_ball.distance} />
        </div>
        <div className="flex-1 flex items-center justify-center p-1 w-full outline-2 bg-main-200 dark:bg-main-900 outline-main-300 dark:outline-main-600 hover:outline-main-400 hover:dark:outline-main-500">
          <AngleIndicator
          angle={fdata.ir_ball.angle ? parseFloat(fdata.ir_ball.angle.toString()) : 0}
          enabled={fdata.ir_ball.detected}
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="w-full flex flex-col gap-0.5">
          <SensorProperty label="Cam Angle" value={fdata.camera_ball.angle} />
          <SensorProperty label="Cam Dist" value={fdata.camera_ball.distance} />
        </div>
        <div className="flex-1 flex items-center justify-center p-1 w-full outline-2 bg-main-200 dark:bg-main-900 outline-main-300 dark:outline-main-600 hover:outline-main-400 hover:dark:outline-main-500">
          <AngleIndicator
            angle={fdata.camera_ball.angle ? parseFloat(fdata.camera_ball.angle.toString()) : 0}
            enabled={data?.camera_ball?.detected || false}
          />
        </div>
      </div>
    </div>
  </SensorCard>
);
