import { beaconDisplayName, gatewayDisplayName } from './beaconDisplay';
import { getTempAlertLevel, parseBeaconTempC } from './tempAlerts';

export const SORT_OPTIONS = [
  { value: 'name', label: '名稱' },
  { value: 'temp', label: '溫度' },
  { value: 'status', label: '狀態' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'lastSeen', label: '最後更新' },
];

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'in', label: '在線' },
  { value: 'out', label: '離線' },
  { value: 'alert', label: '警示狀態' },
  { value: 'tempAlert', label: '溫度警示' },
];

const STATUS_ORDER = { alert: 0, out: 1, in: 2 };

export function filterBeacons(beacons, { statusFilter = 'all', thresholds } = {}) {
  return beacons.filter((beacon) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'tempAlert') {
      return getTempAlertLevel(beacon.temp, thresholds) !== 'none';
    }
    return beacon.status === statusFilter;
  });
}

export function sortBeacons(beacons, { sortBy = 'name', sortDir = 'asc' } = {}) {
  const dir = sortDir === 'desc' ? -1 : 1;

  return [...beacons].sort((a, b) => {
    let cmp = 0;

    switch (sortBy) {
      case 'temp': {
        const ta = parseBeaconTempC(a.temp);
        const tb = parseBeaconTempC(b.temp);
        if (ta == null && tb == null) cmp = 0;
        else if (ta == null) cmp = 1;
        else if (tb == null) cmp = -1;
        else cmp = ta - tb;
        break;
      }
      case 'status':
        cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        break;
      case 'gateway':
        cmp = gatewayDisplayName(a).localeCompare(
          gatewayDisplayName(b),
          undefined,
          { sensitivity: 'base', numeric: true },
        );
        break;
      case 'lastSeen': {
        const ta = a.report_at ? new Date(a.report_at).getTime() : 0;
        const tb = b.report_at ? new Date(b.report_at).getTime() : 0;
        cmp = ta - tb;
        break;
      }
      case 'name':
      default:
        cmp = beaconDisplayName(a).localeCompare(
          beaconDisplayName(b),
          undefined,
          { sensitivity: 'base', numeric: true },
        );
        if (cmp === 0) {
          cmp = (a.mac_addr || '').localeCompare(b.mac_addr || '', undefined, { numeric: true });
        }
        break;
    }

    return cmp * dir;
  });
}
