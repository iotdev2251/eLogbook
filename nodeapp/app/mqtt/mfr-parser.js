/**
 * Parse BLE manufacturer data (MFR hex) into temperature and battery.
 *
 * Minew HT (0x01): temp raw × 0.05°C → stored as ×10 (490 → 24.5°C).
 * Minew Info (0xA1): battery only.
 * Legacy offset byte 6/8: 0.1°C — only for 80ECCA/B/C and 88ECCCD MAC prefixes.
 */

import { isPlausibleSensorTemp, isValidBattery } from '../beacon/sensor-values.js'

const LEGACY_MAC_PREFIXES = ['80ECCA', '80ECCB', '80ECCC', '88ECCCD']

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

function normalizeMac(macAddr) {
    return String(macAddr || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase()
}

function macUsesLegacyLayout(macAddr) {
    const mac = normalizeMac(macAddr)
    return LEGACY_MAC_PREFIXES.some(prefix => mac.startsWith(prefix))
}

function macIsMinewSensorFamily(macAddr) {
    return normalizeMac(macAddr).startsWith('88ECC')
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

/** Minew payload at frame type byte */
function parseMinewFrameAt(bytes, frameStart) {
    if (frameStart + 6 >= bytes.length) return null

    const frameType = bytes[frameStart]
    const battery = bytes[frameStart + 2]

    if (frameType === 0x01) {
        const tempRaw = readInt16LE(bytes, frameStart + 3)
        if (tempRaw == null || !isValidBattery(battery)) return null

        const temp = Math.round(tempRaw * 0.5)
        if (!isPlausibleSensorTemp(temp)) return null

        return { temp, battery, profile: 'minew-ht' }
    }

    if (frameType === 0xa1) {
        if (!isValidBattery(battery)) return null
        return { temp: null, battery, profile: 'minew-info' }
    }

    return null
}

function parseMinewPayload(bytes) {
    let htResult = null
    let infoResult = null

    for (let i = 0; i < bytes.length - 4; i++) {
        if (bytes[i] !== 0xe1 || bytes[i + 1] !== 0xff) continue

        const parsed = parseMinewFrameAt(bytes, i + 2)
        if (!parsed) continue

        if (parsed.profile === 'minew-ht') htResult = parsed
        else if (parsed.profile === 'minew-info') infoResult = parsed
    }

    if (htResult) return htResult
    if (infoResult) return infoResult
    return null
}

/** Find HT frame when MFR is a slice without leading E1FF (common on 88ECCCE devices) */
function scanForMinewHtFrame(bytes) {
    for (let i = 0; i < bytes.length - 7; i++) {
        let frameStart = -1

        if (bytes[i] === 0xe1 && bytes[i + 1] === 0xff && bytes[i + 2] === 0x01) {
            frameStart = i + 2
        } else if (bytes[i] === 0x01 && bytes[i + 1] <= 0x20) {
            frameStart = i
        }

        if (frameStart < 0) continue

        const parsed = parseMinewFrameAt(bytes, frameStart)
        if (parsed?.profile === 'minew-ht') return parsed
    }
    return null
}

function hasMinewCompanyId(bytes) {
    for (let i = 0; i < bytes.length - 1; i++) {
        if (bytes[i] === 0xe1 && bytes[i + 1] === 0xff) return true
    }
    return false
}

function parseMfrPayload(mfr, macAddr) {
    const hex = normalizeMfrHex(mfr)
    if (hex.length < 8) {
        return { temp: null, battery: null, profile: null }
    }

    const bytes = hexToBytes(hex)

    if (hasMinewCompanyId(bytes)) {
        const minew = parseMinewPayload(bytes)
        if (minew) return minew
        return { temp: null, battery: null, profile: 'minew-non-sensor' }
    }

    if (macIsMinewSensorFamily(macAddr)) {
        const ht = scanForMinewHtFrame(bytes)
        if (ht) return ht
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
    macUsesLegacyLayout,
    macIsMinewSensorFamily,
}
