/**
 * Settings component with tab-based Motor and Autonomous settings
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MotorSettingsMenu } from './motor-settings-menu';
import { AutonomousSettingsMenu } from './autonomous-settings-menu';

type SettingsTab = 'motor' | 'autonomous';

export const SettingsComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('motor');

  return (
    <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2">
      <h3 className="text-xs font-bold text-main-900 dark:text-white uppercase mb-2">Settings</h3>
      
      {/* Tab Buttons */}
      <div className="flex gap-1">
        <Button
          onClick={() => setActiveTab('motor')}
          active={activeTab === 'motor'}
          className="flex-1"
        >
          Motor
        </Button>
        <Button
          onClick={() => setActiveTab('autonomous')}
          active={activeTab === 'autonomous'}
          className="flex-1"
        >
          Autonomous
        </Button>
      </div>

      {/* Tab Content */}
      <div className="bg-main-100 dark:bg-main-950 border-2 border-main-900 dark:border-main-200">
        {activeTab === 'motor' && <MotorSettingsMenu />}
        {activeTab === 'autonomous' && <AutonomousSettingsMenu />}
      </div>
    </div>
  );
};
