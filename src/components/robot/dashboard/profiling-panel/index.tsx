'use client';


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProfiling } from '@/hooks/useRobot';
import { Button } from '@/components/ui/button';


type EventKind = 'lock' | 'function';

interface TimelineEvent {
  id: string;
  type: EventKind;
  processKey: string;
  processLabel: string;
  name: string;
  start: number;
  end: number;
  duration: number;
}

interface HoveredEvent {
  event: TimelineEvent;
  x: number;
  y: number;
}

const LOCK_COLORS = ['bg-rose-500', 'bg-orange-500', 'bg-lime-500', 'bg-yellow-500'];
const FUNCTION_COLORS = ['bg-sky-800', 'bg-indigo-800', 'bg-purple-800', 'bg-blue-800', 'bg-fuchsia-800', 'bg-cyan-800', 'bg-rose-800', 'bg-violet-800'];
const PROCESS_LABEL_WIDTH = 208;
const EVENT_BAR_HEIGHT = 22;
const EVENT_LANE_GAP = 3;
const ROW_VERTICAL_PADDING = 6;
const MIN_PROCESS_ROW_HEIGHT = 44;


const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});

const getNumber = (source: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const getString = (source: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
};

const formatSeconds = (seconds: number): string => {
  if (seconds < 0.001) return `${(seconds * 1000000).toFixed(1)}µs`;
  if (seconds < 1) return `${(seconds * 1000).toFixed(2)}ms`;
  return `${seconds.toFixed(3)}s`;
};

const getTickStep = (duration: number): number => {
  const rough = Math.max(duration / 8, 0.001);
  const powers = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60];
  return powers.find(step => step >= rough) || 60;
};

const extractTimelineEvent = (item: unknown, type: EventKind, index: number): TimelineEvent | null => {
  const event = asRecord(item);
  const start = getNumber(event, ['start_time', 'start', 'timestamp', 'time', 'acquire_time', 'ts']);
  const end = getNumber(event, ['end_time', 'end', 'stop_time', 'release_time', 'finish_time']);
  const durationFromEvent = getNumber(event, ['duration', 'total_time', 'execution_time', 'elapsed', 'elapsed_time', 'hold_time', 'wait_time']);

  const resolvedStart = start ?? (end !== null && durationFromEvent !== null ? end - durationFromEvent : null);
  const resolvedEnd = end ?? (resolvedStart !== null && durationFromEvent !== null ? resolvedStart + durationFromEvent : null);
  if (resolvedStart === null || resolvedEnd === null) {
    return null;
  }

  const duration = Math.max(resolvedEnd - resolvedStart, 0);
  const processName = getString(event, ['process_name', 'process', 'process_label', 'processName']) || 'unknown';
  const processId = getString(event, ['process_id', 'pid', 'processId']);
  const processKey = processId ? `${processName}#${processId}` : processName;
  const processLabel = processId ? `${processName} (${processId})` : processName;
  const name = getString(event, ['lock_name', 'function_name', 'name', 'function', 'lock', 'method']) || `${type}_${index + 1}`;

  return {
    id: `${type}-${index}-${name}-${resolvedStart}`,
    type,
    processKey,
    processLabel,
    name,
    start: resolvedStart,
    end: resolvedEnd,
    duration,
  };
};

