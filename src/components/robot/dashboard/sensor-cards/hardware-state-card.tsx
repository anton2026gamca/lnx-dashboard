'use client';


import { FormattedSensorData } from "@/types/robot";
import { SensorCard } from "./sensor-card";


interface RunningStateVisualizerProps {
  running: boolean;
  btModuleEnabled: boolean;
  btModuleState: boolean;
  switchState: boolean;
}

const RunningStateVisualizer: React.FC<RunningStateVisualizerProps> = ({
  running,
  btModuleEnabled,
  btModuleState,
  switchState,
}) => {
  const StatusIndicator: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
    <div className="flex items-center gap-1 text-xs">
      <div className={`w-3 h-3 rounded-full mr-1 ${active ? 'bg-green-500' : 'bg-main-600'}`} />
      <span className={active ? 'text-green-500' : 'text-main-500'}>{label}</span>
    </div>
  );

  return (
    <div className="space-y-1 text-xs font-mono">
      <div className={`flex items-center gap-2 p-1 ${running ? 'bg-green-900 text-green-200' : 'bg-main-800 text-main-500'}`}>
        <span>{running ? 'ENABLED' : 'DISABLED'}</span>
      </div>
      
      <div className="space-y-1 pl-2 border-main-700">
        <StatusIndicator label="BT Module Enabled" active={btModuleEnabled} />
        <StatusIndicator label="BT Module State" active={btModuleState} />
        <StatusIndicator label="Switch State" active={switchState} />
      </div>
    </div>
  );
};


export const HardwareStateCard: React.FC<{ fdata: FormattedSensorData }> = ({ fdata }) => (
  <SensorCard label="Hardware Enabled State">
    <RunningStateVisualizer 
      running={fdata.running_state.running}
      btModuleEnabled={fdata.running_state.bt_module_enabled}
      btModuleState={fdata.running_state.bt_module_state}
      switchState={fdata.running_state.switch_state}
    />
  </SensorCard>
);
