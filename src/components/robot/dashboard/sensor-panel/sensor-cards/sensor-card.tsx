'use client';

import { cn } from "@/lib/utils";


interface SensorCardProps {
  label: string;
  children?: React.ReactNode;
  className?: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({ label, children, className }) => (
  <div className={cn("relative col-span-2 h-full flex flex-col bg-main-100 dark:bg-main-950 p-2 shadow-sm outline-2 dark:outline-main-800 text-sm text-main-800 dark:text-main-400", className)}>
    <h3 className="text-xs font-bold text-main-900 dark:text-white uppercase mb-2">{label}</h3>
    <div className="flex-1 flex flex-col justify-center gap-2">
      {children}
    </div>
  </div>
);


interface SensorPropertyProps {
  label: string;
  value: string;
  inline?: boolean;
  noBorder?: boolean;
  className?: string;
}

export const SensorProperty: React.FC<SensorPropertyProps> = ({ label, value, noBorder, inline, className }) => (
  <div className={cn(
    "flex-1 flex w-full items-center text-xs py-0.5 px-2",
    inline ? "flex-row justify-between gap-2" : "flex-col justify-center",
    !noBorder ? "outline-2 dark:outline-main-700 hover:dark:outline-main-600" : "",
    className
  )}>
    {label}{inline && ":"}
    <div className="text-green-500">{value}</div>
  </div>
)


interface AngleIndicatorProps {
  angle: number;
  enabled: boolean;
  className?: string;
}

export const AngleIndicator: React.FC<AngleIndicatorProps> = ({ angle, enabled, className }) => (
  <div className={cn(`relative w-12 h-12 rounded-full border-2 bg-main-800 ${enabled ? 'border-green-500' : 'border-main-500'}`, className)}>
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
