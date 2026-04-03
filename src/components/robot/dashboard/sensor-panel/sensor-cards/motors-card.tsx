'use client';

import { FormattedSensorData } from '@/types/robot';
import { SensorCard, SensorProperty, AngleIndicator } from './sensor-card';


const MotorVisualizer: React.FC<{ speeds: number[] }> = ({ speeds }) => {
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


export const MotorsCard: React.FC<{ fdata: FormattedSensorData }> = ({ fdata }) => (
  <SensorCard label="Motors">
    <div className="relative grid grid-cols-2 gap-y-2 gap-x-12">
      {[0, 1, 2, 3].map((i) => (
        <SensorProperty
          key={i}
          label={`M${i}`}
          value={fdata.motors[i]}
        />
      ))}
      <div className="flex items-center justify-center absolute inset-0 pointer-events-none">
        <div className="outline-2 outline-main-500 dark:outline-main-500 hover:outline-main-400 hover:dark:outline-main-400 bg-main-200 dark:bg-main-900 pointer-events-auto p-2">
          <MotorVisualizer speeds={Object.values(fdata.motors).map(Number)} />
        </div>
      </div>
    </div>
  </SensorCard>
);
