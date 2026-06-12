export const DEFAULT_TEMP_WARN_C = 32;
export const DEFAULT_TEMP_CRITICAL_C = 36;

/** @deprecated use DEFAULT_TEMP_WARN_C */
export const TEMP_WARN_C = DEFAULT_TEMP_WARN_C;
/** @deprecated use DEFAULT_TEMP_CRITICAL_C */
export const TEMP_CRITICAL_C = DEFAULT_TEMP_CRITICAL_C;

export function parseBeaconTempC(temp) {
  if (temp == null || temp === '') return null;
  const n = typeof temp === 'number' ? temp : parseFloat(String(temp));
  return Number.isFinite(n) ? n : null;
}

function resolveThresholds(thresholds) {
  const warnC = Number(thresholds?.tempWarnC);
  const criticalC = Number(thresholds?.tempCriticalC);
  return {
    warnC: Number.isFinite(warnC) ? warnC : DEFAULT_TEMP_WARN_C,
    criticalC: Number.isFinite(criticalC) ? criticalC : DEFAULT_TEMP_CRITICAL_C,
  };
}

/** @returns {'none' | 'warn' | 'critical'} */
export function getTempAlertLevel(temp, thresholds) {
  const { warnC, criticalC } = resolveThresholds(thresholds);
  const c = parseBeaconTempC(temp);
  if (c == null) return 'none';
  if (c > criticalC) return 'critical';
  if (c > warnC) return 'warn';
  return 'none';
}

export function hasTempAlert(beacon, thresholds) {
  return getTempAlertLevel(beacon?.temp, thresholds) !== 'none';
}

export function countTempAlerts(beacons, thresholds) {
  return beacons.filter((beacon) => hasTempAlert(beacon, thresholds)).length;
}

export function filterTempAlertBeacons(beacons, thresholds) {
  return beacons
    .filter((beacon) => hasTempAlert(beacon, thresholds))
    .sort((a, b) => parseBeaconTempC(b.temp) - parseBeaconTempC(a.temp));
}
