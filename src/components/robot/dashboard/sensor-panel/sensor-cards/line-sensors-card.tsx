'use client';

import { FormattedSensorData, SensorData } from "@/types/robot";
import { SensorCard } from "./sensor-card";



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
        const divSize = (sensorSize + highlightOutline / 2);
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
              border: detected[i] ? `${highlightOutline}px solid gold` : `${highlightOutline / 2}px solid ${color}`,
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

export const LineSensorsCard: React.FC<{ data: SensorData | null, fdata: FormattedSensorData }> = ({ data, fdata }) => (
  <SensorCard label="Line Sensors (12)">
    <div className="flex-1 flex items-center justify-center">
      <LineSensors
        labels={fdata.line.raw}
        values={data?.line?.raw || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
        detected={data?.line?.detected || new Array(12).fill(false)}
      />
    </div>
  </SensorCard>
);
