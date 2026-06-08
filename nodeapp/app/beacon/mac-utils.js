export function normalizeMac(macAddr) {
    return String(macAddr || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase()
}
