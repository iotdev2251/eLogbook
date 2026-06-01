import { parseMfrPayload } from '../app/mqtt/mfr-parser.js'

describe('parseMfrPayload', () => {
    test('parses legacy fixed-offset for 80ECCC MAC (0.1°C)', () => {
        const hex = '000000000000' + 'fa00' + '64' + '00'
        const r = parseMfrPayload(hex, '80ECCCCE50B5')
        expect(r.temp).toBe(250)
        expect(r.battery).toBe(100)
    })

    test('parses legacy for 88ECCCD MAC prefix', () => {
        const hex = '000000000000' + 'f900' + '64' + '00'
        const r = parseMfrPayload(hex, '88ECCCD000B6')
        expect(r.temp).toBe(249)
        expect(r.profile).toBe('legacy-offset')
    })

    test('parses Minew HT frame (0.05°C per step)', () => {
        const bytes = [0xe1, 0xff, 0x01, 0x01, 100, 0xea, 0x01]
        const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
        const r = parseMfrPayload(hex, '88ECCCCE2B21')
        expect(r.temp).toBe(245)
        expect(r.profile).toBe('minew-ht')
    })

    test('rejects 58.8°C at legacy offset (588)', () => {
        const hex = '0000000000004c0215'
        const r = parseMfrPayload(hex, '80ECCCCE50B5')
        expect(r.temp).toBeNull()
    })

    test('88ECCCCE does not use legacy offset without HT frame', () => {
        const hex = '0000000000004c0215'
        const r = parseMfrPayload(hex, '88ECCCCE5CAD')
        expect(r.temp).toBeNull()
        expect(r.profile).not.toBe('legacy-offset')
    })

    test('scans HT frame without leading E1FF in MFR', () => {
        const bytes = [0x01, 0x01, 100, 0xea, 0x01]
        const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
        const r = parseMfrPayload(hex, '88ECCCCE5D79')
        expect(r.profile).toBe('minew-ht')
        expect(r.temp).toBe(245)
    })
})
