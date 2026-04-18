/**
 * Manual movement component with control info and keyboard binding
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRobotMode } from '@/hooks/useRobot';
import { robotClient } from '@/lib/robotAPIClient';

export const ManualMovementComponent: React.FC<{compact?: boolean}> = ({compact = false}) => {
  const { mode, changeMode } = useRobotMode();
  const [keyPressed, setKeyPressed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === ' ' && (mode === 'manual' || mode === 'autonomous')) {
        e.preventDefault();
        changeMode('idle').catch(err => {
          console.error('Failed to change mode to idle:', err);
        });
        return;
      }
      
      if (mode !== 'manual') return;
      
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
  }, [mode, keyPressed, changeMode]);

  useEffect(() => {
    if (mode !== 'manual') return;

    let angle = null;
    let speed = 0.7;
    let rotate = 0;

    if (keyPressed.has('w') && keyPressed.has('a')) angle = -45;
    else if (keyPressed.has('w') && keyPressed.has('d')) angle = 45;
    else if (keyPressed.has('s') && keyPressed.has('a')) angle = -135;
    else if (keyPressed.has('s') && keyPressed.has('d')) angle = 135;
    else if (keyPressed.has('w')) angle = 0;
    else if (keyPressed.has('s')) angle = 180;
    else if (keyPressed.has('a')) angle = -90;
    else if (keyPressed.has('d')) angle = 90;
    if (keyPressed.has('arrowleft')) rotate = -0.8;
    if (keyPressed.has('arrowright')) rotate = 0.8;

    robotClient.setManualControl(angle ?? 0, angle != null ? speed : 0, rotate).catch(err => {
      console.error('Failed to send manual control:', err);
    });
  }, [keyPressed, mode]);

  if (mode !== 'manual') {
    return (
      <div className="bg-main-100 dark:bg-main-950 border-2 border-main-300 dark:border-main-800 p-2 flex-1 flex items-center justify-center text-center text-xs flex flex-col gap-1">
        <div className="text-main-600 dark:text-main-500">
          Switch to <span className="font-bold text-yellow-600 dark:text-yellow-400">Manual Mode</span> to use keyboard controls
        </div>
        {mode !== 'idle' && (
          <div className="text-green-700 dark:text-green-300"><span className="text-yellow-600 dark:text-yellow-400 font-bold">SPACE</span>: Emergency Stop (Idle)</div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-main-100 dark:bg-main-950 border-2 border-green-500 dark:border-green-700 p-2 flex flex-col items-center justify-center h-full">
      <div className="text-xs font-bold text-green-800 dark:text-green-200 uppercase">Manual Control Active</div>
      {!compact && <div className="text-xs text-green-700 dark:text-green-300 space-y-1 font-mono mt-2 flex gap-5">
        <span><span className="text-yellow-600 dark:text-yellow-400 font-bold">WASD</span>: Movement</span>
        <span><span className="text-yellow-600 dark:text-yellow-400 font-bold">← / →</span>: Rotate</span>
        <span><span className="text-yellow-600 dark:text-yellow-400 font-bold">SPACE</span>: Emergency Stop (Idle)</span>
      </div>}
    </div>
  );
};
