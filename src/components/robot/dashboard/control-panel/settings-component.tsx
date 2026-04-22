/**
 * Settings component with tab-based Motor and Autonomous settings
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MotorSettingsMenu } from './motor-settings-menu';
import { AutonomousSettingsMenu } from './autonomous-settings-menu';
import { BluetoothMenu } from './bluetooth-menu';

type SettingsTab = 'motor' | 'autonomous' | 'bluetooth' | '';

export const SettingsComponent: React.FC<{ hideMotor?: boolean, hideAutonomous?: boolean, hideBluetooth?: boolean, hideTabBar?: boolean }> = ({ hideMotor = false, hideAutonomous = false, hideBluetooth = false, hideTabBar = false }) => {
  const showMotor = !hideMotor;
  const showAutonomous = !hideAutonomous;
  const showBluetooth = !hideBluetooth;

  const [activeTab, setActiveTab] = useState<SettingsTab>(showMotor ? 'motor' : showAutonomous ? 'autonomous' : showBluetooth ? 'bluetooth' : '');

  if (!showMotor && !showAutonomous && !showBluetooth) return null;

  const onlyOneTab = [showMotor, showAutonomous, showBluetooth].filter(Boolean).length === 1;

  return (
    <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-1">
      <h3 className="text-xs font-bold text-main-900 dark:text-white uppercase mb-1">{onlyOneTab ? `${activeTab} settings` : 'Settings'}</h3>
      {/* Tab Buttons */}
      {!hideTabBar && (
        <div className="flex gap-0.5">
          {showMotor && (
            <Button
              onClick={() => setActiveTab('motor')}
              active={activeTab === 'motor'}
              className="flex-1 px-1 py-0.5"
              activeClass="hover:bg-main-900 dark:hover:bg-main-200"
            >
              Motor
            </Button>
          )}
          {showAutonomous && (
            <Button
              onClick={() => setActiveTab('autonomous')}
              active={activeTab === 'autonomous'}
              className="flex-1 px-1 py-0.5"
            >
              Autonomous
            </Button>
          )}
          {showBluetooth && (
            <Button
              onClick={() => setActiveTab('bluetooth')}
              active={activeTab === 'bluetooth'}
              className="flex-1 px-1 py-0.5"
            >
              Bluetooth
            </Button>
          )}
        </div>
      )}
      {/* Tab Content */}
      <div className={`${!hideTabBar ? 'bg-main-100 dark:bg-main-950 border-2 p-0.5' : 'border-none'} border-main-900 dark:border-main-200`}>
        {onlyOneTab ? (
          showMotor ? <MotorSettingsMenu /> : showAutonomous ? <AutonomousSettingsMenu /> : <BluetoothMenu />
        ) : (
          <>
            {showMotor && activeTab === 'motor' && <MotorSettingsMenu />}
            {showAutonomous && activeTab === 'autonomous' && <AutonomousSettingsMenu />}
            {showBluetooth && activeTab === 'bluetooth' && <BluetoothMenu />}
          </>
        )}
      </div>
    </div>
  );
};
