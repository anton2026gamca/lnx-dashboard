/**
 * Camera Region Drawing Component
 * Allows users to draw regions on a camera image
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVideoStream, useFrameDataUrl } from '@/hooks/useRobot';
import { robotClient } from '@/lib/robotAPIClient';
import { DrawRegion, HSVRange, Region } from '@/types/calibration';
import { HSVPicker } from './HSV-picker';
import { CanvasRegionDrawer } from '@/components/ui/canvas-region-drawer';
import { VideoFeedSettings } from '../dashboard/camera-panel/video-feed-settings';

const RegionListItem: React.FC<{ region: DrawRegion; index: number; onChange: (newVal: HSVRange) => void, onDelete: () => void, onReset: () => void }> = ({ region, index, onChange, onDelete, onReset }) => {
  const [expanded, setExpanded] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [hsvPickerExpanded, setHsvPickerExpanded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const [isShiftOrCtrlPressed, setIsShiftOrCtrlPressed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  useEffect(() => { 
    const imageSize = region.cameraImage?.length || 0;
    setDebugInfo(`Size: ${imageSize > 0 ? (imageSize / 1024).toFixed(1) + 'KB' : 'none'}`);
  }, [region.hsv, region.cameraImage]);

  const getImageCoordinates = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!imageContainerRef.current) return null;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    
    x = Math.max(0, Math.min(containerWidth, x));
    y = Math.max(0, Math.min(containerHeight, y));
    
    if (zoom > 1 && zoomPos) {
      const zoomOriginX = zoomPos.x * containerWidth;
      const zoomOriginY = zoomPos.y * containerHeight;
      
      x = zoomOriginX + (x - zoomOriginX) / zoom;
      y = zoomOriginY + (y - zoomOriginY) / zoom;
    }
    
    return {
      x: x / containerWidth,
      y: y / containerHeight,
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.shiftKey || e.ctrlKey) && !isShiftOrCtrlPressed) {
        setIsShiftOrCtrlPressed(true);
        setZoom(2);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey && !e.ctrlKey) {
        setIsShiftOrCtrlPressed(false);
        setZoom(1);
        setZoomPos(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isShiftOrCtrlPressed]);

  const handleChange = (newHsv: Partial<HSVRange>) => {
    onChange({h_min: newHsv.h_min ?? 0, s_min: newHsv.s_min ?? 0, v_min: newHsv.v_min ?? 0, h_max: newHsv.h_max ?? 255, s_max: newHsv.s_max ?? 255, v_max: newHsv.v_max ?? 255})
  }

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  const canReset = region.originalHsv !== undefined;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getImageCoordinates(e.clientX, e.clientY);
    if (coords && isShiftOrCtrlPressed) {
      setZoomPos(coords);
    }
  };

  const handleMouseLeave = () => {
    if (!isShiftOrCtrlPressed) {
      setZoom(1);
      setZoomPos(null);
    }
  };

  const handleDeleteClick = () => {
    onDelete();
  };

  const handleResetClick = () => {
    onReset();
  };

  return (
    <li className="bg-main-200 dark:bg-main-900 py-0.5">
      <div className="flex items-center justify-between cursor-pointer gap-2" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-2">
          <span className="ml-2 text-main-500">{expanded ? '▼' : '▶'}</span>
          <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
            Region {index + 1}: {region.width}x{region.height} px
          </span>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {canReset && (
            <Button onClick={handleResetClick} className="bg-main-300 hover:bg-blue-300 text-white dark:bg-main-800 dark:hover:bg-blue-700 border-2 border-blue-500 dark:border-blue-500 text-main-800 dark:text-main-200 text-xs py-0 px-2">
              Reset
            </Button>
          )}
          <Button onClick={handleDeleteClick} className="bg-main-300 hover:bg-red-300 text-white dark:bg-main-800 dark:hover:bg-red-700 border-2 border-red-500 dark:border-red-500 text-main-800 dark:text-main-200">
              Delete
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="p-2 space-y-2">
          {region.cameraImage && (
            <div className="bg-main-300 dark:bg-main-800 border border-main-400 dark:border-main-700">
              <div className="flex items-center justify-between cursor-pointer p-1" onClick={() => setImageExpanded((v) => !v)}>
                <span className="text-xs font-bold text-main-700 dark:text-main-300">{imageExpanded ? '▼ Region Image' : '▶ Region Image'}</span>
              </div>
              {imageExpanded && (
                <div className="p-2 relative bg-main-100 dark:bg-main-950 overflow-hidden">
                  <div 
                    ref={imageContainerRef}
                    className="relative inline-block w-full overflow-hidden"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div
                      style={{
                        transform: zoom > 1 && zoomPos
                          ? `scale(${zoom})`
                          : 'scale(1)',
                        transformOrigin: zoomPos ? `${zoomPos.x * 100}% ${zoomPos.y * 100}%` : 'center',
                        transformBox: 'fill-box',
                      }}
                    >
                      <img
                        ref={imageRef}
                        src={region.cameraImage}
                        alt={`Region ${index + 1}`}
                        className="w-full block"
                        onLoad={handleImageLoad}
                      />
                      {imageDimensions && (
                        <svg
                          className="absolute top-0 left-0 w-full h-full"
                          viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <rect
                            x={region.x}
                            y={region.y}
                            width={region.width}
                            height={region.height}
                            stroke="#00ff00"
                            strokeWidth="3"
                            fill="none"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-main-600 dark:text-main-400 bg-main-200 dark:bg-main-900 p-1">
                      {debugInfo}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="bg-main-300 dark:bg-main-800 border border-main-400 dark:border-main-700">
            <div className="flex items-center justify-between cursor-pointer p-1" onClick={() => setHsvPickerExpanded((v) => !v)}>
              <span className="text-xs font-bold text-main-700 dark:text-main-300">{hsvPickerExpanded ? '▼' : '▶'} HSV Picker</span>
            </div>
            {hsvPickerExpanded && (
              <div className="p-2">
                <HSVPicker
                  value={region.hsv}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
};

interface CameraRegionDrawerProps {
  onRegionAdded: (region: DrawRegion) => void;
  onRegionChanged: (index: number, region: DrawRegion | null) => void;
  onClear: () => void;
  regions: DrawRegion[];
  showRegionsOnCanvas?: boolean;
}

export const CameraRegionDrawer: React.FC<CameraRegionDrawerProps> = ({
  onRegionAdded,
  onRegionChanged,
  onClear,
  regions,
  showRegionsOnCanvas = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const [fps, setFps] = useState<number>(15);
  const [zoom, setZoom] = useState(1);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const [isShiftOrCtrlPressed, setIsShiftOrCtrlPressed] = useState(false);

  const { frame, refresh } = useVideoStream(true, fps, false);
  const frameUrl = useFrameDataUrl(frame);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.shiftKey || e.ctrlKey) && !isShiftOrCtrlPressed) {
        setIsShiftOrCtrlPressed(true);
        setZoom(2);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey && !e.ctrlKey) {
        setIsShiftOrCtrlPressed(false);
        setZoom(1);
        setZoomPos(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isShiftOrCtrlPressed]);

  const getImageCoordinates = (clientX: number, clientY: number) => {
    if (!imageContainerRef.current) return null;
    const rect = imageContainerRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    x = Math.max(0, Math.min(rect.width, x));
    y = Math.max(0, Math.min(rect.height, y));
    if (zoom > 1 && zoomPos) {
      const zx = zoomPos.x * rect.width;
      const zy = zoomPos.y * rect.height;
      x = zx + (x - zx) / zoom;
      y = zy + (y - zy) / zoom;
    }
    return { x: x / rect.width, y: y / rect.height };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getImageCoordinates(e.clientX, e.clientY);
    if (coords && isShiftOrCtrlPressed) {
      setZoomPos(coords);
    }
  };

  const handleMouseLeave = () => {
    if (!isShiftOrCtrlPressed) {
      setZoom(1);
      setZoomPos(null);
    }
  };

  const handleAddRegion = async (region: Region, canvas: HTMLCanvasElement | null) => {
    if (!canvas || !imageRef.current) return;

    try {
      setError(null);

      const image = imageRef.current;

      const scaleX = image.naturalWidth / canvas.clientWidth;
      const scaleY = image.naturalHeight / canvas.clientHeight;

      const x = region.x * scaleX;
      const y = region.y * scaleY;
      const width = region.width * scaleX;
      const height = region.height * scaleY;

      if (width < 1 || height < 1) {
        setError('Region too small. Please draw a larger area.');
        return;
      }

      const hsvData = await robotClient.computeHsvFromRegions([
        { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) },
      ]);

      if (hsvData) {
        const cameraImage = frameUrl;
        
        const newRegion: DrawRegion = {
          id: `region-${Date.now()}`,
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
          hsv: {
            h_min: hsvData.lower[0],
            h_max: hsvData.upper[0],
            s_min: hsvData.lower[1],
            s_max: hsvData.upper[1],
            v_min: hsvData.lower[2],
            v_max: hsvData.upper[2],
          },
          originalHsv: {
            h_min: hsvData.lower[0],
            h_max: hsvData.upper[0],
            s_min: hsvData.lower[1],
            s_max: hsvData.upper[1],
            v_min: hsvData.lower[2],
            v_max: hsvData.upper[2],
          },
          cameraImage,
          canvas: {
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height,
          }
        };

        onRegionAdded(newRegion);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add region');
    }
  };

  const handleChangeRegion = (index: number) => (newHsv: HSVRange) => {
    const region = regions[index];
    if (!region) return;
    
    const updatedRegion = {
      ...region,
      hsv: newHsv,
    };
    
    onRegionChanged(index, updatedRegion);
  };

  const handleResetRegion = (index: number) => () => {
    const region = regions[index];
    if (!region || !region.originalHsv) return;
    
    const resetRegion = {
      ...region,
      hsv: region.originalHsv,
    };
    
    onRegionChanged(index, resetRegion);
  };

  const handleDeleteRegion = (index: number) => () => {
    const region = regions[index];
    if (!region) return;
    
    const updatedRegions = [...regions];
    updatedRegions.splice(index, 1);

    onRegionChanged(index, null);
  }

  return (
    <div className="space-y-2">
      <div className="bg-main-200 dark:bg-main-900 border border-main-300 dark:border-main-800 p-2">
        <VideoFeedSettings
          fps={fps}
          setFps={setFps}
          refresh={refresh}
          forceEnabled={true}
        />
        <div 
          ref={imageContainerRef}
          className="relative overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {frameUrl ? (
            <div
              style={{
                transform: zoom > 1 && zoomPos
                  ? `scale(${zoom})`
                  : 'scale(1)',
                transformOrigin: zoomPos ? `${zoomPos.x * 100}% ${zoomPos.y * 100}%` : 'center',
                transformBox: 'fill-box',
              }}
            >
              <img
                ref={imageRef}
                src={frameUrl}
                alt="Camera Feed"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
              <CanvasRegionDrawer
                regions={showRegionsOnCanvas ? regions.map((r) => ({ 
                  x: r.canvas?.x || r.x,
                  y: r.canvas?.y || r.y,
                  width: r.canvas?.width || r.width,
                  height: r.canvas?.height || r.height,
                  color: '#ffffff'
                })) : []}
                onNewRegionFinished={handleAddRegion}
                className="absolute top-0 left-0 w-full h-full"
                width={imageRef.current?.clientWidth || undefined}
                height={imageRef.current?.clientHeight || undefined}
                zoom={zoom}
                zoomPos={zoomPos}
                containerRef={imageContainerRef}
              />
            </div>
          ) : (
            <div className="aspect-video bg-main-300 dark:bg-main-800 flex items-center justify-center">
              <p className="text-sm text-main-600 dark:text-main-400">Camera feed unavailable</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-900 dark:text-red-200 px-2 py-1 text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-1">
      </div>

      {regions.length > 0 && (
        <div className="text-xs text-main-700 dark:text-main-300">
          <div className="flex justify-between items-center mb-1">
            <p className="font-bold">Drawn Regions: {regions.length}</p>
            <Button
              onClick={onClear}
              className="text-xs bg-red-500 hover:bg-red-300 text-white dark:bg-red-500 dark:hover:bg-red-700"
            >
              Delete All
            </Button>
          </div>
          <ul className="space-y-1 mt-1">
            {regions.map((r, idx) => (
              <RegionListItem key={r.id} region={r} index={idx} onChange={handleChangeRegion(idx)} onDelete={handleDeleteRegion(idx)} onReset={handleResetRegion(idx)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
