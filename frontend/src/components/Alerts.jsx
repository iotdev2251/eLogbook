import React, { useMemo } from 'react';
import { useBeacons } from '../hooks/useBeacons';
import { BeaconCard } from './BeaconCard';
import { AlertTriangle, Thermometer } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import {
  filterTempAlertBeacons,
  getTempAlertLevel,
} from '../utils/tempAlerts';

export const Alerts = ({ currentUser }) => {
  const { beaconList, isConnected } = useBeacons();
  const { config } = useSettings();
  const isAdmin = currentUser?.role === 'admin';
  const { tempWarnC, tempCriticalC } = config;

  const alertBeacons = useMemo(
    () => filterTempAlertBeacons(beaconList, config),
    [beaconList, config],
  );

  const critical = useMemo(
    () => alertBeacons.filter((b) => getTempAlertLevel(b.temp, config) === 'critical'),
    [alertBeacons, config],
  );

  const warn = useMemo(
    () => alertBeacons.filter((b) => getTempAlertLevel(b.temp, config) === 'warn'),
    [alertBeacons, config],
  );

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={28} />
            Temperature Alerts
          </h2>
          <p className="text-sm text-muted mt-1">
            Beacon 溫度 &gt; {tempWarnC}°C 列入警示；&gt; {tempCriticalC}°C 為嚴重高溫
          </p>
        </div>
        <div className="text-sm text-muted shrink-0">
          {alertBeacons.length} alert{alertBeacons.length !== 1 ? 's' : ''} ·{' '}
          {isConnected ? 'Socket Connected · 實時更新' : 'Socket Disconnected'}
        </div>
      </div>

      {alertBeacons.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted">
          <Thermometer className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium text-foreground">目前沒有溫度警示</p>
          <p className="text-sm mt-2">所有 Beacon 溫度均在 {tempWarnC}°C 或以下</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {critical.length > 0 && (
            <AlertSection
              title={`嚴重高溫（&gt; ${tempCriticalC}°C）`}
              count={critical.length}
              tone="critical"
              beacons={critical}
              isAdmin={isAdmin}
            />
          )}
          {warn.length > 0 && (
            <AlertSection
              title={`溫度偏高（&gt; ${tempWarnC}°C）`}
              count={warn.length}
              tone="warn"
              beacons={warn}
              isAdmin={isAdmin}
            />
          )}
        </div>
      )}
    </div>
  );
};

function AlertSection({ title, count, tone, beacons, isAdmin }) {
  const headerClass =
    tone === 'critical'
      ? 'text-red-700 dark:text-red-400'
      : 'text-orange-600 dark:text-orange-400';

  return (
    <section>
      <h3 className={`text-lg font-bold mb-4 ${headerClass}`}>
        {title} · {count}
      </h3>
      <div className="flex flex-col gap-4">
        {beacons.map((beacon) => (
          <BeaconCard key={beacon.mac_addr} beacon={beacon} isAdmin={isAdmin} />
        ))}
      </div>
    </section>
  );
}
