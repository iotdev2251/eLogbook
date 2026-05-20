import { loggerFactory } from '../../config/logger.js';
import { BEACON_STATUS } from '../beacon/beacon-status.js'

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
        const temperatureData = mfr.substr(12, 4)
        const temperature = this._convertTemperature(temperatureData)
        const battery = parseInt(mfr.substr(16, 2), 16) || 0
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
            beacon.temp = temperature
            beacon.battery = battery
            beacon.rssi = rssi
            beacon.gateway = gateway
            beacon.gateway_id = gateway.id
            beacon.report_at = new Date().toISOString()
            beacon.is_changed = true
            beacon.status = BEACON_STATUS.IN

            this._notify([beacon])
        }
    }

    _convertTemperature(temperatureData){
        try{
            return Buffer.from(temperatureData, 'hex').readInt16LE()
        }
        catch(e){
            // logger.error("Temperature cannot be converted: %s", temperatureData, e)
            return -2730
        }
    }

    async writeToDb() {
        await this._beaconRepository.writeToDb()
    }

    _notify(beacon) {
        this._io.emit('ADDED_DATA', beacon);
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