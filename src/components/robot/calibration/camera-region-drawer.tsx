/**
 * Camera Region Drawing Component
 * Allows users to draw regions on a camera image
 */

'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVideoStream, useFrameDataUrl } from '@/hooks/useRobot';
import { robotClient } from '@/lib/robotAPIClient';
import { DrawRegion, HSVRange, Region } from '@/types/calibration';
import { HSVPicker } from './HSV-picker';
import { CanvasRegionDrawer } from '@/components/ui/canvas-region-drawer';

const RegionListItem: React.FC<{ region: DrawRegion; index: number; onChange: (newVal: HSVRange) => void, onDelete: () => void, onReset: () => void }> = ({ region, index, onChange, onDelete, onReset }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [imageExpanded, setImageExpanded] = React.useState(false);
  const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [hsv, setHsv] = React.useState<Partial<HSVRange>>(region.hsv || {});
  React.useEffect(() => { setHsv(region.hsv || {}); }, [region.hsv]);

  const handleChange = (newHsv: Partial<HSVRange>) => {
    setHsv(newHsv)
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

  return (
    <li className="bg-main-200 dark:bg-main-900 py-0.5">
      <div className="flex items-center justify-between cursor-pointer gap-2" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-2">
          <span className="ml-2 text-main-500">{expanded ? '▼' : '▶'}</span>
          <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
            Region {index + 1}: {region.width}x{region.height} px
          </span>
        </div>
        <div className="flex gap-1">
          {canReset && (
            <Button onClick={() => { onReset(); }} className="bg-main-300 hover:bg-blue-300 text-white dark:bg-main-800 dark:hover:bg-blue-700 border-2 border-blue-500 dark:border-blue-500 text-main-800 dark:text-main-200 text-xs py-0 px-2">
              Reset
            </Button>
          )}
          <Button onClick={() => { onDelete(); }} className="bg-main-300 hover:bg-red-300 text-white dark:bg-main-800 dark:hover:bg-red-700 border-2 border-red-500 dark:border-red-500 text-main-800 dark:text-main-200">
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
                <div className="p-2 relative bg-black">
                  <div className="relative inline-block w-full">
                    <img
                      ref={imageRef}
                      src={region.cameraImage}
                      alt={`Region ${index + 1}`}
                      className="w-full"
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
                </div>
              )}
            </div>
          )}
          <div className="bg-main-300 dark:bg-main-800 border border-main-400 dark:border-main-700">
            <div className="flex items-center justify-between cursor-pointer p-1" onClick={() => setImageExpanded((v) => !v)}>
              <span className="text-xs font-bold text-main-700 dark:text-main-300">HSV Picker</span>
            </div>
            <div className="p-2">
              <HSVPicker
                value={hsv}
                onChange={handleChange}
              />
            </div>
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
  fps?: number;
  showRegionsOnCanvas?: boolean;
}

export const CameraRegionDrawer: React.FC<CameraRegionDrawerProps> = ({
  onRegionAdded,
  onRegionChanged,
  onClear,
  regions,
  fps = 15,
  showRegionsOnCanvas = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  const { frame } = useVideoStream(true, fps, false);
  const frameUrl = useFrameDataUrl(frame);

  const handleAddRegion = async (region: Region, canvas: HTMLCanvasElement | null) => {
    if (!canvas || !imageRef.current) return;

    try {
      setError(null);

      const image = imageRef.current;

      const scaleX = image.naturalWidth / canvas.clientWidth;
      const scaleY = image.naturalHeight / canvas.clientHeight;

      console.log('Canvas size:', canvas.clientWidth, canvas.clientHeight, 'Image size:', image.naturalWidth, image.naturalHeight, 'Scale:', scaleX, scaleY);

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
        <div className="relative">
          {frameUrl ? (
            <>
              <img
                ref={imageRef}
                src={frameUrl}
                alt="Camera Feed"
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
              />
            </>
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
              <RegionListItem key={idx} region={r} index={idx} onChange={handleChangeRegion(idx)} onDelete={handleDeleteRegion(idx)} onReset={handleResetRegion(idx)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
