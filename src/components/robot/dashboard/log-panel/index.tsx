'use client';

import { useEffect, useRef, useState } from "react";
import { useLogs } from "@/hooks/useRobot";
import { Button } from "@/components/ui/button";


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
  const logs = useLogs();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set(['debug', 'info', 'warning', 'error', 'critical']));
  const [autoScroll, setAutoScroll] = useState(true);
  
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
  
  const filteredLogs = logs.filter(log => {
    const level = (log.level.toLowerCase() || 'info') as string;
    const matchesLevel = selectedLevels.has(level);
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.logger.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });
  
  const toggleLevel = (level: string) => {
    const newSet = new Set(selectedLevels);
    if (newSet.has(level)) {
      newSet.delete(level);
    } else {
      newSet.add(level);
    }
    setSelectedLevels(newSet);
  };
  
  const exportLogs = () => {
    const csvContent = filteredLogs.map(log => {
      const timestamp = log.time ? new Date(log.time * 1000).toISOString() : '';
      const message = log.message.replace(/\x1b\[[0-9;]*m/g, '').replace(/"/g, '""');
      return `"${timestamp}","${log.level}","${log.logger}","${message}"`;
    }).join('\n');
    
    const header = '"Timestamp","Level","Logger","Message"\n';
    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  return (
    <div className="flex flex-col h-full bg-main-200 dark:bg-main-950">
      <div className="text-xs font-bold text-main-900 dark:text-white uppercase px-3 py-1 border-b border-main-400 dark:border-main-800 flex-shrink-0 flex items-center justify-between gap-5">
        <span>Logs ({filteredLogs.length} / {logs.length})</span>
        <input
          type="text"
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          <Button onClick={() => setAutoScroll(!autoScroll)} active={autoScroll}>Auto-scroll</Button>
          <Button onClick={() => exportLogs()}>Export</Button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 p-2"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-main-600 text-center py-2">
            {logs.length === 0 ? 'No logs yet' : 'No logs matching filters'}
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const { text, color } = parseLogMessage(log.message || '');
            const timestamp = log.time ? `${new Date(log.time * 1000).toLocaleTimeString('en-GB', { hour12: false })}` : '';
            const level = (log.level.toLowerCase() || 'info') as string;
            const levelColor = levelColorMap[level] || 'text-main-800 dark:text-white';
            const logger = `[${log.logger}]` || '';
            
            return (
              <div key={idx} className="flex gap-2 text-main-900 dark:text-white">
                <span className="flex-shrink-0">{timestamp}</span>
                <span className="flex-shrink-0 flex gap-1">[<span className={`${levelColor} font-bold`}>{level.toUpperCase()}</span>]</span>
                <span className="flex-shrink-0">{logger}:</span>
                <span className={`flex-1 whitespace-pre-wrap ${color}`}>{text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
