'use client';

import React, { useState } from 'react';
import { useVideoStream, useFrameDataUrl } from '@/hooks/useRobot';
import { Button } from '@/components/ui/button';


export const CameraPanel: React.FC = () => {
  const [fps, setFps] = useState(5);
  const [videoEnabled, setVideoEnabled] = useState(true);
  
  const { frame } = useVideoStream(videoEnabled, fps, true);
  const frameUrl = useFrameDataUrl(frame);

  return (
    <div>
      <div className="bg-white dark:bg-main-950 p-1 flex gap-2 items-center">
        <Button
          onClick={() => setVideoEnabled(!videoEnabled)}
          activeClass={`${videoEnabled ? 'bg-lime-600' : 'bg-main-900'} hover:${videoEnabled ? 'bg-lime-700' : 'bg-main-800'} text-white`}
          active={true}
          className="px-1 text-sm font-medium flex-1 max-h-4"
        >{`Video: ${videoEnabled ? 'ON' : 'OFF'}`}</Button>

        <span className="text-sm text-main-500 dark:text-main-400 ml-3 max-h-4 flex items-center">FPS:</span>
        {[5, 15, 30, 60].map((f, i) => (
          <Button key={i}
            onClick={() => setFps(f)}
            activeClass='bg-yellow-500 hover:bg-yellow-600 text-black'
            active={fps === f}
            className="px-1 text-sm font-medium flex-1 max-h-4"
          >{f.toString()}</Button>
        ))}
      </div>

      {videoEnabled && frameUrl ? (
        <div className="bg-black shadow-sm aspect-video">
          <img src={frameUrl} alt="Camera Feed" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="flex items-center justify-center aspect-video">
          <p className="text-main-400">Video Disabled</p>
        </div>
      )}
    </div>
  );
};
