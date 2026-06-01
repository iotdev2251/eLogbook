/**
 * Parse BLE manufacturer data (MFR hex) into temperature and battery.
 *
 * Temperature storage unit: 0.1°C (246 => 24.6°C on API).
 * Battery: 0–100 %.
 *
 * Minew HT frame (0x01 after 0xE1FF): temp raw × 0.05°C, then ×10 for storage.
 * Minew Info frame (0xA1): battery only — no temperature in this advertisement.
 * Legacy fixed offset: only for 80ECCA/B/C MAC prefixes when no Minew header present.
 */

const TEMP_STORE_MIN = -400  // -40.0°C
const TEMP_STORE_MAX = 1000  // 100.0°C
/** Typical indoor / sensor range used to reject iBeacon bytes misread as temp */
const TEMP_PLAUSIBLE_MIN = 100  // 10.0°C
const TEMP_PLAUSIBLE_MAX = 450  // 45.0°C
const BATTERY_MIN = 0
const BATTERY_MAX = 100

const LEGACY_MAC_PREFIXES = ['80ECCA', '80ECCB', '80ECCC']

function normalizeMfrHex(mfr) {
    if (mfr == null) return ''
    return String(mfr).replace(/[^0-9a-fA-F]/g, '').toUpperCase()
}

function hexToBytes(hex) {
    const bytes = []
    for (let i = 0; i + 1 < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16))
    }
    return bytes
}

function readInt16LE(bytes, offset) {
    if (offset + 1 >= bytes.length) return null
    const value = bytes[offset] | (bytes[offset + 1] << 8)
    return value > 0x7fff ? value - 0x10000 : value
}

function isValidStoredTemp(temp) {
    return temp != null && temp >= TEMP_STORE_MIN && temp <= TEMP_STORE_MAX
}

function isPlausibleSensorTemp(temp) {
    return temp != null && temp >= TEMP_PLAUSIBLE_MIN && temp <= TEMP_PLAUSIBLE_MAX
}

function isValidBattery(battery) {
    return battery != null && battery >= BATTERY_MIN && battery <= BATTERY_MAX
}

function macUsesLegacyLayout(macAddr) {
    if (!macAddr) return false
    const mac = String(macAddr).replace(/[^0-9a-fA-F]/g, '').toUpperCase()
    return LEGACY_MAC_PREFIXES.some(prefix => mac.startsWith(prefix))
}

/** Legacy: temp int16 LE at byte 6 (0.1°C), battery at byte 8 */
function parseLegacyFixedOffset(bytes) {
    if (bytes.length < 9) return null

    const tempRaw = readInt16LE(bytes, 6)
    const battery = bytes[8]

    if (tempRaw == null || !isValidBattery(battery)) return null

    const temp = tempRaw
    if (!isPlausibleSensorTemp(temp)) return null

    return { temp, battery, profile: 'legacy-offset' }
}

/** Minew payload immediately after 0xE1FF company ID */
function parseMinewFrameAt(bytes, frameStart) {
    if (frameStart + 6 >= bytes.length) return null

    const frameType = bytes[frameStart]
    const battery = bytes[frameStart + 2]

    // HT sensor frame — temperature unit 0.05°C per raw count
    if (frameType === 0x01) {
        const tempRaw = readInt16LE(bytes, frameStart + 3)
        if (tempRaw == null || !isValidBattery(battery)) return null

        const temp = Math.round(tempRaw * 0.5)
        if (!isPlausibleSensorTemp(temp)) return null

        return { temp, battery, profile: 'minew-ht' }
    }

    // Info frame — battery only (no temperature field)
    if (frameType === 0xa1) {
        if (!isValidBattery(battery)) return null
        return { temp: null, battery, profile: 'minew-info' }
    }

    return null
}

/** Collect all Minew frames in payload; prefer HT over Info */
function parseMinewPayload(bytes) {
    let htResult = null
    let infoResult = null

    for (let i = 0; i < bytes.length - 4; i++) {
        if (bytes[i] !== 0xe1 || bytes[i + 1] !== 0xff) continue

        const parsed = parseMinewFrameAt(bytes, i + 2)
        if (!parsed) continue

        if (parsed.profile === 'minew-ht') {
            htResult = parsed
        } else if (parsed.profile === 'minew-info') {
            infoResult = parsed
        }
    }

    if (htResult) return htResult
    if (infoResult) return infoResult

    return null
}

function hasMinewCompanyId(bytes) {
    for (let i = 0; i < bytes.length - 1; i++) {
        if (bytes[i] === 0xe1 && bytes[i + 1] === 0xff) return true
    }
    return false
}

/**
 * @param {string} mfr - Manufacturer data hex from gateway
 * @param {string} [macAddr] - Beacon MAC for legacy layout selection
 */
function parseMfrPayload(mfr, macAddr) {
    const hex = normalizeMfrHex(mfr)
    if (hex.length < 8) {
        return { temp: null, battery: null, profile: null }
    }

    const bytes = hexToBytes(hex)

    if (hasMinewCompanyId(bytes)) {
        const minew = parseMinewPayload(bytes)
        if (minew) return minew
        // Minew device but iBeacon/UID/etc. in this packet — do not guess from fixed offset
        return { temp: null, battery: null, profile: 'minew-non-sensor' }
    }

    if (macUsesLegacyLayout(macAddr)) {
        const legacy = parseLegacyFixedOffset(bytes)
        if (legacy) return legacy
    }

    return { temp: null, battery: null, profile: null }
}

export {
    parseMfrPayload,
    normalizeMfrHex,
    isValidStoredTemp,
    isPlausibleSensorTemp,
    isValidBattery,
    macUsesLegacyLayout,
}
