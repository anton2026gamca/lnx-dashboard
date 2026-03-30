/**
 * Manual movement component with control info and keyboard binding
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRobotMode } from '@/hooks/useRobot';
import { robotClient } from '@/lib/robotAPIClient';

export const ManualMovementComponent: React.FC = () => {
  const { mode } = useRobotMode();
  const [keyPressed, setKeyPressed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (mode !== 'manual') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        setKeyPressed(prev => new Set(prev).add(key));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        const newSet = new Set(keyPressed);
        newSet.delete(key);
        setKeyPressed(newSet);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, keyPressed]);

  useEffect(() => {
    if (mode !== 'manual' || keyPressed.size === 0) return;

    let angle = 0;
    let speed = 0;
    let rotate = 0;

    if (keyPressed.has('w')) speed = 100;
    if (keyPressed.has('s')) speed = -100;
    if (keyPressed.has('a')) angle = 90;
    if (keyPressed.has('d')) angle = -90;
    if (keyPressed.has('arrowleft')) rotate = 50;
    if (keyPressed.has('arrowright')) rotate = -50;

    robotClient.setManualControl(angle, speed, rotate).catch(err => {
      console.error('Failed to send manual control:', err);
    });
  }, [keyPressed, mode]);

  if (mode !== 'manual') {
    return (
      <div className="bg-main-950 border-2 border-main-800 p-2 rounded flex-1 flex items-center justify-center text-center">
        <div className="text-xs text-main-500">
          Switch to <span className="font-bold text-yellow-400">Manual Mode</span> to use keyboard controls
        </div>
      </div>
    );
  }

  return (
    <div className="bg-main-950 border-2 border-green-700 p-2 rounded flex flex-col items-center justify-center">
      <div className="text-xs font-bold text-green-200 uppercase mb-2">Manual Control Active</div>
      <div className="text-xs text-green-300 space-y-1 font-mono">
        <div>W/S - Forward/Backward</div>
        <div>A/D - Strafe Left/Right</div>
        <div>← / → - Rotate</div>
      </div>
    </div>
  );
};
