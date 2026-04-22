/**
 * Advanced Bluetooth modal with unified single-column workflow
 */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useBluetooth } from '@/hooks/useRobot';
import { useRobot } from '@/context/RobotContext';
import { BluetoothMessage, BluetoothPairableDevice } from '@/types/robot';
import { cn } from '@/lib/utils';

interface BluetoothAdvancedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DisplayMessage = BluetoothMessage & { direction: 'in' | 'out' };

const prettyTime = (ts?: number) => {
  if (!ts) return '-';
  const ms = ts > 1_000_000_000_000 ? ts : ts * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return String(ts);
  return date.toLocaleTimeString();
};

const sectionClass =
  'border border-main-300/90 dark:border-main-700 bg-main-50/60 dark:bg-main-900/30 p-2 space-y-1';

export const BluetoothAdvancedModal: React.FC<BluetoothAdvancedModalProps> = ({ isOpen, onClose }) => {
  const {
    state,
    loading,
    working,
    error,
    refresh,
    setOtherRobot,
    clearOtherRobot,
    connectToRobot,
    disconnectFromRobot,
    pairDevice,
    unpairDevice,
    listPairableDevices,
    setDiscoverable,
    setNotDiscoverable,
    sendMessage,
    getMessages,
  } = useBluetooth(2000);
  const { connectionState } = useRobot();

  const [discoverableSeconds, setDiscoverableSeconds] = useState('120');
  const [otherNote, setOtherNote] = useState('');

  const [scanTimeout, setScanTimeout] = useState('6');
  const [scanResults, setScanResults] = useState<BluetoothPairableDevice[]>([]);

  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [historyLimit, setHistoryLimit] = useState('100');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [messages, setMessages] = useState<{ received: BluetoothMessage[]; sent: BluetoothMessage[] }>({ received: [], sent: [] });
  const [messageType, setMessageType] = useState('manual');
  const [messageContent, setMessageContent] = useState('');
  const [messageTarget, setMessageTarget] = useState('');

  const [expandedMessageIdx, setExpandedMessageIdx] = useState<number | null>(null);

  const lastActiveRobotIdRef = useRef<string | null>(connectionState.activeRobotId);

  const selectedOtherMac = state?.other_robot?.mac_address || '';

  const devices = useMemo(() => {
    const byMac = new Map<
      string,
      {
        name: string;
        mac_address: string;
        hostname?: string;
        ip_address?: string;
        is_connected: boolean;
        is_paired: boolean;
      }
    >();

    for (const device of state?.paired_devices || []) {
      byMac.set(device.mac_address, {
        name: device.name,
        mac_address: device.mac_address,
        hostname: device.hostname,
        ip_address: device.ip_address,
        is_connected: Boolean(device.is_connected),
        is_paired: true,
      });
    }

    for (const device of state?.connected_devices || []) {
      const current = byMac.get(device.mac_address);
      byMac.set(device.mac_address, {
        name: device.name || current?.name || device.mac_address,
        mac_address: device.mac_address,
        hostname: device.hostname || current?.hostname,
        ip_address: device.ip_address || current?.ip_address,
        is_connected: true,
        is_paired: current?.is_paired ?? false,
      });
    }

    return Array.from(byMac.values());
  }, [state]);

  const otherConnected = Boolean(
    selectedOtherMac && state?.connected_devices?.some((d) => d.mac_address === selectedOtherMac && d.is_connected),
  );

  const mergedMessages = useMemo<DisplayMessage[]>(() => {
    const incoming = messages.received.map((msg) => ({ ...msg, direction: 'in' as const }));
    const outgoing = messages.sent.map((msg) => ({ ...msg, direction: 'out' as const }));
    return [...incoming, ...outgoing].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [messages]);

  const runScan = async () => {
    const timeout = Number(scanTimeout);
    const found = await listPairableDevices(Number.isFinite(timeout) && timeout > 0 ? timeout : undefined);
    const sorted = [...found].sort((a, b) => Number(a.is_paired) - Number(b.is_paired));
    setScanResults(sorted);
  };

  const quickPair = async (device: BluetoothPairableDevice) => {
    const ok = await pairDevice({
      mac_address: device.mac_address,
      name: device.name || device.mac_address,
    });
    if (!ok) return;

    await connectToRobot(device.mac_address);

    await setOtherRobot({
      mac_address: device.mac_address,
      name: device.name || device.mac_address,
    });
    setMessageTarget(device.mac_address);

    await refresh();
  };

  const saveOtherNote = async () => {
    if (!selectedOtherMac) return;
    await setOtherRobot({
      mac_address: selectedOtherMac,
      name: state?.other_robot?.name,
      hostname: state?.other_robot?.hostname,
      ip_address: state?.other_robot?.ip_address,
      note: otherNote.trim() || undefined,
    });
  };

  const loadHistory = async (clear = false) => {
    setHistoryLoading(true);
    try {
      const limitNum = Number(historyLimit);
      const data = await getMessages({
        clear,
        limit: Number.isFinite(limitNum) && limitNum > 0 ? limitNum : undefined,
      });
      setMessages(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendManualMessage = async () => {
    if (!messageType.trim() || !messageContent.trim()) return;

    const ok = await sendMessage(
      messageType.trim(),
      messageContent,
      messageTarget.trim() || undefined,
    );

    if (ok) {
      setMessageContent('');
      if (historyEnabled) {
        await loadHistory(false);
      }
    }
  };

  useEffect(() => {
    if (lastActiveRobotIdRef.current === connectionState.activeRobotId) {
      return;
    }

    setOtherNote('');
    setScanResults([]);
    setHistoryLoading(false);
    setMessages({ received: [], sent: [] });
    setMessageContent('');
    setMessageTarget('');
    setExpandedMessageIdx(null);

    lastActiveRobotIdRef.current = connectionState.activeRobotId;

    if (connectionState.isConnected && connectionState.activeRobotId) {
      void refresh(true);
      if (historyEnabled) {
        void loadHistory(false);
      }
    }
  }, [connectionState.activeRobotId, connectionState.isConnected, historyEnabled, loadHistory, refresh]);

  return (
    <Modal
      title="Bluetooth Advanced"
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      className="max-w-3xl"
    >
      <div className="space-y-2 text-[11px] max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="border border-red-500/80 bg-red-500/10 text-red-700 dark:text-red-300 px-2 py-1">
            {error}
          </div>
        )}

        <div className={cn(sectionClass, 'space-y-1.5')}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn('inline-block w-2 h-2 shrink-0', state?.process_alive ? 'bg-green-500' : 'bg-red-500')} />
              <span className="font-semibold text-main-900 dark:text-main-100">{state?.process_alive ? 'Bluetooth Online' : 'Bluetooth Offline'}</span>
              <span className="text-main-500 dark:text-main-400 truncate">{state?.local_device?.hostname || '-'}</span>
            </div>
            <Button className="px-2 text-[10px]" onClick={() => {
              setScanResults([]);
              refresh()
            }} disabled={working || loading}>Refresh</Button>
          </div>
        </div>

        <div className={sectionClass}>
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-main-900 dark:text-main-100">Pairing</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button className="px-2 text-[10px]" onClick={() => runScan()} disabled={working || loading}>Scan nearby</Button>
              for
              <input
                value={scanTimeout}
                onChange={(e) => setScanTimeout(e.target.value)}
                className="w-16 bg-main-100 dark:bg-main-900 border border-main-400 dark:border-main-700 px-1.5 text-[11px] text-center"
                aria-label="scan timeout"
              />
              seconds
            </div>
          </div>

          <div className="max-h-56 overflow-auto space-y-1 pr-0.5">
            {scanResults.length === 0 || working ? (
              <div className="text-main-500 dark:text-main-400">No scan results yet.</div>
            ) : scanResults.map((device) => (
              <div key={device.mac_address} className="border border-main-300 dark:border-main-700 p-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="font-medium truncate text-main-900 dark:text-main-100">{device.name || device.mac_address}</div>
                  {device.is_paired && <span className="text-[10px] border border-main-500 px-1">Paired</span>}
                </div>
                <div className="text-main-500 dark:text-main-400 truncate">{device.mac_address}</div>
                <div className="flex gap-1 mt-1">
                  <Button className="flex-1" onClick={() => quickPair(device)} disabled={working || loading}>
                    Pair
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <div className="font-semibold text-main-900 dark:text-main-100">Devices</div>
          <div className="max-h-56 overflow-auto space-y-1 pr-0.5">
            {devices.length === 0 && (
              <div className="text-main-500 dark:text-main-400">No paired or connected devices.</div>
            )}
            {devices.map((device) => {
              const isOther = selectedOtherMac === device.mac_address;
              return (
                <div
                  key={device.mac_address}
                  className={cn(
                    'border border-main-300 dark:border-main-700 p-1 bg-main-100/40 dark:bg-main-950/20',
                    isOther && 'border-green-600/90 dark:border-green-500/90',
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium truncate text-main-900 dark:text-main-100">{device.name}</span>
                    <span className="flex items-center gap-1">
                      {device.is_connected && <span className="text-[10px] border border-green-600 text-green-700 dark:text-green-400 px-2">C</span>}
                      {device.is_paired && <span className="text-[10px] border border-main-500 text-main-700 dark:text-main-300 px-2">P</span>}
                    </span>
                  </div>
                  <div className="text-main-500 dark:text-main-400 truncate">{device.mac_address}</div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <Button className="px-1.5 text-[10px]" onClick={() => setOtherRobot({ mac_address: device.mac_address, name: device.name, hostname: device.hostname, ip_address: device.ip_address })} disabled={working || loading}>Set as Teammate</Button>
                    <Button className="px-1.5 text-[10px]" onClick={() => connectToRobot(device.mac_address)} disabled={working || loading || device.is_connected}>Connect</Button>
                    <Button className="px-1.5 text-[10px]" onClick={() => disconnectFromRobot(device.mac_address)} disabled={working || loading || !device.is_connected}>Disconnect</Button>
                    <Button className="px-1.5 text-[10px]" onClick={() => unpairDevice(device.mac_address)} disabled={working || loading || !device.is_paired}>Unpair</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={sectionClass}>
          <div className="flex justify-between">
            <div className="flex gap-3 m-0">
              <div className="font-bold text-main-900 dark:text-main-100">Teammate robot</div>

              <div className="truncate text-yellow-700 dark:text-yellow-400">
                <span className="text-main-500 dark:text-main-400">Name:</span> {state?.other_robot?.name || '-'}
              </div>
              <div className="truncate text-yellow-700 dark:text-yellow-400">
                <span className="text-main-500 dark:text-main-400">MAC:</span> {selectedOtherMac || '-'}
              </div>
            </div>

            <span
              className={cn(
                'uppercase border px-1',
                !selectedOtherMac
                  ? 'border-main-500 text-main-600 dark:text-main-400'
                  : otherConnected
                    ? 'border-green-600 text-green-700 dark:text-green-400'
                    : 'border-yellow-600 text-yellow-700 dark:text-yellow-400',
              )}
            >
              {!selectedOtherMac ? 'not set' : otherConnected ? 'connected' : 'disconnected'}
            </span>
          </div>
          <div className="flex gap-1">
            <input
            value={otherNote}
            onChange={(e) => setOtherNote(e.target.value)}
            placeholder={state?.other_robot?.note || 'note (optional)'}
            className="flex-1 w-full bg-main-100 dark:bg-main-900 border border-main-400 dark:border-main-700 px-1.5 text-[11px]"
            />
            <Button className="px-1.5 text-[10px]" onClick={() => saveOtherNote()} disabled={working || loading || !selectedOtherMac}>Save note</Button>
            <Button className="px-1.5 text-[10px]" onClick={() => clearOtherRobot()} disabled={working || loading || !selectedOtherMac}>Clear</Button>
          </div>
        </div>

        <div className={cn(sectionClass, "flex justify-between space-y-0")}>
          <div className="font-semibold text-main-900 dark:text-main-100">Discoverability</div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <Button
              className="px-1.5 text-[10px]"
              onClick={() => {
                const secs = Number(discoverableSeconds);
                void setDiscoverable(Number.isFinite(secs) && secs > 0 ? secs : undefined);
              }}
              disabled={working || loading}
            >
              Set discoverable
            </Button>
            for
            <input
              value={discoverableSeconds}
              onChange={(e) => setDiscoverableSeconds(e.target.value)}
              className="w-20 bg-main-100 dark:bg-main-900 border border-main-400 dark:border-main-700 px-1.5 text-[11px] text-center"
            />
            seconds
          </div>
        </div>

        <div className={sectionClass}>
          <div className="font-semibold text-main-900 dark:text-main-100">Messages</div>

          <div className="space-y-1">
            <div className="text-main-700 dark:text-main-300 font-medium">Send message</div>
            <input
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              placeholder="type"
              className="w-full bg-main-100 dark:bg-main-900 border border-main-400 dark:border-main-700 px-1.5 text-[11px]"
            />
            <input
              value={messageTarget}
              onChange={(e) => setMessageTarget(e.target.value)}
              placeholder={`target MAC (blank = other ${selectedOtherMac || ''})`}
              className="w-full bg-main-100 dark:bg-main-900 border border-main-400 dark:border-main-700 px-1.5 text-[11px]"
            />
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={3}
              placeholder="message content"
              className="w-full bg-main-100 dark:bg-main-900 border border-main-400 dark:border-main-700 px-1.5 text-[11px]"
            />
            <div className="flex gap-1">
              <Button className="flex-1 px-1.5 text-[10px]" onClick={() => sendManualMessage()} disabled={working || loading || !messageType.trim() || !messageContent.trim()}>Send</Button>
              <Button className="px-1.5 text-[10px]" onClick={() => setMessageContent('')} disabled={working || loading}>Clear</Button>
            </div>
          </div>

          <div className="pt-1 border-t border-main-300 dark:border-main-700 space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-main-700 dark:text-main-300 font-medium">History</div>
              <label className="flex items-center gap-1 text-main-700 dark:text-main-300">
                <input
                  type="checkbox"
                  checked={historyEnabled}
                  onChange={(e) => setHistoryEnabled(e.target.checked)}
                />
                Enabled
              </label>
            </div>
            <div className="flex gap-1">
              <input
                value={historyLimit}
                onChange={(e) => setHistoryLimit(e.target.value)}
                className="w-16 bg-main-100 dark:bg-main-900 border border-main-400 dark:border-main-700 px-1.5 text-[11px] text-center"
              />
              <Button className="flex-1 px-1.5 text-[10px]" onClick={() => loadHistory(false)} disabled={!historyEnabled || working || historyLoading}>Refresh</Button>
              <Button className="px-1.5 text-[10px]" onClick={() => loadHistory(true)} disabled={!historyEnabled || working || historyLoading}>Clear server</Button>
            </div>

            <div className="max-h-56 overflow-auto space-y-1 pr-0.5">
              {!historyEnabled && (
                <div className="text-main-500 dark:text-main-400">Enable history to load messages.</div>
              )}
              {historyEnabled && mergedMessages.length === 0 && (
                <div className="text-main-500 dark:text-main-400">No messages.</div>
              )}
              {historyEnabled && mergedMessages.map((msg, idx) => {
                const isExpanded = expandedMessageIdx === idx;
                const senderInfo = msg.sender_mac ? `${msg.sender_mac}${msg.sender_id ? ` (${msg.sender_id})` : ''}` : '';

                return (
                  <div
                    key={`${msg.message_id || idx}-${msg.timestamp || 0}`}
                    className={cn(
                      'border px-1 py-0.5 space-y-0 cursor-pointer',
                      msg.direction === 'in'
                        ? 'border-blue-400/60 text-main-800 dark:text-main-200 bg-blue-400/10'
                        : 'border-main-400/70 text-main-900 dark:text-main-100 bg-main-400/10',
                      isExpanded ? 'shadow-lg ring-2 ring-blue-400/30' : 'select-none',
                    )}
                    onClick={() => setExpandedMessageIdx(isExpanded ? null : idx)}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setExpandedMessageIdx(isExpanded ? null : idx);
                      }
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3 text-xs min-w-0">
                      <span className="uppercase font-semibold shrink-0">{msg.direction === 'in' ? 'RX' : 'TX'} · {msg.message_type || '-'}</span>
                      <span className="text-main-500 dark:text-main-400 truncate min-w-0 flex-1">
                        {senderInfo}
                      </span>
                      <span className="text-main-500 dark:text-main-400 shrink-0 ml-auto">{prettyTime(msg.timestamp)}</span>
                    </div>

                    <div className={cn(
                      'text-xs',
                      isExpanded
                        ? 'break-words whitespace-pre-wrap'
                        : 'truncate whitespace-nowrap overflow-hidden text-ellipsis'
                    )}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

