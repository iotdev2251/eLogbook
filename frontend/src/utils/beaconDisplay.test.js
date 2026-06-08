import { describe, it, expect } from 'vitest';
import {
  beaconDisplayName,
  gatewayDisplayName,
  formatBeaconStatus,
} from './beaconDisplay.js';

describe('beaconDisplay', () => {
  it('prefers nickname then name then mac', () => {
    expect(beaconDisplayName({ nickname: 'Room A', name: 'BLE', mac_addr: 'AA' })).toBe('Room A');
    expect(beaconDisplayName({ name: 'BLE', mac_addr: 'AA' })).toBe('BLE');
    expect(beaconDisplayName({ mac_addr: '88ECC001' })).toBe('88ECC001');
  });

  it('formats gateway and status labels', () => {
    expect(gatewayDisplayName({ gateway_name: 'Floor 1' })).toBe('Floor 1');
    expect(formatBeaconStatus('in')).toBe('In Range');
    expect(formatBeaconStatus('out')).toBe('Out');
    expect(formatBeaconStatus('alert')).toBe('Alert');
  });
});
