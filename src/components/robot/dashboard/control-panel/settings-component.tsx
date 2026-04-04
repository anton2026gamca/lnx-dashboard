/**
 * Settings component with tab-based Motor and Autonomous settings
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MotorSettingsMenu } from './motor-settings-menu';
import { AutonomousSettingsMenu } from './autonomous-settings-menu';

type SettingsTab = 'motor' | 'autonomous' | '';

export const SettingsComponent: React.FC<{ hideMotor?: boolean, hideAutonomous?: boolean, hideTabBar?: boolean }> = ({ hideMotor = false, hideAutonomous = false, hideTabBar = false }) => {
  const showMotor = !hideMotor;
  const showAutonomous = !hideAutonomous;

  const [activeTab, setActiveTab] = useState<SettingsTab>(showMotor ? 'motor' : showAutonomous ? 'autonomous' : '');

  if (!showMotor && !showAutonomous) return null;

  const onlyOneTab = (showMotor && !showAutonomous) || (!showMotor && showAutonomous);

  return (
    <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2">
      <h3 className="text-xs font-bold text-main-900 dark:text-white uppercase mb-2">{onlyOneTab ? `${activeTab} settings` : 'Settings'}</h3>
      {/* Tab Buttons */}
      {!hideTabBar && (
        <div className="flex gap-1">
          {showMotor && (
            <Button
              onClick={() => setActiveTab('motor')}
              active={activeTab === 'motor'}
              className="flex-1"
              activeClass="hover:bg-main-900 dark:hover:bg-main-200"
            >
              Motor
            </Button>
          )}
          {showAutonomous && (
            <Button
              onClick={() => setActiveTab('autonomous')}
              active={activeTab === 'autonomous'}
              className="flex-1"
            >
              Autonomous
            </Button>
          )}
        </div>
      )}
      {/* Tab Content */}
      <div className={`${!hideTabBar ? 'bg-main-100 dark:bg-main-950 border-2 p-2' : 'border-none'} border-main-900 dark:border-main-200`}>
        {onlyOneTab ? (
          showMotor ? <MotorSettingsMenu /> : <AutonomousSettingsMenu />
        ) : (
          <>
            {showMotor && activeTab === 'motor' && <MotorSettingsMenu />}
            {showAutonomous && activeTab === 'autonomous' && <AutonomousSettingsMenu />}
          </>
        )}
      </div>
    </div>
  );
};
