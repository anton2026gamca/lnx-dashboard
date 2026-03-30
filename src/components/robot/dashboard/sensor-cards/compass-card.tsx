'use client';


import { FormattedSensorData } from '@/types/robot';
import { SensorCard, SensorProperty } from './sensor-card';
import { robotClient } from '@/lib/robotAPIClient';
import { Button } from '@/components/ui/button';


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


export const CompassCard: React.FC<{fdata: FormattedSensorData}> = ({ fdata }) => (
  <SensorCard label="Compass">
    <div className="flex-1 flex flex-col justify-center">
      <Compass
        heading={fdata.compass.heading
          ? parseFloat(fdata.compass.heading.toString())
          : 0}
      />
    </div>
    <div className="flex items-center gap-3 m-1">
      <SensorProperty
        label="Heading"
        value={fdata.compass.heading || "---"}
      />
      <SensorProperty
        label="Pitch"
        value={fdata.compass.pitch || "---"}
      />
      <SensorProperty
        label="Roll"
        value={fdata.compass.roll || "---"}
      />
    </div>
    <Button className="absolute top-2 right-2 px-1 text-xs" onClick={() => robotClient.resetCompass()}>Reset</Button>
  </SensorCard>
);
