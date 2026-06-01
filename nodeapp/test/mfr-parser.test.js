import { parseMfrPayload } from '../app/mqtt/mfr-parser.js'

describe('parseMfrPayload', () => {
    test('parses legacy fixed-offset for 80ECCC MAC (0.1°C)', () => {
        const hex = '000000000000' + 'fa00' + '64' + '00'
        const r = parseMfrPayload(hex, '80ECCCCE50B5')
        expect(r.temp).toBe(250)
        expect(r.battery).toBe(100)
        expect(r.profile).toBe('legacy-offset')
    })

    test('parses Minew HT frame (0.05°C per step)', () => {
        const bytes = [0xe1, 0xff, 0x01, 0x01, 100, 0xea, 0x01]
        const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
        const r = parseMfrPayload(hex, '88ECCCE2B21')
        expect(r.temp).toBe(245)
        expect(r.battery).toBe(100)
        expect(r.profile).toBe('minew-ht')
    })

    test('Minew Info frame returns battery only', () => {
        const bytes = [0xe1, 0xff, 0xa1, 0x08, 0x55]
        const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
        const r = parseMfrPayload(hex, '88ECCCE2B21')
        expect(r.temp).toBeNull()
        expect(r.battery).toBe(0x55)
        expect(r.profile).toBe('minew-info')
    })

    test('rejects 58.8°C legacy misread (588 at offset 6, battery 21)', () => {
        const hex = '0000000000004c0215'
        const r = parseMfrPayload(hex, '80ECCCCE50B5')
        expect(r.temp).toBeNull()
    })

    test('88ECC MAC does not use legacy offset without Minew HT', () => {
        const hex = '0000000000004c0215'
        const r = parseMfrPayload(hex, '88ECCCCE5CAD')
        expect(r.temp).toBeNull()
        expect(r.profile).not.toBe('legacy-offset')
    })

    test('prefers HT over Info when both Minew frames appear', () => {
        const ht = [0xe1, 0xff, 0x01, 0x01, 90, 0xfa, 0x00]
        const info = [0xe1, 0xff, 0xa1, 0x08, 0x15]
        const hex = [...ht, ...info].map(b => b.toString(16).padStart(2, '0')).join('')
        const r = parseMfrPayload(hex, '88ECCCE2B21')
        expect(r.profile).toBe('minew-ht')
        expect(r.temp).toBe(250)
    })
})
