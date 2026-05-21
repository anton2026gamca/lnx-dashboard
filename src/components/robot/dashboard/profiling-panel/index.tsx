'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
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


const LOCK_COLORS = ['bg-rose-500', 'bg-orange-500', 'bg-lime-500', 'bg-yellow-500'];
const FUNCTION_COLORS = [
  'bg-sky-800', 'bg-indigo-800', 'bg-purple-800', 'bg-blue-800',
  'bg-fuchsia-800', 'bg-cyan-800', 'bg-rose-800', 'bg-violet-800',
];
const HOVER_PADDING_PX = 6;
const TIMELINE_PADDING_S = 0.1;
const PROCESS_LABEL_WIDTH = 209;
const EVENT_BAR_HEIGHT = 22;
const EVENT_LANE_GAP = 3;
const ROW_VERTICAL_PADDING = 6;
const MIN_PROCESS_ROW_HEIGHT = 44;


function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}


const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const getNumber = (source: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const getString = (source: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
};

const formatSeconds = (seconds: number): string => {
  if (seconds < 0.001) return `${(seconds * 1_000_000).toFixed(1)}µs`;
  if (seconds < 1) return `${(seconds * 1_000).toFixed(2)}ms`;
  return `${seconds.toFixed(3)}s`;
};

const getTickStep = (duration: number): number => {
  const rough = Math.max(duration / 8, 0.001);
  const steps = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60];
  return steps.find(s => s >= rough) ?? 60;
};

const extractTimelineEvent = (item: unknown, type: EventKind, index: number): TimelineEvent | null => {
  const event = asRecord(item);
  const start = getNumber(event, ['start_time', 'start', 'timestamp', 'time', 'acquire_time', 'ts']);
  const end = getNumber(event, ['end_time', 'end', 'stop_time', 'release_time', 'finish_time']);
  const dur = getNumber(event, ['duration', 'total_time', 'execution_time', 'elapsed', 'elapsed_time', 'hold_time', 'wait_time']);
  const resolvedStart = start ?? (end !== null && dur !== null ? end - dur : null);
  const resolvedEnd = end ?? (resolvedStart !== null && dur !== null ? resolvedStart + dur : null);
  if (resolvedStart === null || resolvedEnd === null) return null;
  const duration = Math.max(resolvedEnd - resolvedStart, 0);
  const processName = getString(event, ['process_name', 'process', 'process_label', 'processName']) || 'unknown';
  const processId = getString(event, ['process_id', 'pid', 'processId']);
  const processKey = processId ? `${processName}#${processId}` : processName;
  const processLabel = processId ? `${processName} (${processId})` : processName;
  const name = getString(event, ['lock_name', 'function_name', 'name', 'function', 'lock', 'method']) || `${type}_${index + 1}`;
  return { id: `${type}-${index}-${name}-${resolvedStart}`, type, processKey, processLabel, name, start: resolvedStart, end: resolvedEnd, duration };
};


function buildSpatialIndex(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const byProcess = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    let arr = byProcess.get(ev.processKey);
    if (!arr) { arr = []; byProcess.set(ev.processKey, arr); }
    arr.push(ev);
  }
  for (const arr of byProcess.values()) arr.sort((a, b) => a.start - b.start);
  return byProcess;
}

function findOverlaps(index: Map<string, TimelineEvent[]>, target: TimelineEvent): Set<string> {
  const arr = index.get(target.processKey);
  if (!arr) return new Set();
  const result = new Set<string>();
  let lo = 0, hi = arr.length - 1, first = arr.length;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].start < target.end) { first = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  for (let i = first; i >= 0; i--) {
    if (arr[i].end <= target.start) break;
    if (arr[i].start < target.end) result.add(arr[i].id);
  }
  return result;
}

function findSameLockName(events: TimelineEvent[], lockName: string): Set<string> {
  const result = new Set<string>();
  for (const ev of events) {
    if (ev.type === 'lock' && ev.name === lockName) result.add(ev.id);
  }
  return result;
}


interface VirtualRowProps {
  row: { key: string; label: string };
  chartWidth: number;
  timelineDuration: number;
  timelineStart: number;
  layout: { events: TimelineEvent[]; laneByEventId: Record<string, number>; rowHeight: number } | undefined;
  ticks: number[];
  hoveredEventId: string | null;
  highlightedIds: Set<string>;
  hoverStartPx: number;
  hoverEndPx: number;
  showHoverLines: boolean;
  scrollLeft: number;
  viewportWidth: number;
  onEnter: (event: TimelineEvent, clientX: number, clientY: number) => void;
  onMove: (clientX: number, clientY: number) => void;
  onLeave: () => void;
}

