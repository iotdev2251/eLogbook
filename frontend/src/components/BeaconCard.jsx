import React from 'react';
import {
  Thermometer,
  Battery,
  Signal,
  Clock,
  AlertTriangle,
  Router,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Metric = ({ icon: Icon, label, value, iconClass, valueClass }) => (
  <div className="min-w-0 flex flex-col gap-0.5">
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon size={14} className={cn('shrink-0', iconClass)} />
      <span className="text-[10px] text-muted uppercase tracking-wide truncate">{label}</span>
    </div>
    <span className={cn('text-sm font-semibold truncate', valueClass)} title={String(value)}>
      {value}
    </span>
  </div>
);

export const BeaconCard = ({ beacon, isAdmin, onEdit }) => {
  const isAlert = beacon.status === 'alert' || beacon.alert;
  const isOnline = beacon.status === 'in';
  const displayName = beacon.nickname || beacon.name || 'Unknown Beacon';
  const gatewayText = beacon.gateway_name || beacon.gateway_id || '—';
  const timeText = beacon.report_at ? new Date(beacon.report_at).toLocaleTimeString() : '—';

  return (
    <div
      className={cn(
        'glass-panel p-4 relative overflow-hidden transition-colors w-full',
        isAlert
          ? 'border-red-400/60 bg-red-50 dark:bg-red-500/5'
          : 'hover:border-accent-cyan/40'
      )}
    >
      {isAlert && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <AlertTriangle className="text-red-500 w-5 h-5 animate-pulse" />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 lg:gap-4 items-center w-full min-w-0">
        <div className="col-span-2 sm:col-span-1 min-w-0 lg:col-span-1">
          <h3 className="text-sm font-bold truncate" title={displayName}>
            {displayName}
          </h3>
          <p className="text-[11px] text-muted font-mono truncate" title={beacon.mac_addr}>
            {beacon.mac_addr}
          </p>
        </div>

        <div className="flex justify-start sm:justify-center min-w-0">
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
              isOnline
                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                : 'bg-slate-200 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400'
            )}
          >
            {beacon.status}
          </span>
        </div>

        <Metric
          icon={Router}
          label="Gateway"
          value={gatewayText}
          iconClass="text-cyan-600 dark:text-cyan-400"
        />

        <Metric
          icon={Thermometer}
          label="Temp"
          value={beacon.temp != null ? `${beacon.temp}°C` : '—'}
          iconClass="text-blue-600 dark:text-blue-400"
        />

        <Metric
          icon={Battery}
          label="Battery"
          value={beacon.battery != null ? `${beacon.battery}%` : '—'}
          iconClass={cn(
            'text-green-600 dark:text-green-400',
            beacon.battery != null && beacon.battery < 20 && 'text-red-500'
          )}
        />

        <Metric
          icon={Signal}
          label="RSSI"
          value={beacon.rssi != null ? `${beacon.rssi} dBm` : '—'}
          iconClass="text-purple-600 dark:text-purple-400"
        />

        <div className="col-span-2 sm:col-span-1 flex items-center justify-between gap-2 min-w-0 lg:col-span-1">
          <Metric
            icon={Clock}
            label="Last seen"
            value={timeText}
            iconClass="text-orange-600 dark:text-orange-400"
          />
          {isAdmin && (
            <button
              type="button"
              onClick={() => onEdit?.(beacon)}
              className="shrink-0 p-2 text-muted hover:text-cyan-700 dark:hover:text-accent-cyan hover:bg-cyan-100 dark:hover:bg-accent-cyan/10 rounded-lg transition-colors"
              title="Edit beacon and gateway names"
              aria-label="Edit labels"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
