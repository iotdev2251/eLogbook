import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';

const beaconDisplayName = (beacon) =>
  (beacon.nickname || beacon.name || beacon.mac_addr || '').trim();

const chartMinTemp = 10;
const chartMaxTemp = 45;

function truncateLabel(text, max = 14) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** X = Beacon 名稱，Y = 溫度 (°C) */
function TemperatureSvgChart({ data }) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        尚未有可用溫度資料
      </div>
    );
  }

  const width = Math.max(760, 120 + data.length * 72);
  const height = 360;
  const leftPad = 52;
  const rightPad = 24;
  const topPad = 16;
  const bottomPad = 88;
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;

  const xStep = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const tempToY = (t) =>
    topPad + plotHeight - ((Math.max(chartMinTemp, Math.min(chartMaxTemp, t)) - chartMinTemp) / (chartMaxTemp - chartMinTemp)) * plotHeight;

  const points = data.map((d, i) => ({
    x: leftPad + (data.length > 1 ? i * xStep : plotWidth / 2),
    y: tempToY(d.temp),
    name: d.beaconName,
    temp: d.temp,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const gridTemps = [10, 15, 20, 25, 30, 35, 40, 45];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[360px]" style={{ minWidth: `${Math.min(width, 1200)}px` }}>
        {gridTemps.map((t) => {
          const y = tempToY(t);
          return (
            <g key={t}>
              <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} stroke="currentColor" strokeOpacity="0.12" />
              <text x={leftPad - 8} y={y + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">{t}°C</text>
            </g>
          );
        })}

        <line x1={leftPad} y1={topPad} x2={leftPad} y2={height - bottomPad} stroke="currentColor" strokeOpacity="0.2" />
        <line x1={leftPad} y1={height - bottomPad} x2={width - rightPad} y2={height - bottomPad} stroke="currentColor" strokeOpacity="0.2" />

        <polyline
          points={polyline}
          fill="none"
          stroke="#00b8d4"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p) => (
          <g key={`${p.name}-${p.temp}`}>
            <circle cx={p.x} cy={p.y} r="4" fill="#00b8d4" />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.85">{p.temp}°C</text>
            <text
              x={p.x}
              y={height - bottomPad + 36}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              opacity="0.85"
              transform={`rotate(-35, ${p.x}, ${height - bottomPad + 36})`}
            >
              {truncateLabel(p.name, 18)}
            </text>
            <title>{p.name}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

export const Dashboard = () => {
  const [beacons, setBeacons] = useState({});
  const { socket, isConnected } = useSocket('/');

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

  const beaconList = useMemo(() => (
    Object.values(beacons).sort((a, b) => {
      const byName = beaconDisplayName(a).localeCompare(
        beaconDisplayName(b),
        undefined,
        { sensitivity: 'base', numeric: true }
      );
      if (byName !== 0) return byName;
      return (a.mac_addr || '').localeCompare(b.mac_addr || '', undefined, { numeric: true });
    })
  ), [beacons]);

  const chartData = useMemo(() => (
    beaconList
      .filter(b => b.temp != null)
      .map(b => ({
        beaconName: beaconDisplayName(b),
        temp: Number(b.temp),
      }))
  ), [beaconList]);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">Dashboard</h2>
        <div className="text-sm text-muted">
          {beaconList.length} beacons · {isConnected ? 'Socket Connected' : 'Socket Disconnected'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-lg font-bold mb-1">Dashboard 1: Temperature Line Chart</h3>
          <p className="text-xs text-muted mb-4">X 軸：Beacon 名稱 · Y 軸：Temperature (°C)</p>
          <div className="h-[380px]">
            <TemperatureSvgChart data={chartData} />
          </div>
        </div>

        <div className="glass-panel p-6 min-h-[380px]">
          <h3 className="text-lg font-bold mb-1">Dashboard 2</h3>
          <p className="text-sm text-muted">預留空框，待你提供下一步需求。</p>
        </div>

        <div className="glass-panel p-6 min-h-[240px] lg:col-span-3">
          <h3 className="text-lg font-bold mb-1">Dashboard 3</h3>
          <p className="text-sm text-muted">預留空框，待你提供下一步需求。</p>
        </div>
      </div>
    </div>
  );
};
