import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';

const beaconDisplayName = (beacon) =>
  (beacon.nickname || beacon.name || beacon.mac_addr || '').trim();

const chartMinTemp = 10;
const chartMaxTemp = 45;

function TemperatureSvgChart({ data }) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        尚未有可用溫度資料
      </div>
    );
  }

  const width = 980;
  const height = 320;
  const leftPad = 180;
  const rightPad = 28;
  const topPad = 20;
  const bottomPad = 24;
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;

  const yStep = data.length > 1 ? plotHeight / (data.length - 1) : 0;
  const tempToX = (t) =>
    leftPad + ((Math.max(chartMinTemp, Math.min(chartMaxTemp, t)) - chartMinTemp) / (chartMaxTemp - chartMinTemp)) * plotWidth;

  const points = data.map((d, i) => ({
    x: tempToX(d.temp),
    y: topPad + i * yStep,
    name: d.beaconName,
    temp: d.temp,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const gridTemps = [10, 15, 20, 25, 30, 35, 40, 45];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[760px] h-[320px]">
        {gridTemps.map((t) => {
          const x = tempToX(t);
          return (
            <g key={t}>
              <line x1={x} y1={topPad} x2={x} y2={height - bottomPad} stroke="currentColor" strokeOpacity="0.12" />
              <text x={x} y={height - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">{t}°C</text>
            </g>
          );
        })}

        {points.map((p) => (
          <text
            key={`name-${p.name}`}
            x={leftPad - 10}
            y={p.y + 4}
            textAnchor="end"
            fontSize="11"
            fill="currentColor"
            opacity="0.85"
          >
            {p.name}
          </text>
        ))}

        <polyline
          points={polyline}
          fill="none"
          stroke="#00b8d4"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p) => (
          <g key={`dot-${p.name}-${p.temp}`}>
            <circle cx={p.x} cy={p.y} r="4" fill="#00b8d4" />
            <text x={p.x + 8} y={p.y - 8} fontSize="11" fill="currentColor" opacity="0.85">{p.temp}°C</text>
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
        <h2 className="text-2xl font-bold font-display">Real Time Status</h2>
        <div className="text-sm text-muted">
          {beaconList.length} beacons · {isConnected ? 'Socket Connected' : 'Socket Disconnected'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-lg font-bold mb-1">Dashboard 1: Temperature Line Chart</h3>
          <p className="text-xs text-muted mb-4">X 軸：Temperature (°C) · Y 軸：Beacon 名稱</p>
          <div className="h-[340px]">
            <TemperatureSvgChart data={chartData} />
          </div>
        </div>

        <div className="glass-panel p-6 min-h-[340px]">
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
