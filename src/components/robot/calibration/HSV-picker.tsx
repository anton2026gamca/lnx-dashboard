/**
 * HSV Color Range Picker Component
 * Includes Hue-Saturation, Hue-Value, and Saturation-Value maps
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HSVRange, Region } from '@/types/calibration';
import { GradientSlider } from './gradient-slider';

interface HSVPickerProps {
  value: Partial<HSVRange>;
  onChange: (value: Partial<HSVRange>) => void;
  label?: string;
  enableGradientSliders?: boolean;
  otherRegions?: HSVRange[];
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
}

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
  const hue = h * 2;
  const c = (v / 255) * (s / 255);
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = (v / 255) - c;

  let r = 0, g = 0, b = 0;

  if (hue >= 0 && hue < 60) [r, g, b] = [c, x, 0];
  else if (hue >= 60 && hue < 120) [r, g, b] = [x, c, 0];
  else if (hue >= 120 && hue < 180) [r, g, b] = [0, c, x];
  else if (hue >= 180 && hue < 240) [r, g, b] = [0, x, c];
  else if (hue >= 240 && hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

export const HSVPicker: React.FC<HSVPickerProps> = ({ value, onChange, label = '', enableGradientSliders = true, otherRegions = [] }) => {
  const canvasRefs = {
    hs: useRef<HTMLCanvasElement>(null),
    hv: useRef<HTMLCanvasElement>(null),
    sv: useRef<HTMLCanvasElement>(null),
  };

  const [minH, setMinH] = useState(value.h_min ?? 0);
  const [maxH, setMaxH] = useState(value.h_max ?? 179);
  const [minS, setMinS] = useState(value.s_min ?? 0);
  const [maxS, setMaxS] = useState(value.s_max ?? 255);
  const [minV, setMinV] = useState(value.v_min ?? 0);
  const [maxV, setMaxV] = useState(value.v_max ?? 255);

  useEffect(() => {
    setMinH(value.h_min ?? 0);
    setMaxH(value.h_max ?? 179);
    setMinS(value.s_min ?? 0);
    setMaxS(value.s_max ?? 255);
    setMinV(value.v_min ?? 0);
    setMaxV(value.v_max ?? 255);
  }, [value.h_min, value.h_max, value.s_min, value.s_max, value.v_min, value.v_max]);

  const [previewH, setPreviewH] = useState(90);
  const [previewS, setPreviewS] = useState(128);
  const [previewV, setPreviewV] = useState(128);

  const [drawingState, setDrawingState] = useState<{ [key: string]: DrawingState }>({});

  const updateValue = (updates: Partial<HSVRange>) => {
    const newValue: Partial<HSVRange> = {
      ...value,
      ...updates,
    };
    onChange(newValue);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, canvasKey: string) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawingState((prev) => ({
      ...prev,
      [canvasKey]: { isDrawing: true, startX: x, startY: y },
    }));
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, canvasKey: string) => {
    const state = drawingState[canvasKey];
    if (!state?.isDrawing) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;

    const x1 = Math.min(state.startX, x);
    const x2 = Math.max(state.startX, x);
    const y1 = Math.min(state.startY, y);
    const y2 = Math.max(state.startY, y);

    if (canvasKey === 'hs') {
      const minHNew = Math.round((x1 / width) * 179);
      const maxHNew = Math.round((x2 / width) * 179);
      const minSNew = Math.round(((height - y2) / height) * 255);
      const maxSNew = Math.round(((height - y1) / height) * 255);
      setMinH(minHNew);
      setMaxH(maxHNew);
      setMinS(minSNew);
      setMaxS(maxSNew);
    } else if (canvasKey === 'hv') {
      const minHNew = Math.round((x1 / width) * 179);
      const maxHNew = Math.round((x2 / width) * 179);
      const minVNew = Math.round(((height - y2) / height) * 255);
      const maxVNew = Math.round(((height - y1) / height) * 255);
      setMinH(minHNew);
      setMaxH(maxHNew);
      setMinV(minVNew);
      setMaxV(maxVNew);
    } else if (canvasKey === 'sv') {
      const minSNew = Math.round((x1 / width) * 255);
      const maxSNew = Math.round((x2 / width) * 255);
      const minVNew = Math.round(((height - y2) / height) * 255);
      const maxVNew = Math.round(((height - y1) / height) * 255);
      setMinS(minSNew);
      setMaxS(maxSNew);
      setMinV(minVNew);
      setMaxV(maxVNew);
    }
  };

  const handleCanvasMouseUp = (canvasKey: string) => {
    if (drawingState[canvasKey]?.isDrawing) {
      updateValue({
        h_min: minH,
        h_max: maxH,
        s_min: minS,
        s_max: maxS,
        v_min: minV,
        v_max: maxV,
      });
      setDrawingState((prev) => ({
        ...prev,
        [canvasKey]: { isDrawing: false, startX: 0, startY: 0 },
      }));
    }

    handlePreviewOutOfBounds();
  };

  useEffect(() => {
    Object.values(canvasRefs).forEach((ref) => {
      const canvas = ref.current;
      if (canvas && canvas.parentElement) {
        const parentWidth = canvas.parentElement.clientWidth;
        canvas.width = parentWidth;
        canvas.height = parentWidth;
      }
    });
  }, [minH, maxH, minS, maxS, minV, maxV, previewH, previewS, previewV]);

  useEffect(() => {
    const preview = getPreviewInBounds();

    const drawMap = (
      canvas: HTMLCanvasElement | null,
      getHSV: (x: number, y: number, width: number, height: number) => [number, number, number],
      rect: { x1: number, x2: number, y1: number, y2: number },
      previewPos: { x: number, y: number },
      getRect: (region: HSVRange, canvas: HTMLCanvasElement) => { x1: number; x2: number; y1: number; y2: number },
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const [h, s, v] = getHSV(x, y, width, height);
          const [r, g, b] = hsvToRgb(h, s, v);
          const idx = (y * width + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const drawRegionRect = (
        ctx: CanvasRenderingContext2D,
        rect: { x1: number; x2: number; y1: number; y2: number },
        color = '#ffffff'
      ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(rect.x1, rect.y1, rect.x2 - rect.x1, rect.y2 - rect.y1);
        ctx.setLineDash([]);
        ctx.fillStyle = '#00000055';
        ctx.fillRect(rect.x1, rect.y1, rect.x2 - rect.x1, rect.y2 - rect.y1);
        ctx.restore();
      };

      otherRegions.forEach((region) => {
        drawRegionRect(ctx, getRect(region, canvas));
      });

      console.log(otherRegions);

      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x1, rect.y1, rect.x2 - rect.x1, rect.y2 - rect.y1);
      
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(previewPos.x, previewPos.y, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    // Draw Hue-Saturation map
    drawMap(
      canvasRefs.hs.current,
      (x, y, width, height) => [
        (x / width) * 180,
        ((height - y) / height) * 255,
        preview.v
      ],
      {
        x1: (minH / 179) * (canvasRefs.hs.current?.width || 1),
        x2: (maxH / 179) * (canvasRefs.hs.current?.width || 1),
        y1: (canvasRefs.hs.current?.height || 1) - ((maxS / 255) * (canvasRefs.hs.current?.height || 1)),
        y2: (canvasRefs.hs.current?.height || 1) - ((minS / 255) * (canvasRefs.hs.current?.height || 1)),
      },
      {
        x: (preview.h / 180) * (canvasRefs.hs.current?.width || 1),
        y: (canvasRefs.hs.current?.height || 1) - ((preview.s / 255) * (canvasRefs.hs.current?.height || 1)),
      },
      (region, canvas) => ({
        x1: (region.h_min / 179) * canvas.width,
        x2: (region.h_max / 179) * canvas.width,
        y1: canvas.height - ((region.s_max / 255) * canvas.height),
        y2: canvas.height - ((region.s_min / 255) * canvas.height),
      })
    );

    // Draw Hue-Value map
    drawMap(
      canvasRefs.hv.current,
      (x, y, width, height) => [
        (x / width) * 180,
        preview.s,
        ((height - y) / height) * 255
      ],
      {
        x1: (minH / 179) * (canvasRefs.hv.current?.width || 1),
        x2: (maxH / 179) * (canvasRefs.hv.current?.width || 1),
        y1: (canvasRefs.hv.current?.height || 1) - ((maxV / 255) * (canvasRefs.hv.current?.height || 1)),
        y2: (canvasRefs.hv.current?.height || 1) - ((minV / 255) * (canvasRefs.hv.current?.height || 1)),
      },
      {
        x: (preview.h / 180) * (canvasRefs.hv.current?.width || 1),
        y: (canvasRefs.hv.current?.height || 1) - ((preview.v / 255) * (canvasRefs.hv.current?.height || 1)),
      },
      (region, canvas) => ({
        x1: (region.h_min / 179) * canvas.width,
        x2: (region.h_max / 179) * canvas.width,
        y1: canvas.height - ((region.v_max / 255) * canvas.height),
        y2: canvas.height - ((region.v_min / 255) * canvas.height),
      })
    );

    // Draw Saturation-Value map
    drawMap(
      canvasRefs.sv.current,
      (x, y, width, height) => [
        preview.h,
        (x / width) * 255,
        ((height - y) / height) * 255
      ],
      {
        x1: (minS / 255) * (canvasRefs.sv.current?.width || 1),
        x2: (maxS / 255) * (canvasRefs.sv.current?.width || 1),
        y1: (canvasRefs.sv.current?.height || 1) - ((maxV / 255) * (canvasRefs.sv.current?.height || 1)),
        y2: (canvasRefs.sv.current?.height || 1) - ((minV / 255) * (canvasRefs.sv.current?.height || 1)),
      },
      {
        x: (preview.s / 255) * (canvasRefs.sv.current?.width || 1),
        y: (canvasRefs.sv.current?.height || 1) - ((preview.v / 255) * (canvasRefs.sv.current?.height || 1)),
      },
      (region, canvas) => ({
        x1: (region.s_min / 255) * canvas.width,
        x2: (region.s_max / 255) * canvas.width,
        y1: canvas.height - ((region.v_max / 255) * canvas.height),
        y2: canvas.height - ((region.v_min / 255) * canvas.height),
      })
    );

    handleMinMaxOutOfBounds();
    if (!drawingState.hs?.isDrawing && !drawingState.hv?.isDrawing && !drawingState.sv?.isDrawing) {
      handlePreviewOutOfBounds();
    }
  }, [minH, maxH, minS, maxS, minV, maxV, previewH, previewS, previewV]);

  const getMinInBounds = () => {
    return {
      h: Math.min(minH, maxH),
      s: Math.min(minS, maxS),
      v: Math.min(minV, maxV),
    };
  };

  const getMaxInBounds = () => {
    return {
      h: Math.max(maxH, minH),
      s: Math.max(maxS, minS),
      v: Math.max(maxV, minV),
    };
  };

  const handleMinMaxOutOfBounds = () => {
    const minInBounds = getMinInBounds();
    const maxInBounds = getMaxInBounds();
    setMinH(minInBounds.h);
    setMinS(minInBounds.s);
    setMinV(minInBounds.v);
    setMaxH(maxInBounds.h);
    setMaxS(maxInBounds.s);
    setMaxV(maxInBounds.v);
  };

  const getPreviewInBounds = () => {
    return {
      h: Math.min(Math.max(previewH, minH), maxH),
      s: Math.min(Math.max(previewS, minS), maxS),
      v: Math.min(Math.max(previewV, minV), maxV),
    };
  };

  const handlePreviewOutOfBounds = () => {
    const inBounds = getPreviewInBounds();
    setPreviewH(inBounds.h);
    setPreviewS(inBounds.s);
    setPreviewV(inBounds.v);
  };

  const handleSliderChange = (
    key: 'h_min' | 'h_max' | 's_min' | 's_max' | 'v_min' | 'v_max',
    newMin: number,
    newMax: number
  ) => {
    if (key === 'h_min') {
      setMinH(newMin);
    } else if (key === 'h_max') {
      setMaxH(newMax);
    } else if (key === 's_min') {
      setMinS(newMin);
    } else if (key === 's_max') {
      setMaxS(newMax);
    } else if (key === 'v_min') {
      setMinV(newMin);
    } else if (key === 'v_max') {
      setMaxV(newMax);
    }

    updateValue({
      h_min: key === 'h_min' ? newMin : minH,
      h_max: key === 'h_max' ? newMax : maxH,
      s_min: key === 's_min' ? newMin : minS,
      s_max: key === 's_max' ? newMax : maxS,
      v_min: key === 'v_min' ? newMin : minV,
      v_max: key === 'v_max' ? newMax : maxV,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-bold text-main-900 dark:text-white">{label}</h3>

      {/* Visual maps */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-main-600 dark:text-main-400 block mb-1">Hue-Saturation</label>
          <canvas
            ref={canvasRefs.hs}
            className="w-full border border-main-300 dark:border-main-700 cursor-crosshair"
            onMouseDown={(e) => handleCanvasMouseDown(e, 'hs')}
            onMouseMove={(e) => handleCanvasMouseMove(e, 'hs')}
            onMouseUp={() => handleCanvasMouseUp('hs')}
            onMouseLeave={() => handleCanvasMouseUp('hs')}
          />
        </div>
        <div>
          <label className="text-xs text-main-600 dark:text-main-400 block mb-1">Hue-Value</label>
          <canvas
            ref={canvasRefs.hv}
            className="w-full border border-main-300 dark:border-main-700 cursor-crosshair"
            onMouseDown={(e) => handleCanvasMouseDown(e, 'hv')}
            onMouseMove={(e) => handleCanvasMouseMove(e, 'hv')}
            onMouseUp={() => handleCanvasMouseUp('hv')}
            onMouseLeave={() => handleCanvasMouseUp('hv')}
          />
        </div>
        <div>
          <label className="text-xs text-main-600 dark:text-main-400 block mb-1">Saturation-Value</label>
          <canvas
            ref={canvasRefs.sv}
            className="w-full border border-main-300 dark:border-main-700 cursor-crosshair"
            onMouseDown={(e) => handleCanvasMouseDown(e, 'sv')}
            onMouseMove={(e) => handleCanvasMouseMove(e, 'sv')}
            onMouseUp={() => handleCanvasMouseUp('sv')}
            onMouseLeave={() => handleCanvasMouseUp('sv')}
          />
        </div>
      </div>

      {/* Preview sliders below canvases */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="flex gap-2 items-center">
            <label className="text-main-600 dark:text-main-400 block">Preview V</label>
            <GradientSlider
              min={minV}
              max={maxV}
              value={previewV}
              onChange={setPreviewV}
              type="value"
              enableGradient={enableGradientSliders}
              className="flex-1"
              previewHSV={getPreviewInBounds()}
            />
            <span className="text-main-600 dark:text-main-400 w-8">{getPreviewInBounds().v}</span>
          </div>
        </div>
        <div>
          <div className="flex gap-2 items-center">
            <label className="text-main-600 dark:text-main-400 block">Preview S</label>
            <GradientSlider
              min={minS}
              max={maxS}
              value={previewS}
              onChange={setPreviewS}
              type="saturation"
              enableGradient={enableGradientSliders}
              className="flex-1"
              previewHSV={getPreviewInBounds()}
            />
            <span className="text-main-600 dark:text-main-400 w-8">{getPreviewInBounds().s}</span>
          </div>
        </div>
        <div>
          <div className="flex gap-2 items-center">
            <label className="text-main-600 dark:text-main-400 block">Preview H</label>
            <GradientSlider
              min={minH}
              max={maxH}
              value={previewH}
              onChange={setPreviewH}
              type="hue"
              enableGradient={enableGradientSliders}
              className="flex-1"
              previewHSV={getPreviewInBounds()}
            />
            <span className="text-main-600 dark:text-main-400 w-8">{getPreviewInBounds().h}</span>
          </div>
        </div>
      </div>

      {/* Slider controls */}
      <div className="space-y-2 text-xs">
        {/* Hue Sliders */}
        <div className="flex gap-2 items-center">
          <label className="text-main-600 dark:text-main-400 min-w-17">H (0-179)</label>
          <GradientSlider
            min={0}
            max={179}
            value={minH}
            onChange={(val) => handleSliderChange('h_min', val, maxH)}
            type="hue"
            enableGradient={enableGradientSliders}
            className="flex-1"
            previewHSV={{h: minH, s: minS, v: minV}}
          />
          <input
            type="number"
            min="0"
            max="179"
            value={minH}
            onChange={(e) => {
              const num = Math.min(179, Math.max(0, parseInt(e.target.value) || 0));
              setMinH(num);
              updateValue({
                h_min: num,
                h_max: maxH,
                s_min: minS,
                s_max: maxS,
                v_min: minV,
                v_max: maxV,
              });
            }}
            className="w-12 px-0.5 bg-main-200 dark:bg-main-800 border border-main-300 dark:border-main-700 text-main-900 dark:text-white"
          />
          <input
            type="number"
            min="0"
            max="179"
            value={maxH}
            onChange={(e) => {
              const num = Math.min(179, Math.max(0, parseInt(e.target.value) || 0));
              setMaxH(num);
              updateValue({
                h_min: minH,
                h_max: num,
                s_min: minS,
                s_max: maxS,
                v_min: minV,
                v_max: maxV,
              });
            }}
            className="w-12 px-0.5 bg-main-200 dark:bg-main-800 border border-main-300 dark:border-main-700 text-main-900 dark:text-white"
          />
          <GradientSlider
            min={0}
            max={179}
            value={maxH}
            onChange={(val) => handleSliderChange('h_max', minH, val)}
            type="hue"
            enableGradient={enableGradientSliders}
            className="flex-1"
            previewHSV={{h: maxH, s: maxS, v: maxV}}
          />
        </div>

        {/* Saturation Sliders */}
        <div className="flex gap-2 items-center">
          <label className="text-main-600 dark:text-main-400 min-w-17">S (0-255)</label>
          <GradientSlider
            min={0}
            max={255}
            value={minS}
            onChange={(val) => handleSliderChange('s_min', val, maxS)}
            type="saturation"
            enableGradient={enableGradientSliders}
            className="flex-1"
            previewHSV={{h: minH, s: minS, v: minV}}
          />
          <input
            type="number"
            min="0"
            max="255"
            value={minS}
            onChange={(e) => {
              const num = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
              setMinS(num);
              updateValue({
                h_min: minH,
                h_max: maxH,
                s_min: num,
                s_max: maxS,
                v_min: minV,
                v_max: maxV,
              });
            }}
            className="w-12 px-0.5 bg-main-200 dark:bg-main-800 border border-main-300 dark:border-main-700 text-main-900 dark:text-white"
          />
          <input
            type="number"
            min="0"
            max="255"
            value={maxS}
            onChange={(e) => {
              const num = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
              setMaxS(num);
              updateValue({
                h_min: minH,
                h_max: maxH,
                s_min: minS,
                s_max: num,
                v_min: minV,
                v_max: maxV,
              });
            }}
            className="w-12 px-0.5 bg-main-200 dark:bg-main-800 border border-main-300 dark:border-main-700 text-main-900 dark:text-white"
          />
          <GradientSlider
            min={0}
            max={255}
            value={maxS}
            onChange={(val) => handleSliderChange('s_max', minS, val)}
            type="saturation"
            enableGradient={enableGradientSliders}
            className="flex-1"
            previewHSV={{h: maxH, s: maxS, v: maxV}}
          />
        </div>

        {/* Value Sliders */}
        <div className="flex gap-2 items-center">
          <label className="text-main-600 dark:text-main-400 min-w-17">V (0-255)</label>
          <GradientSlider
            min={0}
            max={255}
            value={minV}
            onChange={(val) => handleSliderChange('v_min', val, maxV)}
            type="value"
            enableGradient={enableGradientSliders}
            className="flex-1"
            previewHSV={{h: minH, s: minS, v: minV}}
          />
          <input type="number" min="0" max="255" value={minV}
            onChange={(e) => {
              const num = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
              setMinV(num);
              updateValue({
                h_min: minH,
                h_max: maxH,
                s_min: minS,
                s_max: maxS,
                v_min: num,
                v_max: maxV,
              });
            }}
            className="w-12 px-0.5 bg-main-200 dark:bg-main-800 border border-main-300 dark:border-main-700 text-main-900 dark:text-white"
          />
          <input type="number" min="0" max="255" value={maxV}
            onChange={(e) => {
              const num = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
              setMaxV(num);
              updateValue({
                h_min: minH,
                h_max: maxH,
                s_min: minS,
                s_max: maxS,
                v_min: minV,
                v_max: num,
              });
            }}
            className="w-12 px-0.5 bg-main-200 dark:bg-main-800 border border-main-300 dark:border-main-700 text-main-900 dark:text-white"
          />
          <GradientSlider
            min={0}
            max={255}
            value={maxV}
            onChange={(val) => handleSliderChange('v_max', minV, val)}
            type="value"
            enableGradient={enableGradientSliders}
            className="flex-1"
            previewHSV={{h: maxH, s: maxS, v: maxV}}
          />
        </div>
      </div>
    </div>
  );
};
