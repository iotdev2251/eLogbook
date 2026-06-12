import { describe, it, expect } from 'vitest';
import { filterBeacons, sortBeacons } from './sortBeacons';

describe('sortBeacons', () => {
  const list = [
    { mac_addr: 'a', nickname: 'B2', temp: 30, status: 'in', gateway_name: 'Workshop', report_at: '2026-01-02T10:00:00Z' },
    { mac_addr: 'b', nickname: 'B1', temp: 35, status: 'alert', gateway_name: 'Office', report_at: '2026-01-02T12:00:00Z' },
    { mac_addr: 'c', nickname: 'B3', temp: 25, status: 'out', gateway_name: 'Workshop', report_at: '2026-01-02T08:00:00Z' },
  ];

  it('filters by status', () => {
    expect(filterBeacons(list, { statusFilter: 'in' }).map((b) => b.mac_addr)).toEqual(['a']);
  });

  it('filters temp alerts', () => {
    const thresholds = { tempWarnC: 32, tempCriticalC: 36 };
    expect(filterBeacons(list, { statusFilter: 'tempAlert', thresholds }).map((b) => b.mac_addr)).toEqual(['b']);
  });

  it('sorts by temperature descending', () => {
    const sorted = sortBeacons(list, { sortBy: 'temp', sortDir: 'desc' });
    expect(sorted.map((b) => b.mac_addr)).toEqual(['b', 'a', 'c']);
  });
});
