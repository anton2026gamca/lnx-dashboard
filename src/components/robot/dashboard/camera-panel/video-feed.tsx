'use client';

import React, { useEffect, useState } from 'react';
import { useVideoStream, useFrameDataUrl } from '@/hooks/useRobot';
import { VideoFeedSettings } from './video-feed-settings';
import { useVideoStreamRefresh } from '@/context/VideoStreamContext';

export const VideoFeed: React.FC<{ forceEnabled?: boolean, forceFPS?: number }> = ({ forceEnabled = false, forceFPS = undefined }) => {
  const [videoEnabled, setVideoEnabledState] = useState(true);
  const [fps, setFpsState] = useState(forceFPS !== undefined ? forceFPS : 5);
  const { videoRefreshKey } = useVideoStreamRefresh();

  useEffect(() => {
    if (forceEnabled === true) {
      setVideoEnabledState(true);
    }
  }, [forceEnabled]);

  useEffect(() => {
    if (forceFPS !== undefined) {
      setFpsState(forceFPS);
    }
  }, [forceFPS]);

  const setVideoEnabled = (val: boolean) => {
    if (forceEnabled !== true) {
      setVideoEnabledState(val);
    }
  };

  const setFps = (val: number) => {
    if (forceFPS === undefined) {
      setFpsState(val);
    }
  };

  const { frame, refresh } = useVideoStream(videoEnabled, fps, true);
  const frameUrl = useFrameDataUrl(frame);

  useEffect(() => {
    if (videoEnabled) {
      refresh();
    }
  }, [videoRefreshKey]);

  return (
    <div>
      <VideoFeedSettings
        fps={fps}
        videoEnabled={videoEnabled}
        setFps={setFps}
        setVideoEnabled={setVideoEnabled}
        refresh={refresh}
        forceEnabled={forceEnabled}
        forceFPS={forceFPS}
      />

      {videoEnabled && frameUrl ? (
        <div className="bg-main-950 dark:bg-black shadow-sm aspect-video">
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
