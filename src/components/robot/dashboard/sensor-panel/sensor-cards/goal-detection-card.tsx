'use client';


import { FormattedSensorData, GoalDetectionData } from "@/types/robot";
import { SensorCard } from "./sensor-card";


type GoalColor = 'yellow' | 'blue';

const goalBadgeClass = (goalColor: GoalColor) =>
  goalColor === 'yellow' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white';

const formatCameraYaw = (cameraYawDeg: number | null | undefined): string => {
  if (cameraYawDeg === null || cameraYawDeg === undefined) return '---';
  if (cameraYawDeg === 0) return 'Front Camera (0°)';
  if (cameraYawDeg === 180) return 'Back Camera (180°)';
  return `${cameraYawDeg}°`;
};

export const GoalDetectionCard: React.FC<{ targetGoal: string | null, goalDetection: GoalDetectionData | null }> = ({ targetGoal, goalDetection }) => {
  const goalsByColor = goalDetection?.goals_by_color;

  return (
    <SensorCard label="Goal Detection">
      <div className="text-xs flex flex-col gap-1">
        <div className="flex gap-3">
          {(['yellow', 'blue'] as GoalColor[]).map((color) => {
            const goal = goalsByColor?.[color] ?? {
              goal_detected: false,
              alignment: 0,
              goal_center_x: null,
              goal_area: 0,
              distance_mm: null,
              goal_height_pixels: null,
            };
            return (
              <div key={color} className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{color.toUpperCase()} Goal</span>
                  <span className={`px-2 font-bold ${goal.goal_detected ? goalBadgeClass(color) : 'bg-main-300 dark:bg-main-700'}`}>{goal.goal_detected ? 'YES' : 'NO'}</span>
                </div>
                <div className="mt-0.5 pt-1 border-t-2 border-main-400 dark:border-main-700 "></div>
                <div className="flex justify-center">{targetGoal == color ? "Enemy Goal" : "Own Goal"}</div>
                <div className="mt-0.5 pt-1 border-t-1 border-main-400 dark:border-main-700 "></div>
                <div className="flex justify-between">
                  <span>Alignment:</span>
                  <span className="font-mono text-green-800 dark:text-green-500">{`${(goal.alignment * 100).toFixed(1)}%`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Center X:</span>
                  <span className="font-mono text-green-800 dark:text-green-500">{goal.goal_center_x !== null ? `${goal.goal_center_x.toFixed(0)}px` : '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Area:</span>
                  <span className="font-mono text-green-800 dark:text-green-500">{`${goal.goal_area.toFixed(0)}px²`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Height:</span>
                  <span className="font-mono text-green-800 dark:text-green-500">{goal.goal_height_pixels !== null ? `${goal.goal_height_pixels.toFixed(0)}px` : '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-mono text-green-500">{goal.distance_mm !== null ? `${goal.distance_mm.toFixed(0)}mm` : '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Camera:</span>
                  <span className="font-mono text-green-500">{goal.goal_detected ? formatCameraYaw(goal.camera_yaw_deg ?? goalDetection?.camera_yaw_deg) : '---'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SensorCard>
  );
};
