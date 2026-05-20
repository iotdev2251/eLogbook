import React from 'react';
import { Thermometer, Battery, Signal, Clock, AlertTriangle } from 'lucide-react';
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

      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold truncate max-w-[200px]">
            {beacon.nickname || beacon.name || 'Unknown Beacon'}
          </h3>
          <p className="text-xs text-gray-500 font-mono">{beacon.mac_addr}</p>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          isOnline ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
        )}>
          {beacon.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Thermometer size={16} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Temp</p>
            <p className="font-bold">{beacon.temp}°C</p>
          </div>
        </div>

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

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Signal size={16} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">RSSI</p>
            <p className="font-bold">{beacon.rssi} dBm</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Last seen</p>
            <p className="font-bold text-[10px]">
              {new Date(beacon.report_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