const VirtualRow = React.memo(function VirtualRow({
  row, chartWidth, timelineDuration, timelineStart, layout,
  ticks, hoveredEventId, highlightedIds, hoverStartPx, hoverEndPx,
  showHoverLines, scrollLeft, viewportWidth, onEnter, onMove, onLeave,
}: VirtualRowProps) {
  const rowHeight = layout?.rowHeight ?? MIN_PROCESS_ROW_HEIGHT;
  const visLeft = Math.max(0, scrollLeft - 128);
  const visRight = scrollLeft + viewportWidth + 128;

  const visibleEvents = useMemo(() => {
    if (!layout) return [];
    return layout.events.filter(ev => {
      const left = ((ev.start - timelineStart) / timelineDuration) * chartWidth;
      const width = Math.max((ev.duration / timelineDuration) * chartWidth, 2);
      return left + width >= visLeft && left <= visRight;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, chartWidth, timelineDuration, timelineStart, visLeft, visRight]);

  return (
    <div className="flex border-b border-main-300 dark:border-main-900">
      <div className="w-40 flex-none px-2 py-2 text-xs text-main-900 dark:text-main-200 border-r border-main-300 dark:border-main-900 bg-main-50 dark:bg-main-950 sticky left-0 z-10">
        {row.label}
      </div>
      <div
        className="relative"
        style={{ width: `${chartWidth}px`, height: `${rowHeight}px` }}
      >
        {ticks.map(tick => (
          <div
            key={tick}
            className="absolute top-0 h-full border-l border-main-200/70 dark:border-main-800/70"
            style={{ left: `${(tick / timelineDuration) * chartWidth}px` }}
          />
        ))}
        {showHoverLines && (
          <>
            <div className="absolute top-0 h-full border-l border-amber-400/80 dark:border-amber-300/80 pointer-events-none" style={{ left: `${hoverStartPx}px` }} />
            <div className="absolute top-0 h-full border-l border-amber-400/80 dark:border-amber-300/80 pointer-events-none" style={{ left: `${hoverEndPx}px` }} />
          </>
        )}
        {visibleEvents.map(event => {
          const left = ((event.start - timelineStart) / timelineDuration) * chartWidth;
          const width = Math.max((event.duration / timelineDuration) * chartWidth, 2);
          const laneIndex = layout?.laneByEventId[event.id] ?? 0;
          const top = ROW_VERTICAL_PADDING + laneIndex * (EVENT_BAR_HEIGHT + EVENT_LANE_GAP);
          const colorPalette = event.type === 'lock' ? LOCK_COLORS : FUNCTION_COLORS;
          const colorClass = colorPalette[hashString(event.name) % colorPalette.length];
          const isHovered = hoveredEventId === event.id;
          const isHighlighted = highlightedIds.has(event.id);
          const shouldDim = hoveredEventId !== null && !isHighlighted;
          const showLabel = width >= 64;

          return (
            <div
              key={event.id}
              className="absolute"
              style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${EVENT_BAR_HEIGHT}px` }}
            >
              <div
                className={`absolute inset-0 rounded ${colorClass} ring-1 ring-black/10 dark:ring-white/15 transition-opacity duration-75 ${shouldDim ? 'opacity-20' : 'opacity-100'} ${isHighlighted && !isHovered ? 'ring-2 ring-amber-300 dark:ring-amber-200' : ''} ${isHovered ? 'outline outline-1 outline-white/90 ring-2 ring-amber-300 dark:ring-amber-200' : ''}`}
              >
                {showLabel && (
                  <span className="block px-1 leading-[22px] text-[10px] text-white/95 truncate select-none pointer-events-none">
                    {event.name}
                  </span>
                )}
              </div>
              <div
                className="absolute cursor-pointer"
                style={{
                  inset: `-${HOVER_PADDING_PX}px`,
                  zIndex: isHovered ? 2 : 1,
                }}
                onMouseEnter={e => onEnter(event, e.clientX, e.clientY)}
                onMouseMove={e => onMove(e.clientX, e.clientY)}
                onMouseLeave={onLeave}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});


export const ProfilingPanel: React.FC = () => {
  const { status, report, loading, working, error, fetchReport, startProfiling, stopProfiling, clearProfiling } = useProfiling();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [itemQuery, setItemQuery] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('all');
  const [visibleTypes, setVisibleTypes] = useState<Record<EventKind, boolean>>({ lock: true, function: true });

  const targetZoomRef = useRef(300);
  const displayZoomRef = useRef(300);
  const [displayZoom, setDisplayZoom] = useState(300);
  const zoomAnimFrameRef = useRef<number | null>(null);
  const zoomAnimStartRef = useRef<number | null>(null);
  const zoomAnimFromRef = useRef(300);
  const zoomAnimToRef = useRef(300);
  const zoomAnchorWorldRef = useRef<number | null>(null);
  const zoomAnchorPointerXRef = useRef<number>(0);

  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(1200);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredEventRef = useRef<TimelineEvent | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipMoveFrameRef = useRef<number | null>(null);
  const tooltipPositionRef = useRef({ x: 0, y: 0 });
  const shouldScrollToEndRef = useRef(false);


  const timelineData = useMemo(() => {
    const functionEventsRaw = Array.isArray(report?.timeline?.functions) ? report.timeline.functions : [];
    const lockEventsRaw = Array.isArray(report?.timeline?.locks) ? report.timeline.locks : [];
    const normalizedEvents = [
      ...functionEventsRaw.map((item: unknown, i: number) => extractTimelineEvent(item, 'function', i)).filter((x): x is TimelineEvent => x !== null),
      ...lockEventsRaw.map((item: unknown, i: number) => extractTimelineEvent(item, 'lock', i)).filter((x): x is TimelineEvent => x !== null),
    ].sort((a, b) => a.start - b.start);

    const processMap = new Map<string, string>();
    Object.entries(report?.processes || {}).forEach(([name, info]) => {
      const pid = typeof info.process_id === 'number'
        ? String(info.process_id) : '';
      const key = pid ? `${name}#${pid}` : name;
      processMap.set(key, pid ? `${name} (${pid})` : name);
    });
    normalizedEvents.forEach(ev => { if (!processMap.has(ev.processKey)) processMap.set(ev.processKey, ev.processLabel); });

    if (normalizedEvents.length === 0) {
      const ms = Number(report?.metadata?.start_time || 0);
      const me = Number(report?.metadata?.end_time || 0);
      const md = me > ms ? me - ms : Number(report?.metadata?.collection_duration || 0);
      return {
        events: [] as TimelineEvent[],
        processRows: Array.from(processMap.entries()).map(([key, label]) => ({ key, label })),
        start: ms, end: ms + md, duration: Math.max(md + TIMELINE_PADDING_S, 0.001),
      };
    }

    const minStart = normalizedEvents[0].start;
    const maxEnd = Math.max(...normalizedEvents.map(e => e.end));
    const paddedDuration = Math.max(maxEnd - minStart + TIMELINE_PADDING_S, 0.001);
    return {
      events: normalizedEvents,
      processRows: Array.from(processMap.entries()).map(([key, label]) => ({ key, label })),
      start: minStart, end: maxEnd, duration: paddedDuration,
    };
  }, [report]);

  useEffect(() => {
    if (shouldScrollToEndRef.current) {
      shouldScrollToEndRef.current = false;
      const container = scrollContainerRef.current;
      if (container) container.scrollLeft = (timelineData.duration - TIMELINE_PADDING_S) * displayZoom - container.clientWidth / 2;
    }
  }, [timelineData]);


  const spatialIndex = useMemo(() => buildSpatialIndex(timelineData.events), [timelineData.events]);


  const filteredEvents = useMemo(() => {
    const query = itemQuery.trim().toLowerCase();
    return timelineData.events.filter(ev => {
      if (!visibleTypes[ev.type]) return false;
      if (selectedProcess !== 'all' && ev.processKey !== selectedProcess) return false;
      if (!query) return true;
      return ev.name.toLowerCase().includes(query) || ev.processLabel.toLowerCase().includes(query);
    });
  }, [itemQuery, selectedProcess, timelineData.events, visibleTypes]);

  const processRows = useMemo(() => {
    if (selectedProcess !== 'all') return timelineData.processRows.filter(r => r.key === selectedProcess);
    return timelineData.processRows;
  }, [selectedProcess, timelineData.processRows]);

  const eventsByProcess = useMemo(() => {
    const grouped: Record<string, TimelineEvent[]> = {};
    filteredEvents.forEach(ev => { (grouped[ev.processKey] ??= []).push(ev); });
    return grouped;
  }, [filteredEvents]);


  const processLayoutByKey = useMemo(() => {
    const result: Record<string, { events: TimelineEvent[]; laneByEventId: Record<string, number>; rowHeight: number }> = {};
    processRows.forEach(row => {
      const events = [...(eventsByProcess[row.key] || [])].sort((a, b) => a.start - b.start || b.duration - a.duration);
      const laneByEventId: Record<string, number> = {};
      const laneEndTimes: number[] = [];
      events.forEach(ev => {
        let lane = laneEndTimes.findIndex(t => t <= ev.start);
        if (lane === -1) { lane = laneEndTimes.length; laneEndTimes.push(ev.end); }
        else laneEndTimes[lane] = ev.end;
        laneByEventId[ev.id] = lane;
      });
      const laneCount = Math.max(laneEndTimes.length, 1);
      const timelineHeight = laneCount * EVENT_BAR_HEIGHT + (laneCount - 1) * EVENT_LANE_GAP;
      const rowHeight = Math.max(MIN_PROCESS_ROW_HEIGHT, timelineHeight + ROW_VERTICAL_PADDING * 2);
      result[row.key] = { events, laneByEventId, rowHeight };
    });
    return result;
  }, [eventsByProcess, processRows]);


  const chartWidth = Math.max(timelineData.duration * displayZoom, 1200);

  const clampZoom = useCallback((z: number) => Math.min(100000, Math.max(10, z)), []);

  const startZoomAnimation = useCallback((newZoom: number) => {
    const clamped = clampZoom(newZoom);
    targetZoomRef.current = clamped;
    zoomAnimFromRef.current = displayZoomRef.current;
    zoomAnimToRef.current = clamped;
    zoomAnimStartRef.current = null;

    if (zoomAnimFrameRef.current !== null) return;

    const tick = (now: number) => {
      if (zoomAnimStartRef.current === null) zoomAnimStartRef.current = now;
      const elapsed = now - zoomAnimStartRef.current;
      const ANIM_MS = 1;
      const t = Math.min(elapsed / ANIM_MS, 1);
      const easedT = easeOut(t);

      const from = zoomAnimFromRef.current;
      const to = zoomAnimToRef.current;
      const current = from + (to - from) * easedT;

      const container = scrollContainerRef.current;
      if (container && zoomAnchorWorldRef.current !== null) {
        container.scrollLeft = Math.max(
          0,
          zoomAnchorWorldRef.current * current + PROCESS_LABEL_WIDTH - zoomAnchorPointerXRef.current,
        );
      }

      displayZoomRef.current = current;
      setDisplayZoom(current);

      if (t < 1) {
        zoomAnimFrameRef.current = requestAnimationFrame(tick);
      } else {
        zoomAnimFrameRef.current = null;
        zoomAnchorWorldRef.current = null;
      }
    };

    zoomAnimFrameRef.current = requestAnimationFrame(tick);
  }, [clampZoom]);

  const setZoomAnchor = useCallback((pointerX: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const sl = container.scrollLeft;
    zoomAnchorWorldRef.current = (sl + pointerX - PROCESS_LABEL_WIDTH) / displayZoomRef.current;
    zoomAnchorPointerXRef.current = pointerX;
  }, []);


  const pendingWheelRef = useRef<{ deltaY: number; pointerX: number } | null>(null);
  const wheelRafRef = useRef<number | null>(null);

  const flushWheel = useCallback(() => {
    wheelRafRef.current = null;
    const p = pendingWheelRef.current;
    pendingWheelRef.current = null;
    if (!p) return;
    setZoomAnchor(p.pointerX);
    const factor = Math.exp(-p.deltaY * 0.004);
    startZoomAnimation(targetZoomRef.current * factor);
  }, [setZoomAnchor, startZoomAnimation]);

  const onTimelineWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;

    if (e.ctrlKey || e.shiftKey) {
      e.preventDefault();
      const p = pendingWheelRef.current;
      if (p) { p.deltaY += e.deltaY; p.pointerX = pointerX; }
      else pendingWheelRef.current = { deltaY: e.deltaY, pointerX };
      if (wheelRafRef.current === null) wheelRafRef.current = requestAnimationFrame(flushWheel);
      return;
    }

    e.preventDefault();
    container.scrollLeft += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  }, [flushWheel]);


  const updateTooltipPosition = useCallback((clientX: number, clientY: number) => {
    tooltipPositionRef.current = { x: clientX + 12, y: clientY + 12 };
    if (tooltipMoveFrameRef.current !== null) return;
    tooltipMoveFrameRef.current = requestAnimationFrame(() => {
      tooltipMoveFrameRef.current = null;
      const el = tooltipRef.current;
      if (!el) return;
      el.style.left = `${tooltipPositionRef.current.x}px`;
      el.style.top = `${tooltipPositionRef.current.y}px`;
    });
  }, []);


  const handleEnter = useCallback((event: TimelineEvent, clientX: number, clientY: number) => {
    hoveredEventRef.current = event;

    const overlaps = findOverlaps(spatialIndex, event);
    let combined = overlaps;
    if (event.type === 'lock') {
      const sameName = findSameLockName(timelineData.events, event.name);
      combined = new Set([...overlaps, ...sameName]);
    }
    setHighlightedIds(combined);
    setHoveredId(event.id);

    const el = tooltipRef.current;
    if (el) {
      el.style.display = 'block';
      el.style.left = `${clientX + 12}px`;
      el.style.top = `${clientY + 12}px`;
    }
    updateTooltipPosition(clientX, clientY);
  }, [spatialIndex, timelineData.events, updateTooltipPosition]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    updateTooltipPosition(clientX, clientY);
  }, [updateTooltipPosition]);

  const handleLeave = useCallback(() => {
    hoveredEventRef.current = null;
    setHighlightedIds(new Set());
    setHoveredId(null);
    const el = tooltipRef.current;
    if (el) el.style.display = 'none';
  }, []);


  const scrollRafRef = useRef<number | null>(null);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        setScrollLeft(container.scrollLeft);
        setViewportWidth(container.clientWidth);
      });
    };
    const handleResize = () => setViewportWidth(container.clientWidth);
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    setViewportWidth(container.clientWidth);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  useEffect(() => () => {
    if (zoomAnimFrameRef.current !== null) cancelAnimationFrame(zoomAnimFrameRef.current);
    if (wheelRafRef.current !== null) cancelAnimationFrame(wheelRafRef.current);
    if (tooltipMoveFrameRef.current !== null) cancelAnimationFrame(tooltipMoveFrameRef.current);
  }, []);


  useEffect(() => {
    if (!autoRefresh || !status?.is_collecting) return;
    const timer = setInterval(() => {
      shouldScrollToEndRef.current = true;
      void fetchReport(false);
    }, 500);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchReport, status?.is_collecting]);


  const tickStep = getTickStep(timelineData.duration);
  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= Math.ceil(timelineData.duration / tickStep); i++) arr.push(i * tickStep);
    return arr;
  }, [tickStep, timelineData.duration]);


  const hoveredEvent = hoveredEventRef.current;
  const hoverStartPx = hoveredEvent ? ((hoveredEvent.start - timelineData.start) / timelineData.duration) * chartWidth : 0;
  const hoverEndPx = hoveredEvent ? ((hoveredEvent.end - timelineData.start) / timelineData.duration) * chartWidth : 0;

  const typeFilterButtonClass: Record<EventKind, string> = {
    lock: 'bg-fuchsia-600 hover:bg-fuchsia-700 dark:bg-fuchsia-600 dark:hover:bg-fuchsia-700 text-white dark:text-white',
    function: 'bg-sky-600 hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-700 text-white dark:text-white',
  };

  const toggleCollecting = async () => {
    if (status?.is_collecting) { await stopProfiling(); return; }
    await startProfiling();
  };


  return (
    <div className="h-full flex flex-col">
      {/* Status bar */}
      <div className="border-b border-main-400 dark:border-main-800 px-2 py-1 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={status?.is_collecting ? 'text-lime-500 font-bold' : 'text-main-500'}>
            {status?.is_collecting ? 'Collecting' : 'Stopped'}
          </span>
          <span className="text-main-700 dark:text-main-300">
            {status
              ? `${status.total_processes} processes • ${status.total_function_events} fn • ${status.total_lock_events} locks`
              : 'No profiling status yet'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button onClick={() => void toggleCollecting()} disabled={working}>{status?.is_collecting ? 'Stop' : 'Start'}</Button>
          <Button onClick={() => void fetchReport(false)} disabled={loading}>Refresh</Button>
          <Button onClick={() => void clearProfiling()} disabled={working}>Clear</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="border-b border-main-400 dark:border-main-800 px-2 py-1 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={itemQuery}
            onChange={e => setItemQuery(e.target.value)}
            placeholder="Filter items/processes..."
            className="w-52 px-1 py-0.5 text-xs bg-main-100 dark:bg-main-800 text-main-900 dark:text-white border border-main-400 dark:border-main-700 focus:outline-none focus:border-blue-500"
          />
          <select
            value={selectedProcess}
            onChange={e => setSelectedProcess(e.target.value)}
            className="px-1 py-0.5 text-xs bg-main-100 dark:bg-main-800 text-main-900 dark:text-white border border-main-400 dark:border-main-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All processes</option>
            {timelineData.processRows.map(row => <option key={row.key} value={row.key}>{row.label}</option>)}
          </select>
          <Button active={visibleTypes.lock} activeClass={typeFilterButtonClass.lock} onClick={() => setVisibleTypes(p => ({ ...p, lock: !p.lock }))}>Locks</Button>
          <Button active={visibleTypes.function} activeClass={typeFilterButtonClass.function} onClick={() => setVisibleTypes(p => ({ ...p, function: !p.function }))}>Functions</Button>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-main-800 dark:text-main-200">
            <span>Zoom</span>
            <input
              type="range"
              min={10}
              max={100000}
              value={Math.round(displayZoom)}
              onChange={e => {
                const container = scrollContainerRef.current;
                setZoomAnchor(container ? container.clientWidth / 2 : 0);
                startZoomAnimation(Number(e.target.value));
              }}
              className="w-36"
            />
          </label>
          <span className="text-main-700 dark:text-main-300 w-16 text-left">{Math.round(displayZoom)}x</span>
          <Button active={autoRefresh} onClick={() => setAutoRefresh(p => !p)}>Auto-refresh</Button>
        </div>
      </div>

      {error && (
        <div className="px-2 py-1 text-xs text-red-500 border-b border-main-400 dark:border-main-800">{error}</div>
      )}

      {/* Timeline */}
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

            {/* Sticky header */}
            <div className="sticky top-0 z-30 flex border-b border-main-400 dark:border-main-800 bg-main-100 dark:bg-main-950">
              <div className="w-40 flex-none px-2 py-1 font-semibold text-main-800 dark:text-main-200 text-xs border-r border-main-400 dark:border-main-800 sticky left-0 z-10 bg-main-100 dark:bg-main-950">
                Process
              </div>
              <div className="relative h-7" style={{ width: `${chartWidth}px` }}>
                {ticks.map(tick => (
                  <div key={tick} className="absolute top-0 h-full border-l border-main-300/60 dark:border-main-700/60" style={{ left: `${(tick / timelineData.duration) * chartWidth}px` }}>
                    <span className="absolute top-0 left-1 text-[10px] text-main-600 dark:text-main-400">
                      +{tick.toFixed(tick < 1 ? 2 : 1)}s
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Process rows */}
            {processRows.map(row => (
              <VirtualRow
                key={row.key}
                row={row}
                chartWidth={chartWidth}
                timelineDuration={timelineData.duration}
                timelineStart={timelineData.start}
                layout={processLayoutByKey[row.key]}
                ticks={ticks}
                hoveredEventId={hoveredId}
                highlightedIds={highlightedIds}
                hoverStartPx={hoverStartPx}
                hoverEndPx={hoverEndPx}
                showHoverLines={hoveredId !== null}
                scrollLeft={scrollLeft}
                viewportWidth={viewportWidth}
                onEnter={handleEnter}
                onMove={handleMove}
                onLeave={handleLeave}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 pointer-events-none bg-main-100 dark:bg-main-950 border border-main-400 dark:border-main-700 px-2 py-1 text-xs text-main-900 dark:text-main-100 shadow-lg"
        style={{ display: 'none', left: 0, top: 0 }}
      >
        {hoveredId && hoveredEventRef.current && (() => {
          const ev = hoveredEventRef.current!;
          const sameLockCount = ev.type === 'lock'
            ? timelineData.events.filter(e => e.type === 'lock' && e.name === ev.name && e.processKey !== ev.processKey).length
            : 0;
          return (
            <>
              <div className="font-semibold">{ev.type.toUpperCase()} • {ev.name}</div>
              <div>{ev.processLabel}</div>
              <div>Duration: {formatSeconds(ev.duration)}</div>
              <div>Start: +{formatSeconds(ev.start - timelineData.start)}</div>
              <div>End: +{formatSeconds(ev.end - timelineData.start)}</div>
              <div>{sameLockCount > 0 ? 'Occurrences: ' : 'Overlaps in process:'} {highlightedIds.size - 1}</div>
            </>
          );
        })()}
      </div>
    </div>
  );
};
