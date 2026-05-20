import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import { BeaconCard } from './BeaconCard';
import { Activity, Radio, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Dashboard = () => {
  const [beacons, setBeacons] = useState({});
  const { socket, isConnected } = useSocket('/');

  useEffect(() => {
    // Initial fetch
    axios.get('/beacons')
      .then(res => {
        const beaconMap = {};
        res.data.forEach(b => {
          beaconMap[b.mac_addr] = b;
        });
        setBeacons(beaconMap);
      })
      .catch(err => console.error('Failed to fetch beacons', err));
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('ADDED_DATA', (data) => {
        console.log('Socket data received:', data);
        setBeacons(prev => {
          const next = { ...prev };
          data.forEach(b => {
            next[b.mac_addr] = b;
          });
          return next;
        });
      });
    }
  }, [socket]);

  const beaconList = Object.values(beacons);
  const activeCount = beaconList.filter(b => b.status === 'in').length;
  const alertCount = beaconList.filter(b => b.status === 'alert' || b.alert).length;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<Radio className="text-accent-cyan" />} 
          label="Total Beacons" 
          value={beaconList.length} 
          subValue={`${isConnected ? 'Connected' : 'Disconnected'} to Server`}
        />
        <StatCard 
          icon={<CheckCircle2 className="text-green-400" />} 
          label="Active" 
          value={activeCount} 
          color="green"
        />
        <StatCard 
          icon={<AlertCircle className="text-red-400" />} 
          label="Alerts" 
          value={alertCount} 
          color="red"
        />
        <StatCard 
          icon={<Activity className="text-accent-purple" />} 
          label="Recent Activity" 
          value="14" 
          subValue="Updates/min"
        />
      </div>

      {/* Live Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            Live Beacon Status
            <span className="flex h-2 w-2 rounded-full bg-accent-cyan animate-ping"></span>
          </h2>
          <div className="text-sm text-gray-400">
            Auto-refreshing via Socket.io
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {beaconList.sort((a,b) => new Date(b.report_at) - new Date(a.report_at)).map(beacon => (
              <BeaconCard key={beacon.mac_addr} beacon={beacon} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue, color = 'cyan' }) => (
  <div className="glass-panel p-6 flex items-center gap-4">
    <div className={`p-3 rounded-xl bg-${color}-500/10`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold">{value}</h3>
        {subValue && <span className="text-[10px] text-gray-400">{subValue}</span>}
      </div>
    </div>
  </div>
);
