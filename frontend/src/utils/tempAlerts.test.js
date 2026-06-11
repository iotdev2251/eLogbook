import { describe, it, expect } from 'vitest';
import {
  getTempAlertLevel,
  hasTempAlert,
  countTempAlerts,
  filterTempAlertBeacons,
} from './tempAlerts';

describe('tempAlerts', () => {
  it('returns none at or below 32°C', () => {
    expect(getTempAlertLevel(32)).toBe('none');
    expect(getTempAlertLevel(30)).toBe('none');
    expect(getTempAlertLevel(null)).toBe('none');
  });

  it('returns warn above 32°C up to 36°C', () => {
    expect(getTempAlertLevel(32.1)).toBe('warn');
    expect(getTempAlertLevel(36)).toBe('warn');
  });

  it('returns critical above 36°C', () => {
    expect(getTempAlertLevel(36.1)).toBe('critical');
    expect(getTempAlertLevel(40)).toBe('critical');
  });

  it('filters and counts alert beacons', () => {
    const list = [
      { mac_addr: 'a', temp: 30 },
      { mac_addr: 'b', temp: 33 },
      { mac_addr: 'c', temp: 37 },
    ];
    expect(countTempAlerts(list)).toBe(2);
    expect(filterTempAlertBeacons(list).map((b) => b.mac_addr)).toEqual(['c', 'b']);
  });
});
