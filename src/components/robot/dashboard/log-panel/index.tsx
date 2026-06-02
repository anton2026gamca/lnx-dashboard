'use client';

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLogs } from "@/hooks/useRobot";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LogEntry } from "@/types/robot";
import { ProfilingPanel } from "@/components/robot/dashboard/profiling-panel";

type ExportFormat = 'csv' | 'json' | 'txt';
type ExportScope = 'filtered' | 'all';

interface ExportSettings {
  format: ExportFormat;
  scope: ExportScope;
  includeTimestamp: boolean;
  includeLevel: boolean;
  includeLogger: boolean;
  includeMessage: boolean;
  timestampFormat: 'iso' | 'locale' | 'unix';
  dateRangeEnabled: boolean;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: 'csv',
  scope: 'filtered',
  includeTimestamp: true,
  includeLevel: true,
  includeLogger: true,
  includeMessage: true,
  timestampFormat: 'iso',
  dateRangeEnabled: false,
  dateFrom: '',
  dateTo: '',
};

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
  filteredCount: number;
  totalCount: number;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, filteredCount, totalCount }) => {
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);

  const set = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const labelClass = "text-xs font-bold text-main-700 dark:text-main-300 uppercase";
  const inputClass = "px-1 py-0.5 text-xs bg-main-100 dark:bg-main-800 text-main-900 dark:text-white border border-main-400 dark:border-main-700 focus:outline-none focus:border-blue-500 w-full";
  const sectionClass = "border-b border-main-300 dark:border-main-800 pb-2 mb-1";

  return (
    <Modal title="Export Logs" isOpen={isOpen} onClose={onClose} size="small">
      <div className="flex flex-col gap-1 text-xs text-main-900 dark:text-white">

        {/* Format */}
        <div className={sectionClass}>
          <div className={`${labelClass} mb-1.5`}>Format</div>
          <div className="flex gap-1">
            {(['csv', 'json', 'txt'] as ExportFormat[]).map(fmt => (
              <Button key={fmt} active={settings.format === fmt} onClick={() => set('format', fmt)}>
                {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Scope */}
        <div className={sectionClass}>
          <div className={`${labelClass} mb-1.5`}>Scope</div>
          <div className="flex gap-1">
            <Button active={settings.scope === 'filtered'} onClick={() => set('scope', 'filtered')}>
              Filtered ({filteredCount})
            </Button>
            <Button active={settings.scope === 'all'} onClick={() => set('scope', 'all')}>
              All ({totalCount})
            </Button>
          </div>
        </div>

        {/* Columns */}
        <div className={sectionClass}>
          <div className={`${labelClass} mb-1.5`}>Columns</div>
          <div className="flex flex-wrap gap-1">
            {([
              ['includeTimestamp', 'Timestamp'],
              ['includeLevel', 'Level'],
              ['includeLogger', 'Logger'],
              ['includeMessage', 'Message'],
            ] as [keyof ExportSettings, string][]).map(([key, label]) => (
              <Button key={key} active={settings[key] as boolean} onClick={() => set(key, !settings[key] as any)}>
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Timestamp Format */}
        {settings.includeTimestamp && (
          <div className={sectionClass}>
            <div className={`${labelClass} mb-1.5`}>Timestamp Format</div>
            <div className="flex gap-1">
              {([
                ['iso', 'ISO 8601'],
                ['locale', 'Local Time'],
                ['unix', 'Unix (s)'],
              ] as [ExportSettings['timestampFormat'], string][]).map(([val, label]) => (
                <Button key={val} active={settings.timestampFormat === val} onClick={() => set('timestampFormat', val)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Date Range */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={labelClass}>Date Range</span>
            <Button active={settings.dateRangeEnabled} onClick={() => set('dateRangeEnabled', !settings.dateRangeEnabled)}>
              {settings.dateRangeEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          {settings.dateRangeEnabled && (
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="text-main-600 dark:text-main-400 mb-0.5">From</div>
                <input type="datetime-local" className={inputClass} value={settings.dateFrom} onChange={e => set('dateFrom', e.target.value)} />
              </div>
              <div className="flex-1">
                <div className="text-main-600 dark:text-main-400 mb-0.5">To</div>
                <input type="datetime-local" className={inputClass} value={settings.dateTo} onChange={e => set('dateTo', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-1 pt-1">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            active
            onClick={() => { onExport(settings); onClose(); }}
          >
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
};


const parseLogMessage = (message: string): { text: string; color: string } => {
  const cleanText = message.replace(/\x1b\[[0-9;]*m/g, '').replace(/^.*?: /, '');
  
  let color = 'text-main-800 dark:text-white';
  
  if (message.includes('\x1b[1;31m') || message.includes('\x1b[91m')) {
    color = 'text-red-500';
  } else if (message.includes('\x1b[1;32m') || message.includes('\x1b[92m')) {
    color = 'text-green-500';
  } else if (message.includes('\x1b[1;33m') || message.includes('\x1b[93m')) {
    color = 'text-yellow-500';
  } else if (message.includes('\x1b[1;34m') || message.includes('\x1b[94m')) {
    color = 'text-blue-500';
  } else if (message.includes('\x1b[1;35m') || message.includes('\x1b[95m')) {
    color = 'text-purple-500';
  } else if (message.includes('\x1b[1;36m') || message.includes('\x1b[96m')) {
    color = 'text-cyan-500';
  } else if (message.includes('\x1b[1;37m') || message.includes('\x1b[97m')) {
    color = 'text-main-200 dark:text-white';
  } else if (message.includes('\x1b[30m') || message.includes('\x1b[90m')) {
    color = 'text-gray-500';
  }
  
  return { text: cleanText, color };
};

export const LogPanel: React.FC = () => {
  const { logs, setLogs, fetchLogs } = useLogs();

  const parentRef = useRef<HTMLDivElement>(null);
  const [panelMode, setPanelMode] = useState<'logs' | 'profiling'>(localStorage.getItem('logPanelMode') === 'profiling' ? 'profiling' : 'logs');
  const [searchQuery, setSearchQuery] = useState(localStorage.getItem('logSearchQuery') || '');
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set(JSON.parse(localStorage.getItem('logSelectedLevels') || '["info","warning","error","critical"]')));
  const [autoScroll, setAutoScroll] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handleSetPanelMode = (mode: 'logs' | 'profiling') => {
    setPanelMode(mode);
    localStorage.setItem('logPanelMode', mode);
  }

  const handleSetSearchQuery = (query: string) => {
    setSearchQuery(query);
    localStorage.setItem('logSearchQuery', query);
  }

  const handleSetSelectedLevels = (levels: Set<string>) => {
    setSelectedLevels(levels);
    localStorage.setItem('logSelectedLevels', JSON.stringify(Array.from(levels)));
  }
  
  const levelColorMap: Record<string, string> = {
    debug: 'text-blue-500',
    info: 'text-lime-600',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    critical: 'text-black bg-red-500',
  };

  const levelButtonMap: Record<string, string> = {
    debug: 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-black',
    info: 'bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-500 dark:hover:bg-lime-600 dark:text-black',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-black dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-black',
    error: 'bg-red-500 hover:bg-red-800 text-white dark:bg-red-500 dark:hover:bg-red-800 dark:text-black',
    critical: 'bg-red-500 hover:bg-red-800 text-white dark:bg-red-500 dark:hover:bg-red-800 dark:text-black',
  };

  const filterLogs = (logs: LogEntry[]) => {
    return logs.filter(log => {
      const level = (log.level.toLowerCase() || 'info') as string;
      const matchesLevel = selectedLevels.has(level);
      const matchesSearch = searchQuery === '' || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.logger.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  };
  const filteredLogs = filterLogs(logs);

  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 18,
    overscan: 10,
  });
  
  const toggleLevel = (level: string) => {
    const newSet = new Set(selectedLevels);
    if (newSet.has(level)) {
      newSet.delete(level);
    } else {
      newSet.add(level);
    }
    handleSetSelectedLevels(newSet);
  };
  
  const handleExport = async (settings: ExportSettings) => {
    let sourceLogs: LogEntry[] = settings.scope === 'all' ? (await fetchLogs() || []) : filteredLogs;

    if (settings.dateRangeEnabled) {
      const from = settings.dateFrom ? new Date(settings.dateFrom).getTime() / 1000 : null;
      const to = settings.dateTo ? new Date(settings.dateTo).getTime() / 1000 : null;
      sourceLogs = sourceLogs.filter(log => {
        if (!log.time) return true;
        if (from && log.time < from) return false;
        if (to && log.time > to) return false;
        return true;
      });
    }

    const formatTimestamp = (time: number | undefined): string => {
      if (!time) return '';
      if (settings.timestampFormat === 'iso') return new Date(time * 1000).toISOString();
      if (settings.timestampFormat === 'locale') return new Date(time * 1000).toLocaleTimeString('en-GB', { hour12: false });
      return String(time);
    };

    const cleanMsg = (msg: string) => msg.replace(/\x1b\[[0-9;]*m/g, '').replace(/^.*?: /, '');

    let fileContent = '';
    let mimeType = 'text/plain';
    const ext = settings.format;

    if (settings.format === 'csv') {
      mimeType = 'text/csv';
      const headers: string[] = [];
      if (settings.includeTimestamp) headers.push('Timestamp');
      if (settings.includeLevel) headers.push('Level');
      if (settings.includeLogger) headers.push('Logger');
      if (settings.includeMessage) headers.push('Message');
      const rows = sourceLogs.map(log => {
        const cols: string[] = [];
        if (settings.includeTimestamp) cols.push(`"${formatTimestamp(log.time)}"`);
        if (settings.includeLevel) cols.push(`"${log.level}"`);
        if (settings.includeLogger) cols.push(`"${log.logger}"`);
        if (settings.includeMessage) cols.push(`"${cleanMsg(log.message || '').replace(/"/g, '""')}"`);
        return cols.join(',');
      });
      fileContent = `"${headers.join('","')}"\n` + rows.join('\n');
    } else if (settings.format === 'json') {
      mimeType = 'application/json';
      fileContent = JSON.stringify(sourceLogs.map(log => {
        const entry: Record<string, unknown> = {};
        if (settings.includeTimestamp) entry.timestamp = formatTimestamp(log.time);
        if (settings.includeLevel) entry.level = log.level;
        if (settings.includeLogger) entry.logger = log.logger;
        if (settings.includeMessage) entry.message = cleanMsg(log.message || '');
        return entry;
      }), null, 2);
    } else {
      fileContent = sourceLogs.map(log => {
        const parts: string[] = [];
        if (settings.includeTimestamp) parts.push(formatTimestamp(log.time));
        if (settings.includeLevel) parts.push(`[${log.level.toUpperCase()}]`);
        if (settings.includeLogger) parts.push(`[${log.logger}]`);
        if (settings.includeMessage) parts.push(cleanMsg(log.message || ''));
        return parts.join(' ');
      }).join('\n');
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const container = parentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= 50;
      setAutoScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (autoScroll && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll, panelMode]);

  return (
    <div className="flex flex-col h-full bg-main-200 dark:bg-main-950">
      <div className="text-xs font-bold text-main-900 dark:text-white uppercase px-3 py-1 border-b border-main-400 dark:border-main-800 flex-shrink-0 flex items-center justify-between gap-5">
        <div className="flex items-center gap-1">
          <Button active={panelMode === 'logs'} onClick={() => handleSetPanelMode('logs')}>Logs</Button>
          <Button active={panelMode === 'profiling'} onClick={() => handleSetPanelMode('profiling')}>Profiling</Button>
        </div>
        {panelMode === 'logs' ? (
          <>
            <span>Logs ({filteredLogs.length} / {logs.length})</span>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => handleSetSearchQuery(e.target.value)}
              className="flex-1 px-1 text-xs bg-main-100 dark:bg-main-800 text-main-900 dark:text-white border border-main-400 dark:border-main-700 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-1">
              {Object.entries(levelButtonMap).map(([level, activeClass], i) => (
                <Button key={i}
                  active={selectedLevels.has(level)}
                  activeClass={activeClass}
                  onClick={() => toggleLevel(level)}
                >{level.toUpperCase()}</Button>
              ))}
            </div>
            <div className="flex gap-1 text-xs">
              <Button onClick={() => setExportModalOpen(true)}>Export</Button>
              <Button onClick={async () => setLogs(await fetchLogs() || [])}>Load All</Button>
              <Button onClick={() => setLogs([])}>Clear</Button>
            </div>
          </>
        ) : (
          <span className="text-main-700 dark:text-main-300">Profiling timeline by process, locks, and functions</span>
        )}
      </div>

      {panelMode === 'logs' ? (
        <div
          ref={parentRef}
          className="flex-1 overflow-y-auto font-mono text-xs p-2"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-main-600 text-center py-2">
              {logs.length === 0 ? 'No logs yet' : 'No logs matching filters'}
            </div>
          ) : (
            <div
              style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const log = filteredLogs[virtualRow.index];
                const { text, color } = parseLogMessage(log.message || '');
                const timestamp = log.time ? `${new Date(log.time * 1000).toLocaleTimeString('en-GB', { hour12: false })}` : '';
                const level = (log.level.toLowerCase() || 'info') as string;
                const levelColor = levelColorMap[level] || 'text-main-800 dark:text-white';
                const logger = `[${log.logger}]` || '';

                return (
                  <div
                    key={virtualRow.key}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="flex gap-2 text-main-900 dark:text-white"
                  >
                    <span className="flex-shrink-0">{timestamp}</span>
                    <span className="flex-shrink-0 flex gap-1">[<span className={`${levelColor} font-bold`}>{level.toUpperCase()}</span>]</span>
                    <span className="flex-shrink-0">{logger}:</span>
                    <span className={`flex-1 whitespace-pre-wrap ${color}`}>{text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ProfilingPanel />
        </div>
      )}

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        filteredCount={filteredLogs.length}
        totalCount={logs.length}
      />
    </div>
  );
};
