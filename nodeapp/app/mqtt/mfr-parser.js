/**
 * Parse BLE manufacturer data (MFR hex) into temperature and battery.
 * Supports Minew HT / Info frames and legacy fixed-offset payloads.
 *
 * Stored temperature unit: 0.1°C (e.g. 246 => 24.6°C on API).
 * Battery: 0–100 percent.
 */

const TEMP_STORE_MIN = -400  // -40.0°C
const TEMP_STORE_MAX = 1000  // 100.0°C
const BATTERY_MIN = 0
const BATTERY_MAX = 100

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

function isValidBattery(battery) {
    return battery != null && battery >= BATTERY_MIN && battery <= BATTERY_MAX
}

/** Legacy layout: temp int16 LE at byte 6 (0.1°C), battery at byte 8 */
function parseLegacyFixedOffset(bytes) {
    if (bytes.length < 9) return null

    const tempRaw = readInt16LE(bytes, 6)
    const battery = bytes[8]

    if (tempRaw == null || !isValidBattery(battery)) return null

    const temp = tempRaw // already 0.1°C units
    if (!isValidStoredTemp(temp)) return null

    return { temp, battery, profile: 'legacy-offset' }
}

/** Minew service data after company ID 0xE1FF */
function parseMinewFrame(bytes, frameStart) {
    if (frameStart + 7 >= bytes.length) return null

    const frameType = bytes[frameStart]
    const battery = bytes[frameStart + 2]

    // HT sensor frame (temperature + humidity)
    if (frameType === 0x01) {
        const tempRaw = readInt16LE(bytes, frameStart + 3)
        if (tempRaw == null || !isValidBattery(battery)) return null

        // Minew HT: temperature unit is 0.05°C per raw step
        const temp = Math.round(tempRaw * 0.5)
        if (!isValidStoredTemp(temp)) return null

        return { temp, battery, profile: 'minew-ht' }
    }

    // Info frame (battery only; temperature not in this advertisement)
    if (frameType === 0xa1 || frameType === 0xA1) {
        if (!isValidBattery(battery)) return null
        return { temp: null, battery, profile: 'minew-info' }
    }

    return null
}

function findMinewFrameStart(bytes) {
    for (let i = 0; i < bytes.length - 4; i++) {
        if (bytes[i] === 0xe1 && bytes[i + 1] === 0xff) {
            return i + 2
        }
    }
    return -1
}

/** Scan for plausible temp + battery byte pairs (fallback) */
function parseByScan(bytes) {
    for (let i = 0; i + 3 < bytes.length; i++) {
        const tempRaw = readInt16LE(bytes, i)
        const battery = bytes[i + 2]
        if (tempRaw == null || !isValidBattery(battery)) continue

        const candidates = [
            { temp: tempRaw, profile: 'scan-0.1c' },
            { temp: Math.round(tempRaw * 0.5), profile: 'scan-0.05c' },
        ]

        for (const c of candidates) {
            if (isValidStoredTemp(c.temp)) {
                return { temp: c.temp, battery, profile: c.profile }
            }
        }
    }
    return null
}

/**
 * @param {string} mfr - Manufacturer data hex from gateway
 * @returns {{ temp: number|null, battery: number|null, profile: string|null }}
 */
function parseMfrPayload(mfr) {
    const hex = normalizeMfrHex(mfr)
    if (hex.length < 8) {
        return { temp: null, battery: null, profile: null }
    }

    const bytes = hexToBytes(hex)
    const parsers = []

    const minewStart = findMinewFrameStart(bytes)
    if (minewStart >= 0) {
        parsers.push(() => parseMinewFrame(bytes, minewStart))
    }

    parsers.push(() => parseLegacyFixedOffset(bytes))
    parsers.push(() => parseByScan(bytes))

    for (const run of parsers) {
        const result = run()
        if (result != null) {
            return result
        }
    }

    return { temp: null, battery: null, profile: null }
}

export {
    parseMfrPayload,
    normalizeMfrHex,
    isValidStoredTemp,
    isValidBattery,
}
