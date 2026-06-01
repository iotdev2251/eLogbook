import { parseMfrPayload } from '../app/mqtt/mfr-parser.js'

describe('parseMfrPayload', () => {
    test('parses legacy fixed-offset payload (0.1°C)', () => {
        // bytes 6-7 = 0xF6,0x00 => 246 => 24.6°C; byte 8 = 100%
        const hex = '000000000000' + 'f600' + '64' + '00'
        const r = parseMfrPayload(hex)
        expect(r.temp).toBe(246)
        expect(r.battery).toBe(100)
    })

    test('parses Minew HT frame after E1FF', () => {
        // E1 FF | 01 01 | batt=100 | temp raw 490 => 24.5°C => store 245
        const bytes = [0xe1, 0xff, 0x01, 0x01, 100, 0xea, 0x01]
        const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
        const r = parseMfrPayload(hex)
        expect(r.temp).toBe(245)
        expect(r.battery).toBe(100)
        expect(r.profile).toBe('minew-ht')
    })

    test('parses Minew Info frame (battery only)', () => {
        const bytes = [0xe1, 0xff, 0xa1, 0x08, 0x55]
        const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
        const r = parseMfrPayload(hex)
        expect(r.temp).toBeNull()
        expect(r.battery).toBe(0x55)
        expect(r.profile).toBe('minew-info')
    })

    test('rejects impossible values from wrong offset', () => {
        const r = parseMfrPayload('ffffffffffffb565df')
        expect(r.temp).toBeNull()
        expect(r.battery).toBeNull()
    })
})
