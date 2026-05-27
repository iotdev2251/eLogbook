import React from 'react';
import { Thermometer, Battery, Signal, Clock, AlertTriangle, Router } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const BeaconCard = ({ beacon }) => {
  const isAlert = beacon.status === 'alert' || beacon.alert;
  const isOnline = beacon.status === 'in';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "glass-panel p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300",
        isAlert ? "border-red-500/50 bg-red-500/5" : "hover:border-accent-cyan/50"
      )}
    >
      {isAlert && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="text-red-500 w-6 h-6 animate-pulse" />
        </div>
      )}

      <div className="flex flex-row items-center justify-between gap-6 w-full">
        {/* Name & MAC */}
        <div className="flex flex-col min-w-[200px]">
          <h3 className="text-xl font-bold truncate">
            {beacon.nickname || beacon.name || 'Unknown Beacon'}
          </h3>
          <p className="text-xs text-gray-500 font-mono">{beacon.mac_addr}</p>
        </div>

        {/* Status */}
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-center whitespace-nowrap",
          isOnline ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
        )}>
          {beacon.status}
        </div>

        {/* Sensor Data Row */}
        <div className="flex flex-row items-center gap-8 flex-1 justify-end">
          {/* Gateway */}
          <div className="flex items-center gap-2 min-w-[140px]">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Router size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Gateway</p>
              <p className="font-bold text-xs truncate max-w-[120px]" title={beacon.gateway_name || beacon.gateway_id || ''}>
                {beacon.gateway_name || beacon.gateway_id || '—'}
              </p>
              {beacon.gateway_mac_addr && (
                <p className="text-[10px] text-gray-500 font-mono truncate max-w-[120px]">
                  {beacon.gateway_mac_addr}
                </p>
              )}
            </div>
          </div>

          {/* Temp */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Thermometer size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Temp</p>
              <p className="font-bold">{beacon.temp}°C</p>
            </div>
          </div>

          {/* Battery */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg text-green-400",
              beacon.battery < 20 ? "bg-red-500/10 text-red-400" : "bg-green-500/10"
            )}>
              <Battery size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Battery</p>
              <p className="font-bold">{beacon.battery}%</p>
            </div>
          </div>

          {/* RSSI */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Signal size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">RSSI</p>
              <p className="font-bold">{beacon.rssi} dBm</p>
            </div>
          </div>

          {/* Last seen */}
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Last seen</p>
              <p className="font-bold text-xs">
                {new Date(beacon.report_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
