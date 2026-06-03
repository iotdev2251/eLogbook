import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import { BeaconCard } from './BeaconCard';
import { BeaconEditModal } from './BeaconEditModal';
import { Activity, Radio, AlertCircle, CheckCircle2, Search } from 'lucide-react';

const beaconDisplayName = (beacon) =>
  (beacon.nickname || beacon.name || beacon.mac_addr || '').trim();

const gatewayDisplayName = (beacon) =>
  (beacon.gateway_name || beacon.gateway_id || '').trim();

export const RealTimeStatus = ({ currentUser }) => {
  const [beacons, setBeacons] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBeacon, setEditingBeacon] = useState(null);
  const { socket, isConnected } = useSocket('/');
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
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
    if (!socket) return;
    const onData = (data) => {
      setBeacons(prev => {
        const next = { ...prev };
        data.forEach(b => {
          next[b.mac_addr] = b;
        });
        return next;
      });
    };
    socket.on('ADDED_DATA', onData);
    return () => socket.off('ADDED_DATA', onData);
  }, [socket]);

  const beaconList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return Object.values(beacons)
      .filter(beacon => {
        if (!q) return true;
        const name = beaconDisplayName(beacon).toLowerCase();
        const gateway = gatewayDisplayName(beacon).toLowerCase();
        return name.includes(q) || gateway.includes(q);
      })
      .sort((a, b) => {
        const byName = beaconDisplayName(a).localeCompare(
          beaconDisplayName(b),
          undefined,
          { sensitivity: 'base', numeric: true }
        );
        if (byName !== 0) return byName;
        return (a.mac_addr || '').localeCompare(b.mac_addr || '', undefined, { numeric: true });
      });
  }, [beacons, searchQuery]);

  const allBeacons = Object.values(beacons);
  const activeCount = allBeacons.filter(b => b.status === 'in').length;
  const alertCount = allBeacons.filter(b => b.status === 'alert' || b.alert).length;

  const applyBeaconUpdates = (updatedList) => {
    if (!Array.isArray(updatedList) || updatedList.length === 0) return;
    setBeacons(prev => {
      const next = { ...prev };
      updatedList.forEach(b => {
        next[b.mac_addr] = b;
      });
      return next;
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<Radio className="text-accent-cyan" />}
          label="Total Beacons"
          value={allBeacons.length}
          subValue={`${isConnected ? 'Connected' : 'Disconnected'} to Server`}
        />
        <StatCard
          icon={<CheckCircle2 className="text-green-600 dark:text-green-400" />}
          label="Active"
          value={activeCount}
        />
        <StatCard
          icon={<AlertCircle className="text-red-600 dark:text-red-400" />}
          label="Alerts"
          value={alertCount}
        />
        <StatCard
          icon={<Activity className="text-accent-purple" />}
          label="Recent Activity"
          value="14"
          subValue="Updates/min"
        />
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
            <h2 className="text-2xl font-bold font-display flex items-center gap-2 shrink-0">
              Live Beacon Status
              <span className="flex h-2 w-2 rounded-full bg-accent-cyan animate-ping"></span>
            </h2>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search beacon or gateway name..."
                className="input-field pl-10 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="text-sm text-muted shrink-0">
            {beaconList.length} / {allBeacons.length} · Auto-refresh via Socket.io
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {beaconList.length === 0 ? (
            <div className="glass-panel p-8 text-center text-muted">
              {searchQuery.trim()
                ? 'No beacons match your search.'
                : 'No beacons connected.'}
            </div>
          ) : (
            beaconList.map(beacon => (
              <BeaconCard
                key={beacon.mac_addr}
                beacon={beacon}
                isAdmin={isAdmin}
                onEdit={setEditingBeacon}
              />
            ))
          )}
        </div>
      </div>

      <BeaconEditModal
        beacon={editingBeacon}
        open={editingBeacon != null}
        onClose={() => setEditingBeacon(null)}
        onSaved={applyBeaconUpdates}
      />
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue }) => (
  <div className="glass-panel p-6 flex items-center gap-4">
    <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5">
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold">{value}</h3>
        {subValue && <span className="text-[10px] text-muted">{subValue}</span>}
      </div>
    </div>
  </div>
);
