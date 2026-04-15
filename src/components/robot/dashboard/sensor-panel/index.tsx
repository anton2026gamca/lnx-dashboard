'use client';

import { useState } from "react";
import { useSensorData, usePositionEstimate, useTargetGoal, useGoalDetection } from "@/hooks/useRobot";
import { formatSensorData } from "@/lib/robotUtils";
import { CompassCard } from "./sensor-cards/compass-card";
import { LineSensorsCard } from "./sensor-cards/line-sensors-card";
import { GoalDetectionCard } from "./sensor-cards/goal-detection-card";
import { BallDetectionCard } from "./sensor-cards/ball-detection-card";
import { MotorsCard } from "./sensor-cards/motors-card";
import { FieldCard } from "./sensor-cards/field-card";
import { HardwareStateCard } from "./sensor-cards/hardware-state-card";
import { Button } from "@/components/ui/button";


export const SensorPanel: React.FC = () => {
  const [ups, setUps] = useState(5);
  const interval = 1000 / ups

  const { sensorData, error } = useSensorData(interval);
  const { goalDetection } = useGoalDetection(interval);
  const { position } = usePositionEstimate(interval);
  const { targetGoal } = useTargetGoal();
  const formattedData = formatSensorData(sensorData, goalDetection);

  return (
    <div className="p-2 flex-1 flex flex-col gap-2">
      {error && <div className="p-1 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 overflow-auto">
        <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre">{error}</p>
      </div>}
      <div className="flex items-center gap-2">
        <span className="text-sm text-main-500 dark:text-main-400">UPS: </span>
        <Button className="flex-1 max-h-4 text-sm" active={ups == 2} activeClass="bg-yellow-500 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-500 text-black" onClick={() => setUps(2)}>2</Button>
        <Button className="flex-1 max-h-4 text-sm" active={ups == 5} activeClass="bg-yellow-500 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-500 text-black" onClick={() => setUps(5)}>5</Button>
        <Button className="flex-1 max-h-4 text-sm" active={ups == 10} activeClass="bg-yellow-500 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-500 text-black" onClick={() => setUps(10)}>10</Button>
        <Button className="flex-1 max-h-4 text-sm" active={ups == 20} activeClass="bg-yellow-500 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-500 text-black" onClick={() => setUps(20)}>20</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <CompassCard fdata={formattedData} />
        <LineSensorsCard data={sensorData} fdata={formattedData} />
        <GoalDetectionCard fdata={formattedData} targetGoal={targetGoal} />
        <BallDetectionCard data={sensorData} fdata={formattedData} />
        <MotorsCard data={sensorData} fdata={formattedData} />
        <FieldCard className='col-span-2 row-span-2' data={sensorData} fdata={formattedData} targetGoal={targetGoal} position={position} />
        <HardwareStateCard fdata={formattedData} />
      </div>
    </div>
  );
}

