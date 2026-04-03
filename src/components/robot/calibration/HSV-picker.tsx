/**
 * HSV Color Range Picker Component
 * Includes Hue-Saturation, Hue-Value, and Saturation-Value maps
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HSVRange } from '@/types/calibration';

interface HSVPickerProps {
  value: Partial<HSVRange>;
  onChange: (value: Partial<HSVRange>) => void;
  label?: string;
}

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
  const c = (v / 255) * (s / 255);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = (v / 255) - c;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
  else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0];
  else if (h >= 120 && h < 180) [r, g, b] = [0, c, x];
  else if (h >= 180 && h < 240) [r, g, b] = [0, x, c];
  else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

export const HSVPicker: React.FC<HSVPickerProps> = ({ value, onChange, label = '' }) => {
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

  const updateValue = (updates: Partial<HSVRange>) => {
    const newValue: Partial<HSVRange> = {
      ...value,
      ...updates,
    };
    onChange(newValue);
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
  }, [minH, maxH, minS, maxS, minV, maxV]);

  useEffect(() => {
    // Draw Hue-Saturation map
    const hsCanvas = canvasRefs.hs.current;
    if (hsCanvas) {
      const ctx = hsCanvas.getContext('2d');
      if (ctx) {
        const width = hsCanvas.width;
        const height = hsCanvas.height;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const h = (x / width) * 360;
            const s = ((height - y) / height) * 255;
            const v = (maxV + minV) / 2;

            const [r, g, b] = hsvToRgb(h, s, v);
            const idx = (y * width + x) * 4;

            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        const x1 = (minH / 179) * width;
        const x2 = (maxH / 179) * width;
        const y1 = height - ((maxS / 255) * height);
        const y2 = height - ((minS / 255) * height);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }
    }

    // Draw Hue-Value map
    const hvCanvas = canvasRefs.hv.current;
    if (hvCanvas) {
      const ctx = hvCanvas.getContext('2d');
      if (ctx) {
        const width = hvCanvas.width;
        const height = hvCanvas.height;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        const s = (minS + maxS) / 2;

        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const h = (x / width) * 360;
            const v = ((height - y) / height) * 255;

            const [r, g, b] = hsvToRgb(h, s, v);
            const idx = (y * width + x) * 4;

            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        const x1 = (minH / 179) * width;
        const x2 = (maxH / 179) * width;
        const y1 = height - ((maxV / 255) * height);
        const y2 = height - ((minV / 255) * height);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }
    }

    // Draw Saturation-Value map
    const svCanvas = canvasRefs.sv.current;
    if (svCanvas) {
      const ctx = svCanvas.getContext('2d');
      if (ctx) {
        const width = svCanvas.width;
        const height = svCanvas.height;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        const h = (minH * 2 + maxH * 2) / 2;

        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const s = (x / width) * 255;
            const v = ((height - y) / height) * 255;

            const [r, g, b] = hsvToRgb(h, s, v);
            const idx = (y * width + x) * 4;

            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        const x1 = (minS / 255) * width;
        const x2 = (maxS / 255) * width;
        const y1 = height - ((maxV / 255) * height);
        const y2 = height - ((minV / 255) * height);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }
    }
  }, [minH, maxH, minS, maxS, minV, maxV]);

  const handleSliderChange = (
    key: 'h_min' | 'h_max' | 's_min' | 's_max' | 'v_min' | 'v_max',
    newMin: number,
    newMax: number
  ) => {
    if (key === 'h_min') setMinH(newMin);
    else if (key === 'h_max') setMaxH(newMax);
    else if (key === 's_min') setMinS(newMin);
    else if (key === 's_max') setMaxS(newMax);
    else if (key === 'v_min') setMinV(newMin);
    else if (key === 'v_max') setMaxV(newMax);

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
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-main-900 dark:text-white">{label}</h3>

      {/* Visual maps */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-main-600 dark:text-main-400 block mb-1">Hue-Saturation</label>
          <canvas
            ref={canvasRefs.hs}
            className="w-full border border-main-300 dark:border-main-700"
          />
        </div>
        <div>
          <label className="text-xs text-main-600 dark:text-main-400 block mb-1">Hue-Value</label>
          <canvas
            ref={canvasRefs.hv}
            className="w-full border border-main-300 dark:border-main-700"
          />
        </div>
        <div>
          <label className="text-xs text-main-600 dark:text-main-400 block mb-1">Saturation-Value</label>
          <canvas
            ref={canvasRefs.sv}
            className="w-full border border-main-300 dark:border-main-700"
          />
        </div>
      </div>

      {/* Slider controls */}
      <div className="space-y-2 text-xs">
        <div>
          <label className="block text-main-600 dark:text-main-400 mb-1">
            H: {minH} - {maxH} (0-179)
          </label>
          <div className="flex gap-2">
            <input
              type="range"
              min="0"
              max="179"
              value={minH}
              onChange={(e) => handleSliderChange('h_min', parseInt(e.target.value), maxH)}
              className="flex-1 h-2 bg-main-300 dark:bg-main-700 rounded"
            />
            <input
              type="range"
              min="0"
              max="179"
              value={maxH}
              onChange={(e) => handleSliderChange('h_max', minH, parseInt(e.target.value))}
              className="flex-1 h-2 bg-main-300 dark:bg-main-700 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-main-600 dark:text-main-400 mb-1">
            S: {minS} - {maxS} (0-255)
          </label>
          <div className="flex gap-2">
            <input
              type="range"
              min="0"
              max="255"
              value={minS}
              onChange={(e) => handleSliderChange('s_min', parseInt(e.target.value), maxS)}
              className="flex-1 h-2 bg-main-300 dark:bg-main-700 rounded"
            />
            <input
              type="range"
              min="0"
              max="255"
              value={maxS}
              onChange={(e) => handleSliderChange('s_max', minS, parseInt(e.target.value))}
              className="flex-1 h-2 bg-main-300 dark:bg-main-700 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-main-600 dark:text-main-400 mb-1">
            V: {minV} - {maxV} (0-255)
          </label>
          <div className="flex gap-2">
            <input
              type="range"
              min="0"
              max="255"
              value={minV}
              onChange={(e) => handleSliderChange('v_min', parseInt(e.target.value), maxV)}
              className="flex-1 h-2 bg-main-300 dark:bg-main-700 rounded"
            />
            <input
              type="range"
              min="0"
              max="255"
              value={maxV}
              onChange={(e) => handleSliderChange('v_max', minV, parseInt(e.target.value))}
              className="flex-1 h-2 bg-main-300 dark:bg-main-700 rounded"
            />
          </div>
        </div>
      </div>

      {/* Numeric inputs */}
      <div className="grid grid-cols-6 gap-1 text-xs">
        {[
          { label: 'H min', value: minH, key: 'h_min', max: 179 },
          { label: 'H max', value: maxH, key: 'h_max', max: 179 },
          { label: 'S min', value: minS, key: 's_min', max: 255 },
          { label: 'S max', value: maxS, key: 's_max', max: 255 },
          { label: 'V min', value: minV, key: 'v_min', max: 255 },
          { label: 'V max', value: maxV, key: 'v_max', max: 255 },
        ].map(({ label, value, key, max }) => (
          <div key={key}>
            <label className="block text-main-600 dark:text-main-400 mb-1">{label}</label>
            <input
              type="number"
              min="0"
              max={max}
              value={value}
              onChange={(e) => {
                const num = Math.min(max, Math.max(0, parseInt(e.target.value) || 0));
                if (key === 'h_min') setMinH(num);
                else if (key === 'h_max') setMaxH(num);
                else if (key === 's_min') setMinS(num);
                else if (key === 's_max') setMaxS(num);
                else if (key === 'v_min') setMinV(num);
                else if (key === 'v_max') setMaxV(num);

                updateValue({
                  h_min: key === 'h_min' ? num : minH,
                  h_max: key === 'h_max' ? num : maxH,
                  s_min: key === 's_min' ? num : minS,
                  s_max: key === 's_max' ? num : maxS,
                  v_min: key === 'v_min' ? num : minV,
                  v_max: key === 'v_max' ? num : maxV,
                });
              }}
              className="w-full px-1 py-1 bg-main-200 dark:bg-main-800 border border-main-300 dark:border-main-700 text-main-900 dark:text-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
