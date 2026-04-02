'use client';

import { useSensorData, usePositionEstimate, useTargetGoal } from "@/hooks/useRobot";
import { formatSensorData } from "@/lib/robotUtils";
import { CompassCard } from "./sensor-cards/compass-card";
import { LineSensorsCard } from "./sensor-cards/line-sensors-card";
import { GoalDetectionCard } from "./sensor-cards/goal-detection-card";
import { BallDetectionCard } from "./sensor-cards/ball-detection-card";
import { MotorsCard } from "./sensor-cards/motors-card";
import { FieldCard } from "./sensor-cards/field-card";
import { HardwareStateCard } from "./sensor-cards/hardware-state-card";


export const SensorPanel: React.FC = () => {
  const { sensorData } = useSensorData();
  const formattedData = formatSensorData(sensorData);
  const { targetGoal } = useTargetGoal();
  const position = usePositionEstimate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2">
      <CompassCard fdata={formattedData} />
      <LineSensorsCard data={sensorData} fdata={formattedData} />
      <GoalDetectionCard fdata={formattedData} targetGoal={targetGoal} />
      <BallDetectionCard data={sensorData} fdata={formattedData} />
      <MotorsCard fdata={formattedData} />
      <FieldCard className='col-span-2 row-span-2' data={sensorData} fdata={formattedData} targetGoal={targetGoal} position={position} />
      <HardwareStateCard fdata={formattedData} />
    </div>
  );
}

