import { loggerFactory } from '../../config/logger.js';
import { BEACON_STATUS } from './beacon-status.js'
import { c } from '../../config/constant.js'

const MAX_RECORD = c.BEACON_API_PAGE_RECORD

function mapBeaconForClient(beacon) {
    if (beacon == null) {
        return null
    }
    return {
        mac_addr: beacon.mac_addr,
        name: beacon.name,
        nickname: beacon.nickname,
        temp: beacon.temp / 10,
        battery: beacon.battery,
        rssi: beacon.rssi,
        status: beacon.status,
        report_at: beacon.report_at,
        gateway_id: beacon.gateway_id,
        gateway_name: beacon.gateway?.name ?? null,
        gateway_mac_addr: beacon.gateway?.mac_addr ?? null,
        alert: (beacon.status == BEACON_STATUS.ALERT)
    }
}

class BeaconApi{
    constructor(beaconRepository){
        this._beaconRepository = beaconRepository
    }

    getAll(startPage) {
        const allBeacons = this._beaconRepository.getAllBeacons()

        const result = []
        let idx = 0;
        for (const b in allBeacons) {
            if(idx < startPage * MAX_RECORD){

            }
            else{
                const beacon = allBeacons[b]
                result.push(mapBeaconForClient(beacon))
            }

            if(result.length >= MAX_RECORD){
                break;
            }
            idx++;
        }
        return result
    }

    get(mac_addr){
        if(mac_addr == null || mac_addr.length == 0){
            return null
        }
        const beacon = this._beaconRepository.getAllBeacons()[mac_addr]
        return mapBeaconForClient(beacon)
    }
}

export { BeaconApi, mapBeaconForClient }