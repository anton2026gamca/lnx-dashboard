'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useVideoStream, useFrameDataUrl } from '@/hooks/useRobot';
import { VideoFeedSettings } from './video-feed-settings';
import { useVideoStreamRefresh } from '@/context/VideoStreamContext';
import { robotClient } from '@/lib/robotAPIClient';
import type { DetectedObject } from '@/types/robot';



const drawDetectionsOnCanvas = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  detections: DetectedObject[],
) => {
  const rect = image.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  if (!naturalWidth || !naturalHeight) {
    return;
  }

  const imageAspect = naturalWidth / naturalHeight;
  const boxAspect = rect.width / rect.height;

  let drawnWidth = rect.width;
  let drawnHeight = rect.height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageAspect > boxAspect) {
    drawnHeight = rect.width / imageAspect;
    offsetY = (rect.height - drawnHeight) / 2;
  } else {
    drawnWidth = rect.height * imageAspect;
    offsetX = (rect.width - drawnWidth) / 2;
  }

  for (const detection of detections) {
    const normalized =
      detection.x <= 1 &&
      detection.y <= 1 &&
      detection.width <= 1 &&
      detection.height <= 1;

    const x = normalized
      ? offsetX + detection.x * drawnWidth
      : offsetX + (detection.x / naturalWidth) * drawnWidth;
    const y = normalized
      ? offsetY + detection.y * drawnHeight
      : offsetY + (detection.y / naturalHeight) * drawnHeight;
    const width = normalized
      ? detection.width * drawnWidth
      : (detection.width / naturalWidth) * drawnWidth;
    const height = normalized
      ? detection.height * drawnHeight
      : (detection.height / naturalHeight) * drawnHeight;

    const [b, g, r] = detection.color || [0, 255, 0];
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const color = `rgb(${r}, ${g}, ${b})`;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    const label = `${detection.object_type}`;
    ctx.font = '12px monospace';
    const labelWidth = ctx.measureText(label).width + 8;
    const labelHeight = 16;

    ctx.fillStyle = color;
    ctx.fillRect(x, Math.max(0, y - labelHeight), labelWidth, labelHeight);
    ctx.fillStyle = brightness >= 64 ? '#000' : '#fff';
    ctx.fillText(label, x + 4, Math.max(12, y - 4));
  }
};

const FrameWithOverlay: React.FC<{
  frameUrl: string;
  alt: string;
  detections: DetectedObject[];
  showOverlay: boolean;
  className?: string;
}> = ({ frameUrl, alt, detections, showOverlay, className }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showOverlay) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !frameUrl) {
      return;
    }

    const render = () => drawDetectionsOnCanvas(canvas, image, detections);
    render();

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(image);
    window.addEventListener('resize', render);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', render);
    };
  }, [frameUrl, detections, showOverlay]);

  return (
    <div className={`relative ${className || ''}`}>
      <img
        ref={imageRef}
        src={frameUrl}
        alt={alt}
        className="w-full h-full object-contain"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
};

export const VideoFeed: React.FC<{ forceEnabled?: boolean, forceFPS?: number }> = ({ forceEnabled = false, forceFPS = undefined }) => {
  const [videoEnabled, setVideoEnabledState] = useState(true);
  const [fps, setFpsState] = useState(forceFPS !== undefined ? forceFPS : 5);
  const [viewMode, setViewMode] = useState<'single' | 'both'>('single');
  const [singleCamera, setSingleCamera] = useState<'front' | 'back'>('front');
  const [frontDetections, setFrontDetections] = useState<DetectedObject[]>([]);
  const [backDetections, setBackDetections] = useState<DetectedObject[]>([]);
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

  const activeCamera = viewMode === 'both' ? 'both' : singleCamera;
  const { frame, frontFrame, backFrame, refresh } = useVideoStream(videoEnabled, fps, false, activeCamera);
  const frameUrl = useFrameDataUrl(frame);
  const frontFrameUrl = useFrameDataUrl(frontFrame);
  const backFrameUrl = useFrameDataUrl(backFrame);

  const frontCameraVisible = videoEnabled && (viewMode === 'both' || singleCamera === 'front');
  const backCameraVisible = videoEnabled && (viewMode === 'both' || singleCamera === 'back');

  useEffect(() => {
    if (videoEnabled) {
      refresh();
    }
  }, [videoRefreshKey, videoEnabled, refresh]);

  useEffect(() => {
    if (!frontCameraVisible && !backCameraVisible) {
      return;
    }

    let cancelled = false;

    const fetchDetections = async () => {
      try {
        const result = await robotClient.getDetections(activeCamera);
        if (!cancelled) {
          setFrontDetections(result?.detections.front ?? []);
          setBackDetections(result?.detections.back ?? []);
        }
      } catch {
        if (!cancelled) {
          setFrontDetections([]);
          setBackDetections([]);
        }
      }
    };

    fetchDetections();
    const intervalMs = Math.max(100, Math.floor(1000 / Math.max(1, fps)));
    const timer = setInterval(fetchDetections, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [frontCameraVisible, backCameraVisible, activeCamera, fps]);

  return (
    <div>
      <VideoFeedSettings
        fps={fps}
        videoEnabled={videoEnabled}
        setFps={setFps}
        setVideoEnabled={setVideoEnabled}
        viewMode={viewMode}
        setViewMode={setViewMode}
        singleCamera={singleCamera}
        setSingleCamera={setSingleCamera}
        refresh={refresh}
        forceEnabled={forceEnabled}
        forceFPS={forceFPS}
      />

      {!videoEnabled ? (
        <div className="flex items-center justify-center p-5">
          <p className="text-main-400">Video Disabled</p>
        </div>
      ) : viewMode === 'both' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <div className="bg-main-950 dark:bg-black shadow-sm">
            <div className="text-xs px-1 py-0.5 text-main-200 bg-main-800 dark:bg-main-900">Front camera</div>
            {frontFrameUrl ? (
              <FrameWithOverlay
                frameUrl={frontFrameUrl}
                alt="Front Camera Feed"
                detections={frontDetections}
                showOverlay={true}
                className="w-full aspect-video"
              />
            ) : (
              <div className="flex items-center justify-center aspect-video">
                <p className="text-main-400 text-xs">Front feed unavailable</p>
              </div>
            )}
          </div>

          <div className="bg-main-950 dark:bg-black shadow-sm">
            <div className="text-xs px-1 py-0.5 text-main-200 bg-main-800 dark:bg-main-900">Back camera</div>
            {backFrameUrl ? (
              <FrameWithOverlay
                frameUrl={backFrameUrl}
                alt="Back Camera Feed"
                detections={backDetections}
                showOverlay={true}
                className="w-full aspect-video"
              />
            ) : (
              <div className="flex items-center justify-center aspect-video">
                <p className="text-main-400 text-xs">Back feed unavailable</p>
              </div>
            )}
          </div>
        </div>
      ) : frameUrl ? (
        <div className="bg-main-950 dark:bg-black shadow-sm aspect-video">
          <FrameWithOverlay
            frameUrl={frameUrl}
            alt={`${singleCamera === 'front' ? 'Front' : 'Back'} Camera Feed`}
            detections={singleCamera === 'front' ? frontDetections : backDetections}
            showOverlay={true}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center aspect-video">
          <p className="text-main-400">Camera feed unavailable</p>
        </div>
      )}
    </div>
  );
};
