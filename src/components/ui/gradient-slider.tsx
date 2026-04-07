import React, { useRef } from 'react';

interface GradientSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  type: 'hue' | 'saturation' | 'value';
  disableGradient?: boolean;
  className?: string;
  previewHSV?: { h: number; s: number; v: number };
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export const GradientSlider: React.FC<GradientSliderProps> = ({
  min,
  max,
  value,
  onChange,
  type,
  disableGradient = true,
  className = '',
  previewHSV,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercent = () => Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  const { h: previewH = 0, s: previewS = 1, v: previewV = 1 } = previewHSV ? { h: previewHSV.h / 180, s: previewHSV.s / 255, v: previewHSV.v / 255 } : {};

  const getGradient = () => {
    switch (type) {
      case 'saturation': {
        const rgb0 = hsvToRgb(previewH, min / 255, previewV);
        const rgb1 = hsvToRgb(previewH, max / 255, previewV);
        return `linear-gradient(to right, rgb(${rgb0.join(',')}), rgb(${rgb1.join(',')}))`;
      }
      case 'value': {
        const rgb0 = hsvToRgb(previewH, previewS, min / 255);
        const rgb1 = hsvToRgb(previewH, previewS, max / 255);
        return `linear-gradient(to right, rgb(${rgb0.join(',')}), rgb(${rgb1.join(',')}))`;
      }
      case 'hue': {
        const steps = 7;
        const colors = Array.from({ length: steps + 1 }, (_, i) => {
          const value = min + ((max - min) * i) / steps;
          const h = value / 180;
          const rgb = hsvToRgb(h, previewS, previewV);
          return `rgb(${rgb.join(',')})`;
        });
        return `linear-gradient(to right, ${colors.join(', ')})`;
      }
      default:
        return '#ccc';
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newValue = Math.round(min + percent * (max - min));
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  const handleThumbDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const onMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const newValue = Math.round(min + percent * (max - min));
      onChange(Math.max(min, Math.min(max, newValue)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <>
      {!disableGradient 
        ? <div className={`relative w-full h-4 flex items-center ${className}`}
            style={{ userSelect: 'none' }}
          >
            <div
              ref={trackRef}
              className="w-full h-full cursor-pointer border-1 border-main-400 dark:border-main-600"
              style={{ background: getGradient() }}
              onClick={handleTrackClick}
            ></div>
            <div
              className="absolute top-1/2 w-2 h-5 border-2 bg-white border-gray-400 dark:bg-main-800 dark:border-main-200 rounded-full shadow cursor-pointer"
              style={{
                left: `calc(${getPercent()}% - 4px)`,
                transform: 'translateY(-50%)',
              }}
              onMouseDown={handleThumbDrag}
              tabIndex={0}
              role="slider"
              aria-valuenow={value}
              aria-valuemin={min}
              aria-valuemax={max}
            ></div>
          </div>
        : <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`w-full h-2 bg-gray-300 rounded ${className}`} />
      }
    </>
  );
};
