import { loggerFactory } from '../../config/logger.js';
import { BEACON_STATUS } from '../beacon/beacon-status.js'
import { mapBeaconForClient } from '../beacon/beacon-api.js'
import { parseMfrPayload } from './mfr-parser.js'

const logger = loggerFactory('mqtt-processor')

class MqttProcessor{
    constructor(beaconRepository){
        this._beaconRepository = beaconRepository
        this._expiredSeconds = 60
    }

    async init(io, expiredSeconds){
        this._expiredSeconds = expiredSeconds
        this._io = io;

        logger.info("Beacon Out Seconds is %d", expiredSeconds)
    }

    async process(json, gatewayMac){
        json.forEach(async (element) => {
            const beacon = this._beaconRepository.getBeacon(element.mac)
            if (beacon != undefined) {
                await this._onBeaconData(element, beacon, this._beaconRepository.getGateway(gatewayMac))
            }
        });
    }

    async _onBeaconData(updatedData, beacon, gateway) {
        const mfr = updatedData.MFR
        if (mfr == undefined) return;

        const parsed = parseMfrPayload(mfr, updatedData.mac)
        const rssi = parseInt(updatedData.rssi) || 1234
            
        const sometimesBefore = new Date()
        sometimesBefore.setSeconds(sometimesBefore.getSeconds() - 2)

        const shouldUpdate = gateway == beacon.gateway 
            || beacon.gateway == null
            || new Date(beacon.report_at) < sometimesBefore
            || rssi > beacon.rssi

        if(shouldUpdate){
            beacon.name = updatedData.name
            beacon.mac_addr = updatedData.mac
            if (parsed.temp != null) {
                beacon.temp = parsed.temp
            }
            if (parsed.battery != null) {
                beacon.battery = parsed.battery
            }
            beacon.rssi = rssi
            beacon.gateway = gateway
            beacon.gateway_id = gateway.id
            beacon.report_at = new Date().toISOString()
            beacon.is_changed = true
            beacon.status = BEACON_STATUS.IN

            this._notify([beacon])
        }
    }

    async writeToDb() {
        await this._beaconRepository.writeToDb()
    }

    _notify(beacons) {
        const payload = beacons.map(mapBeaconForClient)
        this._io.emit('ADDED_DATA', payload);
    }

    setBeaconsStatus() {
        const expired = new Date()
        expired.setSeconds(expired.getSeconds() - this._expiredSeconds)

        const allBeacons = this._beaconRepository.getAllBeacons()
        const notifyBeacons = []
        for (const beaconMacAddr in allBeacons) {
            const beacon = allBeacons[beaconMacAddr]
            if (beacon.status == 'in') {
                const reportAt = new Date(beacon.report_at)
                
                if(reportAt < expired){
                    if(beacon.gateway.check_point){
                        beacon.status = BEACON_STATUS.OUT
                    }
                    else{
                        beacon.status = BEACON_STATUS.ALERT
                    }
                    beacon.is_changed = true
                    notifyBeacons.push(beacon)
                }
            }
        }
        if(notifyBeacons.length > 0){
            this._notify(notifyBeacons)
        }
    }

    getAllGateways(){
        return this._beaconRepository.getAllGateways()
    }
}

export { MqttProcessor }