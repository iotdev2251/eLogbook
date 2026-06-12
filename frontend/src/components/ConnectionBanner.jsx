import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useBeacons } from '../hooks/useBeacons';
import { Button } from './ui/Button';

export function ConnectionBanner() {
  const { isConnected, reconnect, refreshBeacons } = useBeacons();
  const [showReconnected, setShowReconnected] = useState(false);
  const wasDisconnected = useRef(false);

  useEffect(() => {
    if (!isConnected) {
      wasDisconnected.current = true;
      setShowReconnected(false);
      return;
    }
    if (wasDisconnected.current) {
      setShowReconnected(true);
      refreshBeacons();
      const id = setTimeout(() => setShowReconnected(false), 4000);
      wasDisconnected.current = false;
      return () => clearTimeout(id);
    }
    return undefined;
  }, [isConnected, refreshBeacons]);

  if (isConnected && !showReconnected) return null;

  if (showReconnected && isConnected) {
    return (
      <div
        role="status"
        className="shrink-0 px-4 py-2 text-sm text-success bg-success-muted border-b border-success/30 flex items-center justify-center gap-2"
      >
        Live connection restored
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="shrink-0 px-4 py-2.5 text-sm text-warning bg-warning-muted border-b border-warning/30 flex flex-col sm:flex-row items-center justify-center gap-3"
    >
      <div className="flex items-center gap-2">
        <WifiOff size={16} aria-hidden="true" />
        <span>Live connection lost — data may be stale</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reconnect}
          className="border-warning/40 text-warning hover:bg-warning-muted"
        >
          <RefreshCw size={14} />
          Reconnect
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={refreshBeacons}>
          Reload data
        </Button>
      </div>
    </div>
  );
}
