/** Shared validation for temperature (0.1°C storage) and battery %. */

const TEMP_PLAUSIBLE_MIN = 100  // 10.0°C
const TEMP_PLAUSIBLE_MAX = 450  // 45.0°C
const TEMP_UNKNOWN = 9999       // written to DB when clearing bad readings

function isPlausibleSensorTemp(tempTenths) {
    return tempTenths != null && tempTenths >= TEMP_PLAUSIBLE_MIN && tempTenths <= TEMP_PLAUSIBLE_MAX
}

function formatClientTemp(tempTenths) {
    if (tempTenths == null || !isPlausibleSensorTemp(tempTenths)) return null
    return tempTenths / 10
}

function formatClientBattery(battery) {
    if (battery == null || battery < 0 || battery > 100) return null
    return battery
}

function isValidBattery(battery) {
    return battery != null && battery >= 0 && battery <= 100
}

export {
    TEMP_PLAUSIBLE_MIN,
    TEMP_PLAUSIBLE_MAX,
    TEMP_UNKNOWN,
    isPlausibleSensorTemp,
    formatClientTemp,
    formatClientBattery,
    isValidBattery,
}
