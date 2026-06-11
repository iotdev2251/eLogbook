export const TEMP_WARN_C = 32;
export const TEMP_CRITICAL_C = 36;

export function parseBeaconTempC(temp) {
  if (temp == null || temp === '') return null;
  const n = typeof temp === 'number' ? temp : parseFloat(String(temp));
  return Number.isFinite(n) ? n : null;
}

/** @returns {'none' | 'warn' | 'critical'} */
export function getTempAlertLevel(temp) {
  const c = parseBeaconTempC(temp);
  if (c == null) return 'none';
  if (c > TEMP_CRITICAL_C) return 'critical';
  if (c > TEMP_WARN_C) return 'warn';
  return 'none';
}

export function hasTempAlert(beacon) {
  return getTempAlertLevel(beacon?.temp) !== 'none';
}

export function countTempAlerts(beacons) {
  return beacons.filter(hasTempAlert).length;
}

export function filterTempAlertBeacons(beacons) {
  return beacons
    .filter(hasTempAlert)
    .sort((a, b) => parseBeaconTempC(b.temp) - parseBeaconTempC(a.temp));
}
