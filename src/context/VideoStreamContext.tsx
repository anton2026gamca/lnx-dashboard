/**
 * Video Stream Context for managing global video stream state
 */

'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';

interface VideoStreamContextType {
  forceRefresh: () => void;
  videoRefreshKey: number;
}

const VideoStreamContext = createContext<VideoStreamContextType | undefined>(undefined);

export const VideoStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videoRefreshKey, setVideoRefreshKey] = useState(0);

  const forceRefresh = useCallback(() => {
    setVideoRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <VideoStreamContext.Provider value={{ forceRefresh, videoRefreshKey }}>
      {children}
    </VideoStreamContext.Provider>
  );
};

export const useVideoStreamRefresh = () => {
  const context = useContext(VideoStreamContext);
  if (!context) {
    throw new Error('useVideoStreamRefresh must be used within VideoStreamProvider');
  }
  return context;
};
