/**
 * Main Calibration Menu - The entry point for all calibration subsystems
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { LineCalibrationModal } from './subsystems/line-calibration-modal';
import { GoalColorCalibrationModal } from './subsystems/goal-color-calibration-modal';
import { BallColorCalibrationModal } from './subsystems/ball-color-calibration-modal';
import { CameraBallDistanceCalibrationModal } from './subsystems/camera-call-distance-calibration-modal';
import { GoalDistanceCalibrationModal } from './subsystems/goal-distance-calibration-modal';
import { ResetCompassModal } from './subsystems/reset-compass-modal';
import { useMotorSettings, useRobotMode } from '@/hooks/useRobot';
import { useVideoStreamRefresh } from '@/context/VideoStreamContext';

interface CalibrationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveModal = null | 'line' | 'goalColors' | 'ballColor' | 'ballDistance' | 'goalDistance' | 'resetCompass';

export const CalibrationMenu: React.FC<CalibrationMenuProps> = ({ isOpen, onClose }) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const { changeMode } = useRobotMode();
  const { updateSetting } = useMotorSettings();
  const { forceRefresh } = useVideoStreamRefresh();

  const handleSubsystemOpen = (modal: ActiveModal) => {
    setActiveModal(modal);
  };

  const handleSubsystemClose = () => {
    setActiveModal(null);
  };

  const handleClose = () => {
    setActiveModal(null);
    forceRefresh();
    onClose();
  }

  useEffect(() => {
    if (isOpen) {
      changeMode('idle');
    } else {
      setActiveModal(null);
    }
  }, [isOpen])

  useEffect(() => {
    if (activeModal === 'line') {
      updateSetting('line_avoiding_enabled', false);
    }
  }, [activeModal]);

  return (
    <Modal
      title="Calibration"
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
      className="max-w-5xl"
    >
      {activeModal === null ? (
        <div className="space-y-4">
          <p className="text-xs text-main-600 dark:text-main-400">
            Select a calibration subsystem:
          </p>

          {/* Line Sensors */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-main-900 dark:text-main-100 px-1">Line Detection</h3>
            <div className="space-y-1 pt-2 border-t-2 border-main-300 dark:border-main-700">
              <Button
                onClick={() => handleSubsystemOpen('line')}
                className="w-full text-center text-xs"
              >
                Line Sensors
              </Button>
            </div>
          </div>

          {/* Ball Detection */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-main-900 dark:text-main-100 px-1">Ball Detection</h3>
            <div className="space-y-1 pt-2 border-t-2 border-main-300 dark:border-main-700">
              <Button
                onClick={() => handleSubsystemOpen('ballColor')}
                className="w-full text-center text-xs"
              >
                Ball Color
              </Button>
              <Button
                onClick={() => handleSubsystemOpen('ballDistance')}
                className="w-full text-center text-xs"
              >
                Ball Distance
              </Button>
            </div>
          </div>

          {/* Goal Detection */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-main-900 dark:text-main-100 px-1">Goal Detection</h3>
            <div className="space-y-1 pt-2 border-t-2 border-main-300 dark:border-main-700">
              <Button
                onClick={() => handleSubsystemOpen('goalColors')}
                className="w-full text-center text-xs"
              >
                Goal Colors
              </Button>
              <Button
                onClick={() => handleSubsystemOpen('goalDistance')}
                className="w-full text-center text-xs"
              >
                Goal Distance
              </Button>
            </div>
          </div>

          {/* Orientation */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-main-900 dark:text-main-100 px-1">Orientation</h3>
            <div className="space-y-1 pt-2 border-t-2 border-main-300 dark:border-main-700">
              <Button
                onClick={() => handleSubsystemOpen('resetCompass')}
                className="w-full text-center text-xs"
              >
                Reset Compass
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {activeModal === 'line' && (
            <LineCalibrationModal onClose={handleSubsystemClose} />
          )}
          {activeModal === 'goalColors' && (
            <GoalColorCalibrationModal onClose={handleSubsystemClose} />
          )}
          {activeModal === 'ballColor' && (
            <BallColorCalibrationModal onClose={handleSubsystemClose} />
          )}
          {activeModal === 'ballDistance' && (
            <CameraBallDistanceCalibrationModal onClose={handleSubsystemClose} />
          )}
          {activeModal === 'goalDistance' && (
            <GoalDistanceCalibrationModal onClose={handleSubsystemClose} />
          )}
          {activeModal === 'resetCompass' && (
            <ResetCompassModal onClose={handleSubsystemClose} />
          )}
          <div className="mt-4 pt-3 border-t border-main-300 dark:border-main-800">
            <Button
              onClick={handleSubsystemClose}
              className="w-full text-xs"
            >
              Back to Menu
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};
