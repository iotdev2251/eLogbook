import React, { useState, useMemo } from 'react';
import { useBeacons } from '../hooks/useBeacons';
import { BeaconCard } from './BeaconCard';
import { BeaconEditModal } from './BeaconEditModal';
import { Activity, Radio, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { beaconDisplayName, gatewayDisplayName } from '../utils/beaconDisplay';
import { countTempAlerts } from '../utils/tempAlerts';

export const RealTimeStatus = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBeacon, setEditingBeacon] = useState(null);
  const { beacons, beaconList: allSorted, isConnected, updatesPerMin, mergeBeaconUpdates } = useBeacons();
  const isAdmin = currentUser?.role === 'admin';

  const beaconList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allSorted.filter((beacon) => {
      if (!q) return true;
      const name = beaconDisplayName(beacon).toLowerCase();
      const gateway = gatewayDisplayName(beacon).toLowerCase();
      return name.includes(q) || gateway.includes(q);
    });
  }, [allSorted, searchQuery]);

  const allBeacons = Object.values(beacons);
  const activeCount = allBeacons.filter(b => b.status === 'in').length;
  const alertCount = countTempAlerts(allBeacons);

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
          value={updatesPerMin}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search beacon or gateway name..."
                className="input-field pl-10 py-2.5 text-sm"
                aria-label="Search beacon or gateway name"
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
        onSaved={mergeBeaconUpdates}
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
