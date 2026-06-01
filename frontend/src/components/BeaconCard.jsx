import React from 'react';
import { Thermometer, Battery, Signal, Clock, AlertTriangle, Router } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const BeaconCard = ({ beacon }) => {
  const isAlert = beacon.status === 'alert' || beacon.alert;
  const isOnline = beacon.status === 'in';
  const gatewayText = beacon.gateway_name || beacon.gateway_id || '—';
  const timeText = beacon.report_at ? new Date(beacon.report_at).toLocaleTimeString() : '—';

  return (
    <div
      className={cn(
        "glass-panel p-4 relative overflow-x-auto transition-colors",
        isAlert
          ? "border-red-400/60 bg-red-50 dark:bg-red-500/5"
          : "hover:border-accent-cyan/40"
      )}
    >
      {isAlert && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="text-red-500 w-6 h-6 animate-pulse" />
        </div>
      )}

      <div className="flex items-center gap-6 min-w-[1100px] whitespace-nowrap">
        <div className="flex flex-col min-w-[210px]">
          <h3 className="text-base font-bold truncate">
            {beacon.nickname || beacon.name || 'Unknown Beacon'}
          </h3>
          <p className="text-xs text-muted font-mono truncate">{beacon.mac_addr}</p>
        </div>

        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-center",
          isOnline
            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
            : "bg-slate-200 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400"
        )}>
          {beacon.status}
        </div>

        <div className="flex items-center gap-2 min-w-[200px]">
          <Router size={16} className="text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs text-muted uppercase">Gateway</span>
          <span className="text-sm font-semibold truncate max-w-[140px]" title={gatewayText}>{gatewayText}</span>
        </div>

        <div className="flex items-center gap-2 min-w-[130px]">
          <Thermometer size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-muted uppercase">Temp</span>
          <span className="text-sm font-semibold">
            {beacon.temp != null ? `${beacon.temp}°C` : '—'}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-[130px]">
          <Battery size={16} className={cn("text-green-600 dark:text-green-400", beacon.battery < 20 && "text-red-500")} />
          <span className="text-xs text-muted uppercase">Battery</span>
          <span className="text-sm font-semibold">
            {beacon.battery != null ? `${beacon.battery}%` : '—'}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-[140px]">
          <Signal size={16} className="text-purple-600 dark:text-purple-400" />
          <span className="text-xs text-muted uppercase">RSSI</span>
          <span className="text-sm font-semibold">{beacon.rssi} dBm</span>
        </div>

        <div className="flex items-center gap-2 min-w-[170px]">
          <Clock size={16} className="text-orange-600 dark:text-orange-400" />
          <span className="text-xs text-muted uppercase">Last Seen</span>
          <span className="text-sm font-semibold">{timeText}</span>
        </div>

        {beacon.gateway_mac_addr && (
          <div className="flex items-center gap-2 min-w-[230px]">
            <span className="text-xs text-muted uppercase">Gateway MAC</span>
            <span className="text-xs font-mono text-muted truncate">{beacon.gateway_mac_addr}</span>
          </div>
        )}
      </div>
    </div>
  );
};
