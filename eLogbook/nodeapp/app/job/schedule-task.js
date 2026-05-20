import { loggerFactory } from "../../config/logger.js"
import { clearHistory } from "./clear-history.js"
import { c } from '../../config/constant.js'

const SCHEDULE_WRITE_DB_IN_SECOND = c.SCHEDULE_WRITE_DB_IN_SECOND
const SCHEDULE_CLEAR_HISTORY_IN_HOUR = c.SCHEDULE_CLEAR_HISTORY_IN_HOUR

const logger = loggerFactory('schedule')

class ScheduleTask {
    constructor(mqttProcessor, historyExpiredHours){
        this._mqttProcessor = mqttProcessor
        this._historyExpiredHours = historyExpiredHours
    }

    async schedule() {
        logger.info("History Expired Hours is %d", this._historyExpiredHours)

        this._job1()
        this._job2()
        this._job3()
    }

    async _clearHistory() {
        const count = await clearHistory(this._historyExpiredHours)
        logger.info("clear history %s", count)
    }

    async _job1() {
        await this._mqttProcessor.writeToDb()

        setTimeout(async () => {
            await this._job1()
        }, SCHEDULE_WRITE_DB_IN_SECOND * 1000)
    }

    async _job2() {
        this._mqttProcessor.setBeaconsStatus()

        setTimeout(async () => {
            this._job2()
        }, 1 * 1000)
    }

    async _job3() {
        await this._clearHistory()

        setTimeout(async () => {
            await this._job3()
        }, SCHEDULE_CLEAR_HISTORY_IN_HOUR * 60 * 60 * 1000)
    }
}

export { ScheduleTask }