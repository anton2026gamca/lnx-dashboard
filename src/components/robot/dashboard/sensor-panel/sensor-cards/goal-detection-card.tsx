'use client';


import { FormattedSensorData } from "@/types/robot";
import { SensorCard } from "./sensor-card";


export const GoalDetectionCard: React.FC<{ fdata: FormattedSensorData, targetGoal: string | null }> = ({ fdata, targetGoal }) => (
  <SensorCard label="Goal Detection">
    <div className="text-xs flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span>Target Goal:</span>
        <span className={`px-2 font-bold ${
          targetGoal === 'yellow'
            ? 'bg-yellow-500 text-black'
            : targetGoal === 'blue' ? 'bg-blue-500 text-white' : 'bg-main-700 text-main-400'
        }`}>
          {targetGoal?.toUpperCase() || 'N/A'}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span>Detected:</span>
        <div className={`px-2 font-bold ${
          fdata?.goal.detected 
            ? 'bg-green-600 text-white' 
            : 'bg-main-700 text-white dark:text-main-400'
        }`}>
          {fdata?.goal.detected ? 'YES' : 'NO'}
        </div>
      </div>
      <div className="flex justify-between pt-1 border-t border-main-400 dark:border-main-700">
        <span>Alignment:</span>
        <span className="font-mono text-green-800 dark:text-green-500">{fdata.goal.alignment}</span>
      </div>
      <div className="flex justify-between">
        <span>Center X:</span>
        <span className="font-mono text-green-800 dark:text-green-500">{fdata.goal.center_x}</span>
      </div>
      <div className="flex justify-between">
        <span>Area:</span>
        <span className="font-mono text-green-800 dark:text-green-500">{fdata.goal.area}</span>
      </div>
      <div className="flex justify-between">
        <span>Height:</span>
        <span className="font-mono text-green-800 dark:text-green-500">{fdata.goal.height}</span>
      </div>
      <div className="flex justify-between pt-1 border-t border-main-400 dark:border-main-700">
        <span>Distance:</span>
        <span className="font-mono text-blue-500">{fdata.goal.distance}</span>
      </div>
    </div>
  </SensorCard>
);
