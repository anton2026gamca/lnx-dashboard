/**
 * Camera Region Drawing Component
 * Allows users to draw regions on a camera image
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVideoStream, useFrameDataUrl } from '@/hooks/useRobot';
import { robotClient } from '@/lib/robotAPIClient';
import { DrawRegion, HSVRange } from '@/types/calibration';
import { HSVPicker } from './HSV-picker';

interface CameraRegionDrawerProps {
  onRegionAdded: (region: DrawRegion) => void;
  onRegionChanged: (index: number, region: DrawRegion) => void;
  onClear: () => void;
  regions: DrawRegion[];
  fps?: number;
}

const RegionListItem: React.FC<{ region: DrawRegion; index: number; onChange: (newVal: HSVRange) => void }> = ({ region, index, onChange }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [hsv, setHsv] = React.useState<Partial<HSVRange>>(region.hsv || {});
  React.useEffect(() => { setHsv(region.hsv || {}); }, [region.hsv]);

  const handleChange = (newHsv: Partial<HSVRange>) => {
    setHsv(newHsv)
    onChange({h_min: newHsv.h_min ?? 0, s_min: newHsv.s_min ?? 0, v_min: newHsv.v_min ?? 0, h_max: newHsv.h_max ?? 255, s_max: newHsv.s_max ?? 255, v_max: newHsv.v_max ?? 255})
  }

  return (
    <li className="bg-main-200 dark:bg-main-900 py-0.5">
      <div className="flex items-center justify-start cursor-pointer gap-2" onClick={() => setExpanded((v) => !v)}>
        <span className="ml-2 text-main-500">{expanded ? '▼' : '▶'}</span>
        <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
          Region {index + 1}: {region.width}x{region.height} px
        </span>
      </div>
      {expanded && (
        <div className="p-2">
          <HSVPicker
            value={hsv}
            onChange={handleChange}
          />
        </div>
      )}
    </li>
  );
};

export const CameraRegionDrawer: React.FC<CameraRegionDrawerProps> = ({
  onRegionAdded,
  onRegionChanged,
  onClear,
  regions,
  fps = 15,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { frame } = useVideoStream(true, fps, false);
  const frameUrl = useFrameDataUrl(frame);

  const getCanvasCoordinates = (
    clientX: number,
    clientY: number
  ): [number, number] => {
    if (!canvasRef.current) return [0, 0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return [x, y];
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = getCanvasCoordinates(e.clientX, e.clientY);

    setStartX(x);
    setStartY(y);
    setCurrentX(x);
    setCurrentY(y);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const [x, y] = getCanvasCoordinates(e.clientX, e.clientY);
    setCurrentX(x);
    setCurrentY(y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleAddRegion = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const canvas = canvasRef.current;
      const image = imageRef.current;

      const scaleX = image.naturalWidth / canvas.clientWidth;
      const scaleY = image.naturalHeight / canvas.clientHeight;

      const x = Math.min(startX, currentX) * scaleX;
      const y = Math.min(startY, currentY) * scaleY;
      const width = Math.abs(currentX - startX) * scaleX;
      const height = Math.abs(currentY - startY) * scaleY;

      if (width < 1 || height < 1) {
        setError('Region too small. Please draw a larger area.');
        return;
      }

      const hsvData = await robotClient.computeHsvFromRegions([
        { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) },
      ]);

      if (hsvData) {
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
        };

        onRegionAdded(newRegion);
      }

      setStartX(0);
      setStartY(0);
      setCurrentX(0);
      setCurrentY(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add region');
    } finally {
      setLoading(false);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    regions.forEach((region) => {
      if (imageRef.current) {
        const scaleX = canvas.width / imageRef.current.naturalWidth;
        const scaleY = canvas.height / imageRef.current.naturalHeight;

        const x = region.x * scaleX;
        const y = region.y * scaleY;
        const w = region.width * scaleX;
        const h = region.height * scaleY;

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
      }
    });

    const scaleX = (imageRef?.current?.naturalWidth ?? canvas.clientWidth) / canvas.clientWidth;
    const scaleY = (imageRef?.current?.naturalHeight ?? canvas.clientHeight) / canvas.clientHeight;
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      Math.min(startX, currentX) * scaleX,
      Math.min(startY, currentY) * scaleY,
      Math.abs(currentX - startX) * scaleX,
      Math.abs(currentY - startY) * scaleY
    );
  }, [regions, isDrawing, startX, startY, currentX, currentY]);

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
              <canvas
                ref={canvasRef}
                width={imageRef.current ? imageRef.current.naturalWidth : 640}
                height={imageRef.current ? imageRef.current.naturalHeight : 480}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full aspect-video border border-main-400 dark:border-main-600 cursor-crosshair absolute inset-0"
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
        <Button
          onClick={handleAddRegion}
          disabled={loading}
          className="flex-1 text-xs"
        >
          {loading ? 'Computing...' : 'Add Region'}
        </Button>
        <Button
          onClick={onClear}
          className="flex-1 text-xs"
        >
          Clear All
        </Button>
      </div>

      {regions.length > 0 && (
        <div className="text-xs text-main-700 dark:text-main-300">
          <p className="font-bold">Drawn Regions: {regions.length}</p>
          <ul className="space-y-1 mt-1">
            {regions.map((r, idx) => (
              <RegionListItem key={idx} region={r} index={idx} onChange={handleChangeRegion(idx)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
