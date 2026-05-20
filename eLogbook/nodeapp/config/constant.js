import '../config/env.js'

const c = Object.freeze({
    MQTT_HOST: process.env.MQTT_HOST,
    MQTT_PORT: process.env.MQTT_PORT,
    BEACON_API_PAGE_RECORD: 300,
    HISTORY_API_PAGE_RECORD: 300,
    SCHEDULE_WRITE_DB_IN_SECOND: 60,
    SCHEDULE_CLEAR_HISTORY_IN_HOUR: 24,

})

export { c }