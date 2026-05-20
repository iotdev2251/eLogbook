import { loggerFactory } from '../../config/logger.js';
import { BEACON_STATUS } from './beacon-status.js';

const logger = loggerFactory('beacon-service')

class BeaconRepository {
    constructor(beaconDataStore) {
        this._beaconDataStore = beaconDataStore
        this._beacons = {}
        this._gateways = {}
    }

    async init(beaconPrefix) {
        await this._initData()
        this._beaconPrefixes = beaconPrefix.split(',');
    }

    async _initData() {
        const allBeacons = await this._beaconDataStore.getAllBeacons()
        this._beacons = {}
        allBeacons.forEach(b => {
            b.mac_addr = b.mac_addr.toUpperCase()
            this._beacons[b.mac_addr] = b
        })

        const allGateways = await this._beaconDataStore.getAllGateways()
        this._gateways = {}
        allGateways.forEach(g => {
            g.mac_addr = g.mac_addr.toUpperCase()
            this._gateways[g.mac_addr.toUpperCase()] = g
        })
    }

    _prepareNewBeacon(mac_addr){
        const beacon = {
            nickname: "?",
            mac_addr: mac_addr.toUpperCase(),
            report_at: new Date().toISOString(),
            rssi: 0,
            status: BEACON_STATUS.IN
        }

        logger.info("New Beacon %s", JSON.stringify(beacon))

        return beacon
    }

    getBeacon(mac_addr) {
        const mac_address = mac_addr || ""
        let beacon = this._beacons[mac_address]

        if (beacon == undefined && this._isAccceptedUnknownBeacon(mac_address)) {
            beacon = this._prepareNewBeacon(mac_address)
            this._beacons[beacon.mac_addr] = beacon
        }
        return beacon
    }

    _isAccceptedUnknownBeacon(mac_addr) {
        for(let i=0; i < this._beaconPrefixes.length; i++){
            const prefix = this._beaconPrefixes[i]
            if(prefix.length > 0 && mac_addr.startsWith(prefix)){
                console.log("Matched !", mac_addr, prefix)
                return true
            }
        }
        return false
    }

    getGateway(mac_addr){
        return this._gateways[mac_addr]
    }

    async writeToDb() {
        let changed = 0
        const history = []
        const startTime = new Date()
        logger.debug("Start Writing DB" + startTime.toLocaleString())
        for (const beaconMacAddr in this._beacons) {
            const beacon = this._beacons[beaconMacAddr]
            if (beacon.is_changed) {
                const r = await this._beaconDataStore.updateBeacon(beacon)
                
                changed++
                beacon.is_changed = false

                history.push(this._convertToHistory(beacon))
            }
        }
        if (changed > 0) {
            logger.info("Updated Records: %d, startTime: %s, time spent: %d", changed, startTime.toLocaleString(), (new Date() - startTime)/1000)
        }
        else {
            logger.info("No Change")
        }

        await this._writeHistory(history)
    }

    async _writeHistory(history) {
        if (history.length > 0) {
            const i = await this._beaconDataStore.insertHistory(history)
            logger.info("Insert History: %d", i.count)
            return i.count
        }
        else{
            return 0
        }
    }

    _convertToHistory(beacon){
        return {
            name: beacon.name,
            nickname: beacon.nickname,
            beacon_mac_addr: beacon.mac_addr,
            report_at: beacon.report_at,
            temp: beacon.temp,
            battery: beacon.battery,
            rssi: beacon.rssi,
            status: beacon.status,
            gateway_mac_addr: beacon.gateway.mac_addr,
            gateway_name: beacon.gateway.name
        }
    }

    getAllBeacons(){
        return this._beacons
    }

    getAllGateways() {
        return this._gateways
    }
}

export { BeaconRepository }