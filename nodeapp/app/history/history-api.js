import { loggerFactory } from '../../config/logger.js';
import { BEACON_STATUS } from '../beacon/beacon-status.js';
import { c } from '../../config/constant.js'
import pkg from '@prisma/client'

const prisma = new pkg.PrismaClient()
const logger = loggerFactory('beacon-history-api')

const MAX_RECORD = c.HISTORY_API_PAGE_RECORD

class BeaconHistoryApi {
    async getAll(startPage) {
        try {
            const input = {
                skip: startPage * MAX_RECORD,
                take: MAX_RECORD,
                orderBy: { report_at: 'desc' }
            }

            const result = await prisma.beacon_history.findMany(input)
            return this._remap(result)
        }
        catch (e) {
            logger.error(e)
            throw e
            return []
        }
    }

    async get(beacon_mac_addr, startPage) {
        try {
            const input = {
                skip: startPage * MAX_RECORD,
                take: MAX_RECORD,
                where: { beacon_mac_addr: beacon_mac_addr },
                orderBy: { report_at: 'desc' }
            }

            const result = await prisma.beacon_history.findMany(input)
            return this._remap(result)
        }
        catch (e) {
            logger.error(e)
            throw e
            return []
        }
    }

    _remap(beacons){
        return beacons.map(beacon => {
            return {
                report_at: beacon.report_at,
                name: beacon.name,
                nickname: beacon.nickname,
                beacon_mac_addr: beacon.beacon_mac_addr,
                temp: beacon.temp / 10,
                battery: beacon.battery,
                rssi: beacon.rssi,
                status: beacon.status.toUpperCase(),
                gateway_name: beacon.gateway_name,
                gateway_mac_addr: beacon.gateway_mac_addr,
                alert: (beacon.status == BEACON_STATUS.ALERT)
            }
        })
    }
}

export { BeaconHistoryApi }