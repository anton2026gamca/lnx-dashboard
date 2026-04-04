'use client';

import { cn } from "@/lib/utils";
import { Region } from "@/types/calibration";
import { useEffect, useRef, useState } from "react";


interface CanvasRegionDrawerProps {
  regions: Region[];
  disableDrawingNewRegions?: boolean;
  onNewRegionStarted?: (canvas: HTMLCanvasElement | null) => void;
  onNewRegionFinished?: (region: Region, canvas: HTMLCanvasElement | null) => void;
  beforeRedraw?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
  width?: number;
  height?: number;
  className?: string;
}

export const CanvasRegionDrawer: React.FC<CanvasRegionDrawerProps> = ({
  regions,
  disableDrawingNewRegions = false,
  onNewRegionStarted = () => {},
  onNewRegionFinished = () => {},
  beforeRedraw = () => {},
  width,
  height,
  className = '',
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (disableDrawingNewRegions) return;

    const [x, y] = getCanvasCoordinates(e.clientX, e.clientY);

    setStartX(x);
    setStartY(y);
    setCurrentX(x);
    setCurrentY(y);
    setIsDrawing(true);

    onNewRegionStarted(canvasRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const [x, y] = getCanvasCoordinates(e.clientX, e.clientY);
    setCurrentX(x);
    setCurrentY(y);
  };

  const handleMouseUp = () => {
    handleAddRegion();
  };

  const handleAddRegion = async () => {
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    onNewRegionFinished({ x, y, width, height }, canvasRef.current);      

    setStartX(0);
    setStartY(0);
    setCurrentX(0);
    setCurrentY(0);
    setIsDrawing(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    beforeRedraw(canvas, ctx);

    regions.forEach((region) => {
      const x = region.x;
      const y = region.y;
      const w = region.width;
      const h = region.height;

      ctx.strokeStyle = `${region.color ?? '#ffffff'}`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    });

    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      Math.min(startX, currentX),
      Math.min(startY, currentY),
      Math.abs(currentX - startX),
      Math.abs(currentY - startY),
    );
  }, [regions, isDrawing, startX, startY, currentX, currentY]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-full cursor-crosshair", className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      width={width}
      height={height}
    />
  )
}
