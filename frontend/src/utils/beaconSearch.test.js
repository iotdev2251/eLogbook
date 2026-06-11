import { describe, it, expect } from 'vitest';
import { beaconMatchesSearch, beaconSearchableText } from './beaconSearch';

describe('beaconSearch', () => {
  const beacon = {
    mac_addr: '80ECCC0008B6',
    nickname: 'Beacon 1',
    name: 'Beacon 1',
    gateway_name: 'Workshop',
    gateway_id: 'Workshop',
    status: 'in',
    temp: 36.4,
    battery: 100,
    rssi: -48,
    report_at: '2026-06-10T08:30:00.000Z',
  };

  it('matches gateway name', () => {
    expect(beaconMatchesSearch(beacon, 'workshop')).toBe(true);
  });

  it('matches battery and rssi', () => {
    expect(beaconMatchesSearch(beacon, '100')).toBe(true);
    expect(beaconMatchesSearch(beacon, '-48')).toBe(true);
    expect(beaconMatchesSearch(beacon, 'dbm')).toBe(true);
  });

  it('matches status label', () => {
    expect(beaconMatchesSearch(beacon, 'in range')).toBe(true);
  });

  it('matches temperature', () => {
    expect(beaconMatchesSearch(beacon, '36.4')).toBe(true);
  });

  it('includes mac without colons in searchable text', () => {
    expect(beaconSearchableText(beacon)).toContain('80eccc0008b6');
  });
});