export const ProfilingPanel: React.FC = () => {
  const { status, report, loading, working, error, fetchReport, startProfiling, stopProfiling, clearProfiling } = useProfiling();
  const [zoomPxPerSecond, setZoomPxPerSecond] = useState(300);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hovered, setHovered] = useState<HoveredEvent | null>(null);
  const [itemQuery, setItemQuery] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('all');
  const [visibleTypes, setVisibleTypes] = useState<Record<EventKind, boolean>>({
    lock: true,
    function: true,
  });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(zoomPxPerSecond);
  const wheelZoomFrameRef = useRef<number | null>(null);
  const pendingWheelZoomRef = useRef<{ factor: number; pointerX: number } | null>(null);
  const tooltipMoveFrameRef = useRef<number | null>(null);
  const tooltipPositionRef = useRef({ x: 0, y: 0 });

  const timelineData = useMemo(() => {
    const functionEventsRaw = Array.isArray(report?.timeline?.functions) ? report.timeline.functions : [];
    const lockEventsRaw = Array.isArray(report?.timeline?.locks) ? report.timeline.locks : [];
    const normalizedEvents = [
      ...functionEventsRaw.map((item, index) => extractTimelineEvent(item, 'function', index)).filter((item): item is TimelineEvent => item !== null),
      ...lockEventsRaw.map((item, index) => extractTimelineEvent(item, 'lock', index)).filter((item): item is TimelineEvent => item !== null),
    ].sort((a, b) => a.start - b.start);

    const processMap = new Map<string, string>();
    Object.entries(report?.processes || {}).forEach(([processName, info]) => {
      const processId = typeof info?.process_id === 'number' ? String(info.process_id) : '';
      const key = processId ? `${processName}#${processId}` : processName;
      processMap.set(key, processId ? `${processName} (${processId})` : processName);
    });
    normalizedEvents.forEach(event => {
      if (!processMap.has(event.processKey)) {
        processMap.set(event.processKey, event.processLabel);
      }
    });

    if (normalizedEvents.length === 0) {
      const metadataStart = Number(report?.metadata?.start_time || 0);
      const metadataEnd = Number(report?.metadata?.end_time || 0);
      const metadataDuration = metadataEnd > metadataStart ? metadataEnd - metadataStart : Number(report?.metadata?.collection_duration || 0);
      return {
        events: [] as TimelineEvent[],
        processRows: Array.from(processMap.entries()).map(([key, label]) => ({ key, label })),
        start: metadataStart,
        end: metadataStart + metadataDuration,
        duration: Math.max(metadataDuration, 0.001),
      };
    }

    const minStart = Math.min(...normalizedEvents.map(event => event.start));
    const maxEnd = Math.max(...normalizedEvents.map(event => event.end));
    return {
      events: normalizedEvents,
      processRows: Array.from(processMap.entries()).map(([key, label]) => ({ key, label })),
      start: minStart,
      end: maxEnd,
      duration: Math.max(maxEnd - minStart, 0.001),
    };
  }, [report]);

  const filteredEvents = useMemo(() => {
    const query = itemQuery.trim().toLowerCase();
    return timelineData.events.filter((event) => {
      if (!visibleTypes[event.type]) {
        return false;
      }
      if (selectedProcess !== 'all' && event.processKey !== selectedProcess) {
        return false;
      }
      if (!query) {
        return true;
      }
      return event.name.toLowerCase().includes(query) || event.processLabel.toLowerCase().includes(query);
    });
  }, [itemQuery, selectedProcess, timelineData.events, visibleTypes]);

  const processRows = useMemo(() => {
    if (selectedProcess !== 'all') {
      return timelineData.processRows.filter((row) => row.key === selectedProcess);
    }
    return timelineData.processRows;
  }, [selectedProcess, timelineData.processRows]);

  const eventsByProcess = useMemo(() => {
    const grouped: Record<string, TimelineEvent[]> = {};
    filteredEvents.forEach(event => {
      if (!grouped[event.processKey]) {
        grouped[event.processKey] = [];
      }
      grouped[event.processKey].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  const filteredEventIds = useMemo(() => new Set(filteredEvents.map((event) => event.id)), [filteredEvents]);
  const activeHovered = hovered && filteredEventIds.has(hovered.event.id) ? hovered : null;
  const hoveredEvent = activeHovered?.event ?? null;

  const overlapsWithHovered = useMemo(() => {
    if (!activeHovered) {
      return new Set<string>();
    }
    const overlapIds = new Set<string>();
    const sameProcessEvents = eventsByProcess[activeHovered.event.processKey] || [];
    sameProcessEvents.forEach((event) => {
      if (
        event.start < activeHovered.event.end
        && event.end > activeHovered.event.start
      ) {
        overlapIds.add(event.id);
      }
    });
    return overlapIds;
  }, [activeHovered, eventsByProcess]);

  const processLayoutByKey = useMemo(() => {
    const layoutByKey: Record<string, {
      events: TimelineEvent[];
      laneByEventId: Record<string, number>;
      rowHeight: number;
    }> = {};

    processRows.forEach((row) => {
      const events = [...(eventsByProcess[row.key] || [])]
        .sort((a, b) => (a.start - b.start) || (b.duration - a.duration));
      const laneByEventId: Record<string, number> = {};
      const laneEndTimes: number[] = [];

      events.forEach((event) => {
        let laneIndex = laneEndTimes.findIndex((laneEndTime) => laneEndTime <= event.start);
        if (laneIndex === -1) {
          laneIndex = laneEndTimes.length;
          laneEndTimes.push(event.end);
        } else {
          laneEndTimes[laneIndex] = event.end;
        }
        laneByEventId[event.id] = laneIndex;
      });

      const laneCount = Math.max(laneEndTimes.length, 1);
      const timelineHeight = (laneCount * EVENT_BAR_HEIGHT) + ((laneCount - 1) * EVENT_LANE_GAP);
      const rowHeight = Math.max(MIN_PROCESS_ROW_HEIGHT, timelineHeight + (ROW_VERTICAL_PADDING * 2));

      layoutByKey[row.key] = {
        events,
        laneByEventId,
        rowHeight,
      };
    });

    return layoutByKey;
  }, [eventsByProcess, processRows]);

  const chartWidth = Math.max(timelineData.duration * zoomPxPerSecond, 1200);
  const tickStep = getTickStep(timelineData.duration);
  const ticks = useMemo(() => {
    const tickValues: number[] = [];
    const tickCount = Math.ceil(timelineData.duration / tickStep);
    for (let i = 0; i <= tickCount; i += 1) {
      tickValues.push(i * tickStep);
    }
    return tickValues;
  }, [tickStep, timelineData.duration]);

  const hoverStartOffset = hoveredEvent ? hoveredEvent.start - timelineData.start : 0;
  const hoverEndOffset = hoveredEvent ? hoveredEvent.end - timelineData.start : 0;
  const hoverStartPx = hoveredEvent ? (hoverStartOffset / timelineData.duration) * chartWidth : 0;
  const hoverEndPx = hoveredEvent ? (hoverEndOffset / timelineData.duration) * chartWidth : 0;

  const clampZoom = useCallback((zoom: number) => {
    return Math.min(40000, Math.max(10, zoom));
  }, []);

  const getTimelineWorldX = useCallback((zoom: number, scrollLeft: number, pointerX: number) => {
    return (scrollLeft + pointerX - PROCESS_LABEL_WIDTH) / zoom;
  }, []);

  const applyZoomAroundPointerImmediate = useCallback((newZoom: number, pointerX?: number) => {
    const container = scrollContainerRef.current;
    if (!container) {
      const clampedZoom = clampZoom(newZoom);
      zoomRef.current = clampedZoom;
      setZoomPxPerSecond(clampedZoom);
      return;
    }

    const oldZoom = zoomRef.current;
    const clampedZoom = clampZoom(newZoom);
    if (oldZoom === clampedZoom) {
      return;
    }

    const anchorX = pointerX ?? container.clientWidth / 2;
    const timelineWorldX = getTimelineWorldX(oldZoom, container.scrollLeft, anchorX);
    zoomRef.current = clampedZoom;
    setZoomPxPerSecond(clampedZoom);
    container.scrollLeft = Math.max(0, (timelineWorldX * clampedZoom) + PROCESS_LABEL_WIDTH - anchorX);
  }, [clampZoom, getTimelineWorldX]);

  const flushWheelZoom = useCallback(() => {
    wheelZoomFrameRef.current = null;
    const pendingZoom = pendingWheelZoomRef.current;
    pendingWheelZoomRef.current = null;
    if (!pendingZoom) {
      return;
    }
    applyZoomAroundPointerImmediate(zoomRef.current * pendingZoom.factor, pendingZoom.pointerX);
  }, [applyZoomAroundPointerImmediate]);

  const updateTooltipPosition = useCallback((clientX: number, clientY: number) => {
    tooltipPositionRef.current = { x: clientX + 12, y: clientY + 12 };
    if (tooltipMoveFrameRef.current !== null) {
      return;
    }
    tooltipMoveFrameRef.current = requestAnimationFrame(() => {
      tooltipMoveFrameRef.current = null;
      const tooltip = tooltipRef.current;
      if (!tooltip) {
        return;
      }
      const { x, y } = tooltipPositionRef.current;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });
  }, []);

  const onTimelineWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;

    if (event.ctrlKey || event.shiftKey) {
      event.preventDefault();
      const zoomFactor = Math.exp(-event.deltaY * 0.01);
      const pendingZoom = pendingWheelZoomRef.current;
      if (pendingZoom) {
        pendingZoom.factor *= zoomFactor;
        pendingZoom.pointerX = pointerX;
      } else {
        pendingWheelZoomRef.current = { factor: zoomFactor, pointerX };
      }
      if (wheelZoomFrameRef.current === null) {
        wheelZoomFrameRef.current = requestAnimationFrame(flushWheelZoom);
      }
      return;
    }

    event.preventDefault();
    const panAmount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    container.scrollLeft += panAmount;
  }, [flushWheelZoom]);

  useEffect(() => {
    zoomRef.current = zoomPxPerSecond;
  }, [zoomPxPerSecond]);

  useEffect(() => {
    return () => {
      if (wheelZoomFrameRef.current !== null) {
        cancelAnimationFrame(wheelZoomFrameRef.current);
      }
      if (tooltipMoveFrameRef.current !== null) {
        cancelAnimationFrame(tooltipMoveFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!autoRefresh || !status?.is_collecting) {
      return;
    }

    const timer = setInterval(() => {
      void fetchReport(false);
    }, 500);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchReport, status?.is_collecting]);

  const toggleCollecting = async () => {
    if (status?.is_collecting) {
      await stopProfiling();
      return;
    }
    await startProfiling();
  };

  const typeFilterButtonClass: Record<EventKind, string> = {
    lock: 'bg-fuchsia-600 hover:bg-fuchsia-700 dark:bg-fuchsia-600 dark:hover:bg-fuchsia-700 text-white dark:text-white',
    function: 'bg-sky-600 hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-700 text-white dark:text-white',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-main-400 dark:border-main-800 px-2 py-1 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={status?.is_collecting ? 'text-lime-500 font-bold' : 'text-main-500'}>
            {status?.is_collecting ? 'Collecting' : 'Stopped'}
          </span>
          <span className="text-main-700 dark:text-main-300">
            {status ? `${status.total_processes} processes • ${status.total_function_events} fn • ${status.total_lock_events} locks` : 'No profiling status yet'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button onClick={() => void toggleCollecting()} disabled={working}>
            {status?.is_collecting ? 'Stop' : 'Start'}
          </Button>
          <Button onClick={() => void fetchReport(false)} disabled={loading}>Refresh</Button>
          <Button onClick={() => void clearProfiling()} disabled={working}>Clear</Button>
        </div>
      </div>

      <div className="border-b border-main-400 dark:border-main-800 px-2 py-1 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={itemQuery}
            onChange={(event) => setItemQuery(event.target.value)}
            placeholder="Filter items/processes..."
            className="w-52 px-1 py-0.5 text-xs bg-main-100 dark:bg-main-800 text-main-900 dark:text-white border border-main-400 dark:border-main-700 focus:outline-none focus:border-blue-500"
          />
          <select
            value={selectedProcess}
            onChange={(event) => setSelectedProcess(event.target.value)}
            className="px-1 py-0.5 text-xs bg-main-100 dark:bg-main-800 text-main-900 dark:text-white border border-main-400 dark:border-main-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All processes</option>
            {timelineData.processRows.map((row) => (
              <option key={row.key} value={row.key}>{row.label}</option>
            ))}
          </select>
          <Button
            active={visibleTypes.lock}
            activeClass={typeFilterButtonClass.lock}
            onClick={() => setVisibleTypes((prev) => ({ ...prev, lock: !prev.lock }))}
          >
            Locks
          </Button>
          <Button
            active={visibleTypes.function}
            activeClass={typeFilterButtonClass.function}
            onClick={() => setVisibleTypes((prev) => ({ ...prev, function: !prev.function }))}
          >
            Functions
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-main-800 dark:text-main-200">
            <span>Zoom</span>
            <input
              type="range"
              min={10}
              max={40000}
              value={zoomPxPerSecond}
              onChange={(e) => {
                const container = scrollContainerRef.current;
                const anchorX = container ? container.clientWidth / 2 : 0;
                applyZoomAroundPointerImmediate(Number(e.target.value), anchorX);
              }}
              className="w-36"
            />
          </label>
          <span className="text-main-700 dark:text-main-300 w-16 text-right">{Math.round(zoomPxPerSecond)}x</span>
          <Button active={autoRefresh} onClick={() => setAutoRefresh(prev => !prev)}>
            Auto-refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-2 py-1 text-xs text-red-500 border-b border-main-400 dark:border-main-800">{error}</div>
      )}

      <div ref={scrollContainerRef} onWheel={onTimelineWheel} className="flex-1 overflow-auto relative">
        {timelineData.events.length === 0 && processRows.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-main-600 text-xs p-3 text-center">
            No timeline events yet. Start profiling, run robot actions, then refresh report.
          </div>
        ) : (
          <div className="min-w-max relative">
            {filteredEvents.length === 0 && (
              <div className="px-2 py-1 text-xs bg-main-200/90 dark:bg-main-900/90 text-main-700 dark:text-main-300 border-b border-main-400 dark:border-main-800">
                No events match the current filters. Process rows remain visible for context.
              </div>
            )}
            <div className="sticky top-0 z-30 flex border-b border-main-400 dark:border-main-800 bg-main-100 dark:bg-main-950">
              <div className="w-52 flex-none px-2 py-1 font-semibold text-main-800 dark:text-main-200 text-xs border-r border-main-400 dark:border-main-800">
                Process
              </div>
              <div className="relative h-7" style={{ width: `${chartWidth}px` }}>
                {ticks.map(tick => (
                  <div key={tick} className="absolute top-0 h-full border-l border-main-300/60 dark:border-main-700/60" style={{ left: `${(tick / timelineData.duration) * chartWidth}px` }}>
                    <span className="absolute top-0 left-1 text-[10px] text-main-600 dark:text-main-400">+{tick.toFixed(tick < 1 ? 2 : 1)}s</span>
                  </div>
                ))}
              </div>
            </div>

            {processRows.map(row => (
              <div key={row.key} className="flex border-b border-main-300 dark:border-main-900">
                <div className="w-52 flex-none px-2 py-2 text-xs text-main-900 dark:text-main-200 border-r border-main-300 dark:border-main-900">
                  {row.label}
                </div>
                <div
                  className="relative"
                  style={{
                    width: `${chartWidth}px`,
                    height: `${processLayoutByKey[row.key]?.rowHeight ?? MIN_PROCESS_ROW_HEIGHT}px`,
                  }}
                >
                  {ticks.map(tick => (
                    <div key={`${row.key}-${tick}`} className="absolute top-0 h-full border-l border-main-200/70 dark:border-main-800/70" style={{ left: `${(tick / timelineData.duration) * chartWidth}px` }} />
                  ))}
                  {activeHovered && (
                    <>
                      <div className="absolute top-0 h-full border-l border-amber-400/80 dark:border-amber-300/80 pointer-events-none" style={{ left: `${hoverStartPx}px` }} />
                      <div className="absolute top-0 h-full border-l border-amber-400/80 dark:border-amber-300/80 pointer-events-none" style={{ left: `${hoverEndPx}px` }} />
                    </>
                  )}
                  {(processLayoutByKey[row.key]?.events || []).map(event => {
                    const left = ((event.start - timelineData.start) / timelineData.duration) * chartWidth;
                    const width = Math.max((event.duration / timelineData.duration) * chartWidth, 2);
                    const laneIndex = processLayoutByKey[row.key]?.laneByEventId[event.id] ?? 0;
                    const top = ROW_VERTICAL_PADDING + (laneIndex * (EVENT_BAR_HEIGHT + EVENT_LANE_GAP));
                    const colorPalette = event.type === 'lock' ? LOCK_COLORS : FUNCTION_COLORS;
                    const colorClass = colorPalette[hashString(event.name) % colorPalette.length];
                    const isOverlap = overlapsWithHovered.has(event.id);
                    const isHovered = activeHovered?.event.id === event.id;
                    const shouldDim = activeHovered !== null && !isOverlap;
                    const showLabel = width >= 64;

                    return (
                      <div
                        key={event.id}
                        className={`absolute rounded ${colorClass} cursor-pointer ring-1 ring-black/10 dark:ring-white/15 ${shouldDim ? 'opacity-20' : 'opacity-100'} ${isOverlap ? 'ring-2 ring-amber-300 dark:ring-amber-200' : ''} ${isHovered ? 'outline outline-1 outline-white/90' : ''}`}
                        style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${EVENT_BAR_HEIGHT}px` }}
                        onMouseEnter={(mouseEvent) => {
                          updateTooltipPosition(mouseEvent.clientX, mouseEvent.clientY);
                          setHovered({ event, x: mouseEvent.clientX + 12, y: mouseEvent.clientY + 12 });
                        }}
                        onMouseMove={(mouseEvent) => updateTooltipPosition(mouseEvent.clientX, mouseEvent.clientY)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {showLabel && (
                          <span className="block px-1 leading-[22px] text-[10px] text-white/95 truncate select-none">
                            {event.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeHovered && (
        <div ref={tooltipRef} className="fixed z-50 pointer-events-none bg-main-100 dark:bg-main-950 border border-main-400 dark:border-main-700 px-2 py-1 text-xs text-main-900 dark:text-main-100 shadow-lg" style={{ left: activeHovered.x, top: activeHovered.y }}>
          <div className="font-semibold">{activeHovered.event.type.toUpperCase()} • {activeHovered.event.name}</div>
          <div>{activeHovered.event.processLabel}</div>
          <div>Duration: {formatSeconds(activeHovered.event.duration)}</div>
          <div>Start: +{formatSeconds(activeHovered.event.start - timelineData.start)}</div>
          <div>End: +{formatSeconds(activeHovered.event.end - timelineData.start)}</div>
          <div>Overlaps: {overlapsWithHovered.size}</div>
        </div>
      )}
    </div>
  );
};
