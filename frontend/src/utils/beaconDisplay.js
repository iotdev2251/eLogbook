export const beaconDisplayName = (beacon) =>
  (beacon?.nickname || beacon?.name || beacon?.mac_addr || '').trim();

export const gatewayDisplayName = (beacon) =>
  (beacon?.gateway_name || beacon?.gateway_id || '').trim();

export const STATUS_LABELS = {
  in: 'In Range',
  out: 'Out',
  alert: 'Alert',
};

export function formatBeaconStatus(status) {
  return STATUS_LABELS[status] || status || '—';
}
