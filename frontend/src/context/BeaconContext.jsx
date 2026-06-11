import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import { beaconDisplayName } from '../utils/beaconDisplay';
import { mergeBeaconRecord } from '../utils/mergeBeacon';

const BeaconContext = createContext(null);

export function BeaconProvider({ children }) {
  const [beacons, setBeacons] = useState({});
  const [updatesPerMin, setUpdatesPerMin] = useState(0);
  const updateTimestamps = useRef([]);
  const { socket, isConnected } = useSocket('/');

  const recordSocketActivity = useCallback(() => {
    const now = Date.now();
    updateTimestamps.current.push(now);
    updateTimestamps.current = updateTimestamps.current.filter((t) => now - t < 60_000);
    setUpdatesPerMin(updateTimestamps.current.length);
  }, []);

  const mergeBeaconUpdates = useCallback((data) => {
    if (!Array.isArray(data) || data.length === 0) return;
    recordSocketActivity();
    setBeacons((prev) => {
      const next = { ...prev };
      data.forEach((incoming) => {
        if (!incoming?.mac_addr) return;
        next[incoming.mac_addr] = mergeBeaconRecord(prev[incoming.mac_addr], incoming);
      });
      return next;
    });
  }, [recordSocketActivity]);

  useEffect(() => {
    axios.get('/beacons')
      .then((res) => {
        const beaconMap = {};
        res.data.forEach((b) => {
          if (b?.mac_addr) beaconMap[b.mac_addr] = b;
        });
        setBeacons(beaconMap);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const onData = (data) => mergeBeaconUpdates(data);
    socket.on('ADDED_DATA', onData);
    return () => socket.off('ADDED_DATA', onData);
  }, [socket, mergeBeaconUpdates]);

  const beaconList = useMemo(() => (
    Object.values(beacons).sort((a, b) => {
      const byName = beaconDisplayName(a).localeCompare(
        beaconDisplayName(b),
        undefined,
        { sensitivity: 'base', numeric: true },
      );
      if (byName !== 0) return byName;
      return (a.mac_addr || '').localeCompare(b.mac_addr || '', undefined, { numeric: true });
    })
  ), [beacons]);

  const value = useMemo(() => ({
    beacons,
    beaconList,
    isConnected,
    updatesPerMin,
    mergeBeaconUpdates,
  }), [beacons, beaconList, isConnected, updatesPerMin, mergeBeaconUpdates]);

  return (
    <BeaconContext.Provider value={value}>
      {children}
    </BeaconContext.Provider>
  );
}

export function useBeacons() {
  const ctx = useContext(BeaconContext);
  if (!ctx) {
    throw new Error('useBeacons must be used within BeaconProvider');
  }
  return ctx;
}
