import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const beaconDisplayName = (beacon) =>
  (beacon.nickname || beacon.name || beacon.mac_addr || '').trim();

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
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted">
                尚未有可用溫度資料
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis type="number" dataKey="temp" unit="°C" />
                  <YAxis type="category" dataKey="beaconName" width={150} />
                  <Tooltip formatter={(value) => [`${value}°C`, 'Temperature']} />
                  <Line type="monotone" dataKey="temp" stroke="#00b8d4" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
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
