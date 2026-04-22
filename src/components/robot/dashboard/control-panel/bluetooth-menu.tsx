/**
 * Bluetooth settings menu
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useBluetooth } from '@/hooks/useRobot';
import { useRobot } from '@/context/RobotContext';
import { cn } from '@/lib/utils';
import { BluetoothAdvancedModal } from './bluetooth-advanced-modal';

export const BluetoothMenu: React.FC = () => {
  const { state, loading, working, error, refresh } = useBluetooth();
  const { connectionState } = useRobot();

  const [advancedOpenRobotId, setAdvancedOpenRobotId] = useState<string | null>(null);
  const currentRobotId = connectionState.activeRobotId;
  const isAdvancedOpen = Boolean(currentRobotId && advancedOpenRobotId === currentRobotId);

  const selectedOtherMac = state?.other_robot?.mac_address || '';
  const hasSelectedOther = Boolean(selectedOtherMac);

  const otherRobotConnected = Boolean(
    selectedOtherMac && state?.connected_devices?.some((device) => device.mac_address === selectedOtherMac && device.is_connected),
  );
  const otherStatus = !selectedOtherMac ? 'not set' : otherRobotConnected ? 'connected' : 'disconnected';

  return (
    <>
      <div className="text-xs p-1 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 space-y-0.5 flex gap-3">
            <div className="flex items-center gap-1">
              <span className={cn('inline-block w-2.5 h-2.5 border border-main-500 shrink-0', state?.process_alive ? 'bg-green-500' : 'bg-red-500')} />
              <span className="uppercase font-bold text-main-900 dark:text-main-100">Bluetooth service</span>
              <span
                className={cn(
                  'uppercase border px-1 text-[10px] font-bold',
                  state?.process_alive
                    ? 'border-green-600 text-green-700 dark:text-green-400'
                    : 'border-red-600 text-red-700 dark:text-red-400',
                )}
              >
                {state?.process_alive ? 'up' : 'down'}
              </span>
            </div>
            <div className="text-main-600 dark:text-main-400 truncate">
              Host: {state?.local_device?.hostname || '-'}
            </div>
          </div>

          <div className="flex gap-0.5 shrink-0">
            <Button active={false} onClick={() => refresh()} disabled={loading || working}>
              Refresh
            </Button>
            <Button onClick={() => setAdvancedOpenRobotId(currentRobotId)}>
              Advanced
            </Button>
          </div>
        </div>

        {error && (
          <div className="border-2 border-red-500 text-red-700 dark:text-red-300 px-1 py-0.5 bg-red-50/40 dark:bg-red-950/20">
            {error}
          </div>
        )}

        <div className="border-2 border-main-400 dark:border-main-700 bg-main-100 dark:bg-main-950 px-1 py-0.5 space-y-1 flex justify-between">
          <div className="flex gap-3 m-0">
            <div className="flex items-center justify-between gap-1">
              <div className="uppercase font-bold text-main-900 dark:text-main-100">Teammate robot</div>
            </div>

            <div className="truncate">
              <span className="text-main-500 dark:text-main-400">Name:</span> {state?.other_robot?.name || '-'}
            </div>
            <div className="truncate">
              <span className="text-main-500 dark:text-main-400">MAC:</span> {selectedOtherMac || '-'}
            </div>
          </div>

          <span
            className={cn(
              'uppercase border px-1',
              !hasSelectedOther
                ? 'border-main-500 text-main-600 dark:text-main-400'
                : otherRobotConnected
                  ? 'border-green-600 text-green-700 dark:text-green-400'
                  : 'border-yellow-600 text-yellow-700 dark:text-yellow-400',
            )}
          >
            {otherStatus}
          </span>
        </div>
      </div>

      <BluetoothAdvancedModal
        isOpen={isAdvancedOpen}
        onClose={() => setAdvancedOpenRobotId(null)}
      />
    </>
  );
};
